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
      fs.writeFileSync(this.stateFilePath, serialized, 'utf8');
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
    if (this.isPostgresConnected && this.pgClient) {
      void this.syncWalletsToPostgres(wallets, transactions);
    }
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
    if (this.isPostgresConnected && this.pgClient) {
      void this.syncRidesToPostgres(rides);
    }
  }

  getKycApplications(): any[] {
    return this.state.kycApplications || [];
  }

  saveKycApplications(kycApplications: any[]) {
    this.saveState({ kycApplications });
    if (this.isPostgresConnected && this.pgClient) {
      void this.syncKycToPostgres(kycApplications);
    }
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
    if (this.isPostgresConnected && this.pgClient) {
      void this.syncBkashPaymentToPostgres(payment);
    }
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
    if (this.isPostgresConnected && this.pgClient) {
      void this.syncSosToPostgres(event);
    }
  }

  getUsers(): any[] {
    return this.state.users || [];
  }

  saveUsers(users: any[]) {
    this.saveState({ users });
  }

  // Asynchronous Supabase Postgres synchronization helpers (best-effort alongside durable disk state)
  private async syncWalletsToPostgres(wallets: any[], transactions: any[]) {
    if (!this.pgClient || !this.isPostgresConnected) return;
    try {
      for (const w of wallets) {
        const driverExists = await this.pgClient.driver.findUnique({
          where: { id: w.driverId },
          select: { id: true },
        });
        if (!driverExists) continue;

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
        for (const tx of driverTxs) {
          const pgType =
            tx.type === 'ADMIN_MANUAL_TOPUP' ? 'BONUS' : tx.type;
          await this.pgClient.walletTransaction.upsert({
            where: { id: tx.id },
            update: {},
            create: {
              id: tx.id,
              walletId: dbWallet.id,
              driverId: tx.driverId,
              type: pgType,
              amount: tx.amount,
              balanceAfter: tx.balanceAfter,
              referenceRideId: tx.referenceRideId || null,
              gatewayTrxId: tx.gatewayTrxId || null,
              note: tx.noteBangla || null,
              createdAt: tx.createdAt ? new Date(tx.createdAt) : new Date(),
            },
          });
        }
      }
    } catch (err: any) {
      this.logger.warn(`Async Postgres wallet sync warning: ${err?.message}`);
    }
  }

  private async syncKycToPostgres(kycApplications: any[]) {
    if (!this.pgClient || !this.isPostgresConnected) return;
    try {
      for (const k of kycApplications) {
        await this.pgClient.driverKycApplication.updateMany({
          where: { id: k.id },
          data: {
            status: k.status,
            note: k.note || null,
          },
        });
      }
    } catch (err: any) {
      this.logger.warn(`Async Postgres KYC sync warning: ${err?.message}`);
    }
  }

  private async syncRidesToPostgres(rides: any[]) {
    if (!this.pgClient || !this.isPostgresConnected) return;
    try {
      for (const r of rides) {
        const passengerExists = await this.pgClient.user.findUnique({
          where: { id: r.passengerId },
          select: { id: true },
        });
        if (!passengerExists) continue;

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
            passengerId: r.passengerId,
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
      }
    } catch (err: any) {
      this.logger.warn(`Async Postgres rides sync warning: ${err?.message}`);
    }
  }

  private async syncBkashPaymentToPostgres(payment: any) {
    if (!this.pgClient || !this.isPostgresConnected) return;
    try {
      await this.pgClient.bkashPayment.upsert({
        where: { paymentId: payment.paymentID },
        update: {
          status: payment.status,
          trxId: payment.trxID || null,
          customerMsisdn: payment.customerMsisdn || null,
          completedAt: payment.completedAt ? new Date(payment.completedAt) : null,
        },
        create: {
          id: payment.id,
          paymentId: payment.paymentID,
          driverId: payment.driverId,
          amountBdt: payment.amountBdt,
          invoiceNumber: payment.invoiceNumber,
          status: payment.status,
          mode: payment.mode || 'MOCK',
          payerReference: payment.driverId,
          trxId: payment.trxID || null,
          bkashUrl: payment.bkashURL || null,
          customerMsisdn: payment.customerMsisdn || null,
          createdAt: payment.createdAt ? new Date(payment.createdAt) : new Date(),
          completedAt: payment.completedAt ? new Date(payment.completedAt) : null,
        },
      });
    } catch (err: any) {
      this.logger.warn(`Async Postgres bKash payment sync warning: ${err?.message}`);
    }
  }

  private async syncSosToPostgres(event: any) {
    if (!this.pgClient || !this.isPostgresConnected) return;
    try {
      const rideExists = await this.pgClient.ride.findUnique({
        where: { id: event.rideId },
        select: { id: true },
      });
      if (!rideExists) return;

      await this.pgClient.sosEvent.upsert({
        where: { id: event.id },
        update: {
          resolved: event.resolved,
          resolvedAt: event.resolvedAt ? new Date(event.resolvedAt) : null,
        },
        create: {
          id: event.id,
          rideId: event.rideId,
          triggeredBy: event.triggeredBy || 'PASSENGER',
          resolved: event.resolved,
          createdAt: new Date(event.createdAt),
          resolvedAt: event.resolvedAt ? new Date(event.resolvedAt) : null,
        },
      });
    } catch (err: any) {
      this.logger.warn(`Async Postgres SOS sync warning: ${err?.message}`);
    }
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
