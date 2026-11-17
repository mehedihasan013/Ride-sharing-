import { Injectable, Logger, BadRequestException } from '@nestjs/common';

export interface WalletRecord {
  driverId: string;
  driverName?: string;
  driverPhone?: string;
  vehicleType?: 'BIKE' | 'CNG' | 'EASYBIKE' | 'CAR_MICROBUS';
  vehicleModel?: string;
  currentBalance: number;
  lastTopupAt?: Date;
}

export interface WalletTransactionRecord {
  id: string;
  driverId: string;
  driverName?: string;
  type: 'BKASH_TOPUP' | 'NAGAD_TOPUP' | 'COMMISSION_DEDUCTION' | 'PROMOTIONAL_BONUS';
  amount: number;
  balanceAfter: number;
  referenceRideId?: string;
  gatewayTrxId?: string;
  noteBangla: string;
  createdAt: Date;
}

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  // In-memory driver balance and ledger (backed by PostgreSQL in production)
  private wallets = new Map<string, WalletRecord>();
  private transactions: WalletTransactionRecord[] = [];

  constructor() {
    this.seedBhairabFleetWallets();
  }

  private seedBhairabFleetWallets() {
    const now = Date.now();
    const initialDrivers: WalletRecord[] = [
      {
        driverId: 'driver_demo_1',
        driverName: 'মোঃ রফিকুল ইসলাম',
        driverPhone: '01811223301',
        vehicleType: 'EASYBIKE',
        vehicleModel: 'ভৈরব ইজিবাইক (টমটম) #১২',
        currentBalance: 193.0,
        lastTopupAt: new Date(now - 3600 * 1000 * 4),
      },
      {
        driverId: 'driver_demo_2',
        driverName: 'কামাল হোসেন',
        driverPhone: '01711223302',
        vehicleType: 'CNG',
        vehicleModel: 'বাজাজ সিএনজি অটোরিকশা',
        currentBalance: 340.0,
        lastTopupAt: new Date(now - 3600 * 1000 * 2),
      },
      {
        driverId: 'driver_demo_3',
        driverName: 'জাহিদ হাসান',
        driverPhone: '01911223303',
        vehicleType: 'BIKE',
        vehicleModel: 'বাজাজ পালসার ১৫০',
        currentBalance: 125.0,
        lastTopupAt: new Date(now - 3600 * 1000 * 6),
      },
      {
        driverId: 'driver_demo_4',
        driverName: 'আনোয়ার মিয়া',
        driverPhone: '01611223304',
        vehicleType: 'EASYBIKE',
        vehicleModel: 'বোরাক ইজিবাইক ভৈরব #০৮',
        currentBalance: 35.0, // Low balance < 50 BDT lockout demo!
        lastTopupAt: new Date(now - 3600 * 1000 * 24),
      },
      {
        driverId: 'driver_demo_5',
        driverName: 'সোহেল রানা',
        driverPhone: '01711223305',
        vehicleType: 'CAR_MICROBUS',
        vehicleModel: 'টয়োটা নোয়াহ হাইয়েস (ঢাকা-ভৈরব)',
        currentBalance: 850.0,
        lastTopupAt: new Date(now - 3600 * 1000 * 1),
      },
      {
        driverId: 'driver_demo_6',
        driverName: 'শফিকুল আলম',
        driverPhone: '01811223306',
        vehicleType: 'CNG',
        vehicleModel: 'টিভিএস কিং সিএনজি',
        currentBalance: 210.0,
        lastTopupAt: new Date(now - 3600 * 1000 * 5),
      },
    ];

    for (const w of initialDrivers) {
      this.wallets.set(w.driverId, w);
    }

    // Seed initial realistic ledger transactions
    this.transactions = [
      {
        id: 'tx_seed_bonus_1',
        driverId: 'driver_demo_1',
        driverName: 'মোঃ রফিকুল ইসলাম',
        type: 'PROMOTIONAL_BONUS',
        amount: 200.0,
        balanceAfter: 200.0,
        noteBangla: 'চলো ভৈরব উদ্বোধনী স্বাগতম বোনাস',
        createdAt: new Date(now - 3600 * 1000 * 5),
      },
      {
        id: 'tx_seed_bkash_2',
        driverId: 'driver_demo_2',
        driverName: 'কামাল হোসেন',
        type: 'BKASH_TOPUP',
        amount: 300.0,
        balanceAfter: 340.0,
        gatewayTrxId: 'BKH982341VA',
        noteBangla: 'বিকাশ ওয়ালেট রিচার্জ: ৩০০ টাকা',
        createdAt: new Date(now - 3600 * 1000 * 2),
      },
      {
        id: 'tx_seed_bonus_3',
        driverId: 'driver_demo_3',
        driverName: 'জাহিদ হাসান',
        type: 'PROMOTIONAL_BONUS',
        amount: 125.0,
        balanceAfter: 125.0,
        noteBangla: 'চলো ভৈরব স্বাগতম বোনাস',
        createdAt: new Date(now - 3600 * 1000 * 6),
      },
      {
        id: 'tx_seed_bkash_5',
        driverId: 'driver_demo_5',
        driverName: 'সোহেল রানা',
        type: 'BKASH_TOPUP',
        amount: 500.0,
        balanceAfter: 850.0,
        gatewayTrxId: 'BKH774129KL',
        noteBangla: 'বিকাশ ওয়ালেট রিচার্জ: ৫০০ টাকা (ইন্টারসিটি ফ্লিট)',
        createdAt: new Date(now - 3600 * 1000 * 1.5),
      },
      {
        id: 'tx_seed_comm_1',
        driverId: 'driver_demo_1',
        driverName: 'মোঃ রফিকুল ইসলাম',
        type: 'COMMISSION_DEDUCTION',
        amount: -7.0,
        balanceAfter: 193.0,
        referenceRideId: 'ride_seed_completed_1',
        noteBangla: 'ট্রিপ কমিশন কর্তন (৮%): ৭ টাকা (ভাড়া ৯০ টাকা)',
        createdAt: new Date(now - 3600 * 1000 * 0.5),
      },
    ];
  }

  getWallet(driverId: string): WalletRecord {
    let wallet = this.wallets.get(driverId);
    if (!wallet) {
      // Create new driver wallet with 100 BDT promotional welcome bonus for Bhairab launch
      wallet = {
        driverId,
        driverName: 'নতুন চালক',
        currentBalance: 100.0,
        lastTopupAt: new Date(),
      };
      this.wallets.set(driverId, wallet);

      this.transactions.push({
        id: `tx_${Date.now()}`,
        driverId,
        driverName: wallet.driverName,
        type: 'PROMOTIONAL_BONUS',
        amount: 100.0,
        balanceAfter: 100.0,
        noteBangla: 'চলো ভৈরব স্বাগতম বোনাস',
        createdAt: new Date(),
      });
    }
    return wallet;
  }

  getAllWallets(): WalletRecord[] {
    return Array.from(this.wallets.values());
  }

  getAllTransactions(): WalletTransactionRecord[] {
    return [...this.transactions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async deductCommission(
    driverId: string,
    commissionAmount: number,
    rideId: string,
  ): Promise<WalletTransactionRecord> {
    const wallet = this.getWallet(driverId);
    wallet.currentBalance = Number((wallet.currentBalance - commissionAmount).toFixed(2));

    const tx: WalletTransactionRecord = {
      id: `tx_comm_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      driverId,
      driverName: wallet.driverName,
      type: 'COMMISSION_DEDUCTION',
      amount: -commissionAmount,
      balanceAfter: wallet.currentBalance,
      referenceRideId: rideId,
      noteBangla: `ট্রিপ কমিশন কর্তন (৮%): ${commissionAmount} টাকা`,
      createdAt: new Date(),
    };

    this.transactions.push(tx);
    this.logger.log(
      `Commission deducted: ${commissionAmount} BDT from Driver ${driverId}. Remaining: ${wallet.currentBalance}`,
    );
    return tx;
  }

  async topupViaBkash(
    driverId: string,
    amountBdt: number,
    trxId: string,
    method: 'BKASH' | 'NAGAD' = 'BKASH',
  ): Promise<WalletTransactionRecord> {
    if (amountBdt < 20) {
      throw new BadRequestException('নূন্যতম রিচার্জ ২০ টাকা');
    }

    const wallet = this.getWallet(driverId);
    wallet.currentBalance = Number((wallet.currentBalance + Number(amountBdt)).toFixed(2));
    wallet.lastTopupAt = new Date();

    const isNagad = method === 'NAGAD';
    const tx: WalletTransactionRecord = {
      id: `tx_${isNagad ? 'nagad' : 'bkash'}_${Date.now()}`,
      driverId,
      driverName: wallet.driverName,
      type: isNagad ? 'NAGAD_TOPUP' : 'BKASH_TOPUP',
      amount: Number(amountBdt),
      balanceAfter: wallet.currentBalance,
      gatewayTrxId: trxId,
      noteBangla: `${isNagad ? 'নগদ' : 'বিকাশ'} ওয়ালেট রিচার্জ: ${amountBdt} টাকা`,
      createdAt: new Date(),
    };

    this.transactions.push(tx);
    this.logger.log(
      `${method} topup success: ${amountBdt} BDT for Driver ${driverId}. New balance: ${wallet.currentBalance}`,
    );
    return tx;
  }

  getDriverTransactions(driverId: string): WalletTransactionRecord[] {
    return this.transactions.filter((t) => t.driverId === driverId);
  }
}
