import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface DurableAppState {
  version: number;
  updatedAt: string;
  wallets: any[];
  transactions: any[];
  rides: any[];
  onlineDrivers: any[];
  kycApplications: any[];
  bkashPayments: any[];
  sosEvents: any[];
  users: any[];
}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public isPostgresConnected = false;
  private pgClient: any = null;
  private syncQueue: Promise<void> = Promise.resolve();
  private readonly stateDir: string;
  private readonly stateFilePath: string;
  private state: DurableAppState;
  private resetListeners: Array<() => void> = [];

  constructor() {
    this.stateDir = path.resolve(__dirname, '..', '..', 'data');
    this.stateFilePath = path.join(this.stateDir, 'cholobhairab-state.json');
    this.state = this.createEmptyState();
    this.loadState();
  }

  private createEmptyState(): DurableAppState {
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      wallets: [],
      transactions: [],
      rides: [],
      onlineDrivers: [],
      kycApplications: [],
      bkashPayments: [],
      sosEvents: [],
      users: [],
    };
  }

  private isPlaceholderDatabaseUrl(dbUrl: string): boolean {
    if (!dbUrl || !dbUrl.trim()) {
      return true;
    }
    const upper = dbUrl.toUpperCase();
    return (
      upper.includes('[PASSWORD]') ||
      upper.includes('[YOUR-PASSWORD]') ||
      upper.includes('YOUR_PASSWORD') ||
      upper.includes('YOUR-PASSWORD') ||
      dbUrl.includes('localhost:5432/cholobhairab')
    );
  }

  async onModuleInit() {
    const dbUrl = process.env.DATABASE_URL || '';
    const isPlaceholder = this.isPlaceholderDatabaseUrl(dbUrl);

    if (!isPlaceholder) {
      try {
        // Attempt live Supabase PostgreSQL connection with a 3-second timeout
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { PrismaClient } = require('@prisma/client');
        this.pgClient = new PrismaClient({
          datasources: { db: { url: dbUrl } },
        });
        await Promise.race([
          this.pgClient.$connect(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Postgres connection timeout (3s)')), 3000),
          ),
        ]);
        this.isPostgresConnected = true;
        this.logger.log('Connected to live Supabase PostgreSQL database + Durable Disk Store');
        // Copy what is already on disk, so the database does not wait for the next save.
        this.queueSync(() => this.syncAllToPostgres());
      } catch (err: any) {
        this.isPostgresConnected = false;
        this.pgClient = null;
        this.logger.warn(
          `Supabase Postgres connection unavailable (${err?.message || 'offline'}); using Durable Disk Store (${this.stateFilePath})`,
        );
      }
    } else {
      this.isPostgresConnected = false;
      this.logger.log(
        `Durable State Store active at ${this.stateFilePath} (Supabase project fmhbugcullfemxtevpxw ready)`,
      );
    }
  }

  async onModuleDestroy() {
    this.saveState();
    if (this.pgClient && this.isPostgresConnected) {
      try {
        await this.pgClient.$disconnect();
      } catch {
        // ignore disconnect errors on shutdown
      }
    }
  }

  private ensureDirectory() {
    if (!fs.existsSync(this.stateDir)) {
      fs.mkdirSync(this.stateDir, { recursive: true });
    }
  }

  loadState(): DurableAppState {
    try {
      this.ensureDirectory();
      if (fs.existsSync(this.stateFilePath)) {
        const raw = fs.readFileSync(this.stateFilePath, 'utf8');
        if (raw && raw.trim().length > 0) {
          const parsed = JSON.parse(raw);
          this.state = {
            ...this.createEmptyState(),
            ...parsed,
          };
          return this.state;
        }
      }
    } catch (err: any) {
      this.logger.warn(`Failed to read state file, initializing fresh state: ${err?.message}`);
    }
    this.state = this.createEmptyState();
    return this.state;
  }

  saveState(partial?: Partial<DurableAppState>): DurableAppState {
    try {
      this.ensureDirectory();
      if (partial) {
        this.state = {
          ...this.state,
          ...partial,
          updatedAt: new Date().toISOString(),
        };
      } else {
        this.state.updatedAt = new Date().toISOString();
      }
      const serialized = JSON.stringify(this.state, null, 2);
      // Atomic write: a crash mid-write leaves the old file intact instead of a truncated one
      const tmpPath = `${this.stateFilePath}.tmp`;
      fs.writeFileSync(tmpPath, serialized, 'utf8');
      fs.renameSync(tmpPath, this.stateFilePath);
    } catch (err: any) {
      this.logger.error(`Failed to persist state to disk: ${err?.message}`);
    }
    return this.state;
  }

  getState(): DurableAppState {
    return this.state;
  }

  registerResetListener(listener: () => void) {
    this.resetListeners.push(listener);
  }

  resetSeedState(): DurableAppState {
    this.state = this.createEmptyState();
    try {
      this.ensureDirectory();
      if (fs.existsSync(this.stateFilePath)) {
        fs.unlinkSync(this.stateFilePath);
      }
    } catch {
      // ignore unlink error
    }
    for (const listener of this.resetListeners) {
      try {
        listener();
      } catch (err: any) {
        this.logger.warn(`Reset listener error: ${err?.message}`);
      }
    }
    this.saveState();
    this.logger.log('Durable state reset to clean initial Bhairab seed state');
    return this.state;
  }

  resetToSeedState(): DurableAppState {
    return this.resetSeedState();
  }

  // Domain-specific persistence helpers
  getWallets(): any[] {
    return this.state.wallets || [];
  }

  getTransactions(): any[] {
    return this.state.transactions || [];
  }

  saveWalletsAndTransactions(wallets: any[], transactions: any[]) {
    this.saveState({ wallets, transactions });
    this.queueSync(() => this.syncWalletsToPostgres(wallets, transactions));
  }

  getRides(): any[] {
    return this.state.rides || [];
  }

  getOnlineDrivers(): any[] {
    return this.state.onlineDrivers || [];
  }

  saveRidesAndDrivers(rides: any[], onlineDrivers?: any[]) {
    const update: Partial<DurableAppState> = { rides };
    if (onlineDrivers !== undefined) {
      update.onlineDrivers = onlineDrivers;
    }
    this.saveState(update);
    this.queueSync(() => this.syncRidesToPostgres(rides));
  }

  getKycApplications(): any[] {
    return this.state.kycApplications || [];
  }

  saveKycApplications(kycApplications: any[]) {
    this.saveState({ kycApplications });
    this.queueSync(() => this.syncKycToPostgres(kycApplications));
  }

  getBkashPayments(): any[] {
    return this.state.bkashPayments || [];
  }

  saveBkashPayments(bkashPayments: any[]) {
    this.saveState({ bkashPayments });
  }

  upsertBkashPayment(payment: any) {
    const list = [...(this.state.bkashPayments || [])];
    const idx = list.findIndex(
      (p) => p.paymentID === payment.paymentID || (p.id && p.id === payment.id),
    );
    if (idx >= 0) {
      list[idx] = payment;
    } else {
      list.push(payment);
    }
    this.saveState({ bkashPayments: list });
    this.queueSync(() => this.syncBkashPaymentToPostgres(payment));
  }

  recordSosEvent(event: {
    id: string;
    rideId: string;
    triggeredBy?: string;
    resolved: boolean;
    createdAt: string;
    resolvedAt?: string;
  }) {
    const events = [...(this.state.sosEvents || [])];
    events.push(event);
    this.saveState({ sosEvents: events });
    this.queueSync(() => this.syncSosToPostgres(event));
  }

  getUsers(): any[] {
    return this.state.users || [];
  }

  saveUsers(users: any[]) {
    this.saveState({ users });
    this.queueSync(() => this.syncUsersToPostgres(users));
  }

  // Best-effort Supabase Postgres mirror of the disk state. Disk stays the source of truth.

  // One sync at a time, so two saves never race to create the same driver or passenger row.
  private queueSync(job: () => Promise<void>) {
    if (!this.pgClient || !this.isPostgresConnected) return;
    this.syncQueue = this.syncQueue
      .then(job)
      .catch((err: any) => this.logger.warn(`Postgres sync warning: ${err?.message}`));
  }

  // A bad row is logged and skipped instead of blocking every row after it.
  private async syncEach<T>(label: string, items: T[], fn: (item: T) => Promise<void>) {
    for (const item of items || []) {
      try {
        await fn(item);
      } catch (err: any) {
        this.logger.warn(`Postgres ${label} sync skipped a row: ${err?.message}`);
      }
    }
  }

  private async syncAllToPostgres() {
    const s = this.state;
    await this.syncUsersToPostgres(s.users || []);
    await this.syncWalletsToPostgres(s.wallets || [], s.transactions || []);
    await this.syncKycToPostgres(s.kycApplications || []);
    await this.syncRidesToPostgres(s.rides || []);
    for (const payment of s.bkashPayments || []) await this.syncBkashPaymentToPostgres(payment);
    for (const event of s.sosEvents || []) await this.syncSosToPostgres(event);
  }

  // Returns the row id to reference: a phone number already saved keeps the id it was first saved with.
  private async ensureUser(
    id: string,
    fullName?: string,
    phone?: string,
    role: 'PASSENGER' | 'DRIVER' | 'ADMIN' = 'PASSENGER',
  ): Promise<string> {
    const byId = await this.pgClient.user.findUnique({ where: { id }, select: { id: true } });
    if (byId) return byId.id;
    const phoneNumber = phone || id;
    const byPhone = await this.pgClient.user.findUnique({ where: { phoneNumber }, select: { id: true } });
    if (byPhone) return byPhone.id;
    await this.pgClient.user.create({ data: { id, phoneNumber, fullName: fullName || id, role } });
    return id;
  }

  private async ensureDriver(id: string, fullName?: string, phone?: string, nidNumber?: string) {
    const found = await this.pgClient.driver.findUnique({ where: { id }, select: { id: true } });
    if (found) return;
    const userId = await this.ensureUser(id, fullName, phone, 'DRIVER');
    // shortcut: a driver seen before their KYC gets a placeholder NID; syncKycToPostgres fills the real one.
    await this.pgClient.driver.create({
      data: { id, userId, nidNumber: nidNumber || `pending_${id}` },
    });
  }

  private async syncUsersToPostgres(users: any[]) {
    await this.syncEach('user', users, async (u) => {
      if (!u?.id) return;
      if (u.role === 'DRIVER') {
        await this.ensureDriver(u.id, u.fullName, u.phoneNumber);
      } else {
        await this.ensureUser(u.id, u.fullName, u.phoneNumber, u.role);
      }
    });
  }

  private async syncWalletsToPostgres(wallets: any[], transactions: any[]) {
    await this.syncEach('wallet', wallets, async (w) => {
      await this.ensureDriver(w.driverId, w.driverName, w.driverPhone);
      const dbWallet = await this.pgClient.driverWallet.upsert({
        where: { driverId: w.driverId },
        update: {
          currentBalance: w.currentBalance,
          lastTopupAt: w.lastTopupAt ? new Date(w.lastTopupAt) : undefined,
        },
        create: {
          id: `wallet_${w.driverId}`,
          driverId: w.driverId,
          currentBalance: w.currentBalance,
          lastTopupAt: w.lastTopupAt ? new Date(w.lastTopupAt) : undefined,
        },
      });

      const driverTxs = transactions.filter((t) => t.driverId === w.driverId);
      await this.syncEach('wallet transaction', driverTxs, async (tx) => {
        await this.pgClient.walletTransaction.upsert({
          where: { id: tx.id },
          update: {},
          create: {
            id: tx.id,
            walletId: dbWallet.id,
            driverId: tx.driverId,
            type: tx.type === 'ADMIN_MANUAL_TOPUP' ? 'BONUS' : tx.type,
            amount: tx.amount,
            balanceAfter: tx.balanceAfter,
            referenceRideId: tx.referenceRideId || null,
            gatewayTrxId: tx.gatewayTrxId || null,
            note: tx.noteBangla || null,
            createdAt: tx.createdAt ? new Date(tx.createdAt) : new Date(),
          },
        });
      });
    });
  }

  private async syncKycToPostgres(kycApplications: any[]) {
    await this.syncEach('KYC', kycApplications, async (k) => {
      await this.ensureDriver(k.driverId, k.fullName, k.phoneNumber, k.nidNumber);
      const fields = {
        fullName: k.fullName,
        phoneNumber: k.phoneNumber,
        nidNumber: k.nidNumber,
        vehicleType: k.vehicleType,
        vehicleModel: k.vehicleModel,
        registrationNumber: k.registrationNumber,
        brtaLicenseNo: k.brtaLicenseNo,
        unionCouncilorCert: k.unionCouncilorCert,
        wardNo: k.wardNo,
        status: k.status,
        note: k.note || null,
      };
      await this.pgClient.driverKycApplication.upsert({
        where: { driverId: k.driverId },
        update: fields,
        create: {
          id: k.id,
          driverId: k.driverId,
          ...fields,
          submittedAt: k.submittedAt ? new Date(k.submittedAt) : new Date(),
        },
      });
      await this.pgClient.driver.updateMany({
        where: { id: k.driverId, nidNumber: { startsWith: 'pending_' } },
        data: { nidNumber: k.nidNumber },
      });
    });
  }

  private async syncRidesToPostgres(rides: any[]) {
    await this.syncEach('ride', rides, async (r) => {
      const passengerId = await this.ensureUser(r.passengerId, r.passengerName, r.passengerPhone);
      if (r.selectedDriverId) {
        const bid = (r.bids || []).find((b: any) => b.driverId === r.selectedDriverId);
        await this.ensureDriver(r.selectedDriverId, bid?.driverName, bid?.driverPhone);
      }
      await this.pgClient.ride.upsert({
        where: { id: r.id },
        update: {
          driverId: r.selectedDriverId || null,
          status: r.status,
          finalAgreedFare: r.finalAgreedFare ?? null,
          platformCommissionAmount: r.commissionBdt ?? null,
          isSosTriggered: Boolean(r.sosActive),
        },
        create: {
          id: r.id,
          passengerId,
          driverId: r.selectedDriverId || null,
          vehicleType: r.vehicleType,
          pickupLat: r.pickupLat,
          pickupLng: r.pickupLng,
          pickupAddress: r.pickupAddress,
          dropoffLat: r.dropoffLat,
          dropoffLng: r.dropoffLng,
          dropoffAddress: r.dropoffAddress,
          initialOfferFare: r.initialOfferFare,
          finalAgreedFare: r.finalAgreedFare ?? null,
          platformCommissionAmount: r.commissionBdt ?? null,
          audioPromptBangla: r.audioPromptBangla || null,
          status: r.status,
          liveTrackingToken: r.liveTrackingToken,
          isSosTriggered: Boolean(r.sosActive),
        },
      });
    });
  }

  private async syncBkashPaymentToPostgres(payment: any) {
    await this.syncEach('bKash payment', [payment], async (p) => {
      await this.ensureDriver(p.driverId);
      await this.pgClient.bkashPayment.upsert({
        where: { paymentId: p.paymentID },
        update: {
          status: p.status,
          trxId: p.trxID || null,
          customerMsisdn: p.customerMsisdn || null,
          completedAt: p.completedAt ? new Date(p.completedAt) : null,
        },
        create: {
          id: p.id,
          paymentId: p.paymentID,
          driverId: p.driverId,
          amountBdt: p.amountBdt,
          invoiceNumber: p.invoiceNumber,
          status: p.status,
          mode: p.mode || 'MOCK',
          payerReference: p.driverId,
          trxId: p.trxID || null,
          bkashUrl: p.bkashURL || null,
          customerMsisdn: p.customerMsisdn || null,
          createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
          completedAt: p.completedAt ? new Date(p.completedAt) : null,
        },
      });
    });
  }

  private async syncSosToPostgres(event: any) {
    await this.syncEach('SOS', [event], async (e) => {
      // shortcut: an SOS whose ride row isn't in Postgres yet is copied by the full sync at the next start.
      const rideExists = await this.pgClient.ride.findUnique({ where: { id: e.rideId }, select: { id: true } });
      if (!rideExists) return;
      await this.pgClient.sosEvent.upsert({
        where: { id: e.id },
        update: {
          resolved: e.resolved,
          resolvedAt: e.resolvedAt ? new Date(e.resolvedAt) : null,
        },
        create: {
          id: e.id,
          rideId: e.rideId,
          triggeredBy: e.triggeredBy || 'PASSENGER',
          resolved: e.resolved,
          createdAt: new Date(e.createdAt),
          resolvedAt: e.resolvedAt ? new Date(e.resolvedAt) : null,
        },
      });
    });
  }

  getStatus() {
    return {
      connected: true,
      engine: this.isPostgresConnected
        ? 'supabase-postgres+durable-disk'
        : 'durable-disk+supabase-ready',
      isPostgresConnected: this.isPostgresConnected,
      supabaseProjectRef: 'fmhbugcullfemxtevpxw',
      supabaseUrl: process.env.SUPABASE_URL || 'https://fmhbugcullfemxtevpxw.supabase.co',
      stateFilePath: this.stateFilePath,
      updatedAt: this.state.updatedAt,
      counts: {
        wallets: (this.state.wallets || []).length,
        transactions: (this.state.transactions || []).length,
        rides: (this.state.rides || []).length,
        kycApplications: (this.state.kycApplications || []).length,
        bkashPayments: (this.state.bkashPayments || []).length,
      },
    };
  }
}
