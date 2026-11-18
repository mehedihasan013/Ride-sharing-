import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';
import { isDemoMode } from '../../common/demo';
import { WalletService, WalletRecord, WalletTransactionRecord } from '../wallet/wallet.service';
import { RidesService } from '../rides/rides.service';
import { RidesGateway } from '../rides/rides.gateway';
import {
  BkashPaymentRecord,
  BkashGrantTokenResponse,
  BkashCreatePaymentResponse,
  BkashExecutePaymentResponse,
} from './bkash.interfaces';

@Injectable()
export class BkashService {
  private readonly logger = new Logger(BkashService.name);
  private readonly payments = new Map<string, BkashPaymentRecord>();

  private cachedIdToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly walletService: WalletService,
    private readonly ridesService: RidesService,
    private readonly ridesGateway: RidesGateway,
  ) {
    this.hydratePayments();
    this.prismaService.registerResetListener(() => {
      this.hydratePayments();
    });
  }

  private hydratePayments() {
    this.payments.clear();
    const stored = this.prismaService.getBkashPayments();
    if (Array.isArray(stored) && stored.length > 0) {
      for (const p of stored) {
        if (p && p.paymentID) {
          this.payments.set(p.paymentID, {
            ...p,
            amountBdt: Number(p.amountBdt),
          });
        }
      }
      this.logger.log(
        `Restored ${this.payments.size} bKash payments from durable state`,
      );
    }
  }

  getMode(): 'MOCK' | 'SANDBOX' {
    const raw = (process.env.BKASH_MODE || 'mock').trim().toLowerCase();
    return raw === 'sandbox' ? 'SANDBOX' : 'MOCK';
  }

  private getBaseUrl(): string {
    return (
      process.env.BKASH_BASE_URL ||
      'https://tokenized.sandbox.bka.sh/v1.2.0-beta'
    ).replace(/\/+$/, '');
  }

  private getCallbackUrl(callbackBaseUrl?: string): string {
    if (callbackBaseUrl) {
      return `${callbackBaseUrl.replace(/\/+$/, '')}/payments/bkash/callback`;
    }
    return (
      process.env.BKASH_CALLBACK_URL ||
      'http://localhost:4000/payments/bkash/callback'
    );
  }

  private isRealSandboxConfigured(): boolean {
    if (this.getMode() !== 'SANDBOX') {
      return false;
    }
    const appKey = process.env.BKASH_APP_KEY || '';
    const appSecret = process.env.BKASH_APP_SECRET || '';
    const username = process.env.BKASH_USERNAME || '';
    const password = process.env.BKASH_PASSWORD || '';

    if (!appKey || !appSecret || !username || !password) {
      return false;
    }

    const placeholders = ['placeholder', 'your_', 'sandbox_app_key', 'changeme', 'demo'];
    const combined = `${appKey} ${appSecret} ${username} ${password}`.toLowerCase();
    return !placeholders.some((p) => combined.includes(p));
  }

  /**
   * Step 1: Grant Token (POST /tokenized/checkout/token/grant)
   * Caches id_token for 55 minutes (3300s) out of 3600s lifetime.
   */
  async grantToken(): Promise<BkashGrantTokenResponse> {
    const now = Date.now();
    if (this.cachedIdToken && now < this.tokenExpiresAt) {
      return {
        id_token: this.cachedIdToken,
        token_type: 'Bearer',
        expires_in: Math.max(60, Math.floor((this.tokenExpiresAt - now) / 1000)),
        statusCode: '0000',
        statusMessage: 'Successful',
      };
    }

    if (this.isRealSandboxConfigured()) {
      const baseUrl = this.getBaseUrl();
      const username = process.env.BKASH_USERNAME || '';
      const password = process.env.BKASH_PASSWORD || '';
      const appKey = process.env.BKASH_APP_KEY || '';
      const appSecret = process.env.BKASH_APP_SECRET || '';

      const res = await axios.post<BkashGrantTokenResponse>(
        `${baseUrl}/tokenized/checkout/token/grant`,
        {
          app_key: appKey,
          app_secret: appSecret,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            username,
            password,
          },
          timeout: 10000,
        },
      );

      if (!res.data || !res.data.id_token) {
        throw new BadRequestException(
          `bKash token grant failed: ${res.data?.statusMessage || 'Unknown error'}`,
        );
      }

      this.cachedIdToken = res.data.id_token;
      this.tokenExpiresAt = now + 55 * 60 * 1000;
      return res.data;
    }

    const mockToken = `mock_bkash_jwt_token_${now}`;
    this.cachedIdToken = mockToken;
    this.tokenExpiresAt = now + 55 * 60 * 1000;

    return {
      id_token: mockToken,
      token_type: 'Bearer',
      expires_in: 3600,
      statusCode: '0000',
      statusMessage: 'Successful',
    };
  }

  /**
   * Step 2: Create Tokenized Checkout Payment (POST /tokenized/checkout/create)
   */
  async createPayment(
    driverId: string,
    amountBdt: number,
    callbackBaseUrl?: string,
  ): Promise<BkashPaymentRecord> {
    if (!driverId || typeof driverId !== 'string') {
      throw new BadRequestException('driverId is required');
    }

    const numericAmount = Number(amountBdt);
    if (!Number.isFinite(numericAmount) || numericAmount < 20 || numericAmount > 25000) {
      throw new BadRequestException(
        'নূন্যতম বিকাশ রিচার্জ ২০ টাকা এবং সর্বোচ্চ ২৫,০০০ টাকা',
      );
    }

    if (process.env.NODE_ENV === 'production') {
      if (!isDemoMode() && (!this.isRealSandboxConfigured() || !process.env.BKASH_CALLBACK_URL)) {
        throw new BadRequestException('bKash is not configured');
      }
      callbackBaseUrl = undefined; // never trust a client-supplied callback host in production
    }

    const invoiceNumber = `INV-CB-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const tokenRes = await this.grantToken();
    const idToken = tokenRes.id_token;

    const callbackURL = this.getCallbackUrl(callbackBaseUrl);
    const baseHost = callbackBaseUrl
      ? callbackBaseUrl.replace(/\/+$/, '')
      : callbackURL.replace(/\/payments\/bkash\/callback.*$/, '') || 'http://localhost:4000';

    let paymentID: string;
    let bkashURL: string;
    const mode = this.getMode();

    if (this.isRealSandboxConfigured()) {
      const baseUrl = this.getBaseUrl();
      const appKey = process.env.BKASH_APP_KEY || '';

      const res = await axios.post<BkashCreatePaymentResponse>(
        `${baseUrl}/tokenized/checkout/create`,
        {
          mode: '0011',
          payerReference: driverId,
          callbackURL,
          amount: numericAmount.toFixed(2),
          currency: 'BDT',
          intent: 'sale',
          merchantInvoiceNumber: invoiceNumber,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: idToken,
            'X-APP-Key': appKey,
          },
          timeout: 10000,
        },
      );

      if (!res.data || !res.data.paymentID) {
        throw new BadRequestException(
          `bKash create payment failed: ${res.data?.statusMessage || 'Unknown error'}`,
        );
      }

      paymentID = res.data.paymentID;
      bkashURL = res.data.bkashURL;
    } else {
      paymentID =
        'TR0011' +
        Date.now() +
        Math.random().toString(36).substring(2, 6).toUpperCase();
      bkashURL = `${baseHost}/payments/bkash/mock/checkout?paymentID=${paymentID}`;
    }

    const record: BkashPaymentRecord = {
      id: `bkp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      paymentID,
      driverId,
      amountBdt: Number(numericAmount.toFixed(2)),
      invoiceNumber,
      mode,
      status: 'INITIATED',
      bkashURL,
      createdAt: new Date().toISOString(),
    };

    this.payments.set(paymentID, record);
    this.prismaService.upsertBkashPayment(record);
    this.logger.log(
      `Created bKash payment ${paymentID} (${mode}) for driver ${driverId}: ${record.amountBdt} BDT [Invoice: ${invoiceNumber}]`,
    );

    return record;
  }

  /**
   * Internal server-to-server execute call (POST /tokenized/checkout/execute)
   */
  private async executePaymentOnGateway(
    record: BkashPaymentRecord,
  ): Promise<{ trxID: string; customerMsisdn?: string }> {
    try {
      const tokenRes = await this.grantToken();
      const idToken = tokenRes.id_token;

      if (this.isRealSandboxConfigured()) {
        const baseUrl = this.getBaseUrl();
        const appKey = process.env.BKASH_APP_KEY || '';

        const res = await axios.post<BkashExecutePaymentResponse>(
          `${baseUrl}/tokenized/checkout/execute`,
          {
            paymentID: record.paymentID,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: idToken,
              'X-APP-Key': appKey,
            },
            timeout: 10000,
          },
        );

        if (
          !res.data ||
          res.data.transactionStatus !== 'Completed' ||
          Number(res.data.amount) !== record.amountBdt
        ) {
          record.status = 'FAILED';
          this.prismaService.upsertBkashPayment(record);
          throw new BadRequestException(
            `bKash execute verification failed: ${res.data?.statusMessage || 'Invalid transactionStatus or amount mismatch'}`,
          );
        }

        return {
          trxID: res.data.trxID,
          customerMsisdn: res.data.customerMsisdn,
        };
      }

      // Mock execute credits a wallet with no real money; a mock record restored from state must not pay out in production
      if (process.env.NODE_ENV === 'production' && !isDemoMode()) {
        throw new BadRequestException('bKash is not configured');
      }
      const trxID = `BKH${Math.floor(1000000 + Math.random() * 9000000)}M`;
      return { trxID };
    } catch (err) {
      if (record.status !== 'FAILED') {
        record.status = 'FAILED';
        this.prismaService.upsertBkashPayment(record);
      }
      throw err;
    }
  }

  /**
   * Step 3: Execute Callback / Finalize Payment with Replay / Idempotency Protection
   */
  async executeCallback(
    paymentID: string,
    status = 'success',
    customerMsisdn?: string,
  ): Promise<{
    alreadyCompleted: boolean;
    payment: BkashPaymentRecord;
    transaction?: WalletTransactionRecord;
    wallet: WalletRecord;
  }> {
    if (!paymentID) {
      throw new BadRequestException('paymentID is required');
    }

    const record = this.payments.get(paymentID);
    if (!record) {
      throw new NotFoundException(`bKash payment ${paymentID} not found`);
    }

    // Strict Idempotency Check: Never credit wallet twice if callback/execute is replayed!
    if (record.status === 'COMPLETED') {
      const wallet = this.walletService.getWallet(record.driverId);
      const existingTransaction = this.walletService
        .getDriverTransactions(record.driverId)
        .find((t) => t.gatewayTrxId === record.trxID);

      this.logger.warn(
        `Idempotent replay blocked for already completed bKash paymentID ${paymentID} (trxID: ${record.trxID})`,
      );

      return {
        alreadyCompleted: true,
        payment: record,
        transaction: existingTransaction,
        wallet,
      };
    }

    const normalizedStatus = (status || 'success').trim().toLowerCase();

    if (
      normalizedStatus === 'cancel' ||
      normalizedStatus === 'cancelled' ||
      normalizedStatus === 'failure' ||
      normalizedStatus === 'failed'
    ) {
      record.status = normalizedStatus.startsWith('cancel') ? 'CANCELLED' : 'FAILED';
      this.prismaService.upsertBkashPayment(record);
      const wallet = this.walletService.getWallet(record.driverId);
      this.logger.log(
        `bKash payment ${paymentID} marked as ${record.status} for driver ${record.driverId}`,
      );
      return {
        alreadyCompleted: false,
        payment: record,
        wallet,
      };
    }

    // Execute payment on bKash gateway (or mock gateway)
    const gatewayExec = await this.executePaymentOnGateway(record);
    const trxID = gatewayExec.trxID;

    // Credit driver wallet
    const transaction = await this.walletService.topupViaBkash(
      record.driverId,
      record.amountBdt,
      trxID,
      'BKASH',
    );
    const updatedWallet = this.walletService.getWallet(record.driverId);

    record.status = 'COMPLETED';
    record.trxID = trxID;
    record.completedAt = new Date().toISOString();
    record.customerMsisdn =
      customerMsisdn || gatewayExec.customerMsisdn || '01811223304';
    this.prismaService.upsertBkashPayment(record);

    // Sync online driver balance in RidesService so bidding lockout (>= 50 BDT) unlocks immediately
    this.ridesService.syncDriverWalletBalance(
      record.driverId,
      updatedWallet.currentBalance,
    );

    // Broadcast real-time WALLET_TOPUP event to Web Admin & Dispatch Command Center
    this.ridesGateway.broadcastAdminEvent('WALLET_TOPUP', {
      driverId: record.driverId,
      amountBdt: record.amountBdt,
      method: 'BKASH',
      paymentID: record.paymentID,
      trxId: trxID,
      transaction,
      wallet: updatedWallet,
      messageBangla: `৳ বিকাশ রিচার্জ সফল: ${updatedWallet.driverName || record.driverId} (+${record.amountBdt} টাকা, TrxID: ${trxID}, বর্তমান ব্যালেন্স: ${updatedWallet.currentBalance} টাকা)`,
    });

    this.logger.log(
      `bKash payment ${paymentID} COMPLETED [TrxID: ${trxID}] -> Driver ${record.driverId} credited +${record.amountBdt} BDT (Balance: ${updatedWallet.currentBalance} BDT)`,
    );

    return {
      alreadyCompleted: false,
      payment: record,
      transaction,
      wallet: updatedWallet,
    };
  }

  getPaymentStatus(paymentID: string): {
    payment: BkashPaymentRecord;
    wallet: WalletRecord;
  } {
    const record = this.payments.get(paymentID);
    if (!record) {
      throw new NotFoundException(`bKash payment ${paymentID} not found`);
    }
    const wallet = this.walletService.getWallet(record.driverId);
    return {
      payment: record,
      wallet,
    };
  }

  getAllPayments(): BkashPaymentRecord[] {
    return Array.from(this.payments.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
}
