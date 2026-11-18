import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { RidesService, ActiveRide } from '../rides/rides.service';
import { RidesGateway } from '../rides/rides.gateway';
import { WalletService } from '../wallet/wallet.service';
import { BHAIRAB_LANDMARKS } from '../geo/bhairab-landmarks';
import { PrismaService } from '../../prisma/prisma.service';
import { isDemoSeedEnabled } from '../../common/demo';

export interface DriverKycRecord {
  id: string;
  driverId: string;
  fullName: string;
  phoneNumber: string;
  nidNumber: string;
  vehicleType: 'EASYBIKE' | 'CNG' | 'BIKE' | 'CAR_MICROBUS';
  vehicleModel: string;
  registrationNumber: string;
  brtaLicenseNo: string;
  unionCouncilorCert: string;
  wardNo: string;
  status: 'PENDING_VERIFICATION' | 'APPROVED' | 'SUSPENDED';
  submittedAt: string;
  note?: string;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private kycApplications: DriverKycRecord[] = [];
  private simulationCounter = 0;

  constructor(
    private readonly ridesService: RidesService,
    private readonly ridesGateway: RidesGateway,
    private readonly walletService: WalletService,
    private readonly prismaService: PrismaService,
  ) {
    this.loadOrSeedKycApplications();
    this.prismaService.registerResetListener(() => {
      this.seedKycApplications();
      this.persistKycToStore();
    });
  }

  private loadOrSeedKycApplications() {
    const storedKyc = this.prismaService.getKycApplications();
    if (Array.isArray(storedKyc) && storedKyc.length > 0) {
      this.kycApplications = storedKyc.map((k: any) => ({ ...k }));
      this.logger.log(
        `Restored ${this.kycApplications.length} KYC applications from durable state`,
      );
    } else if (isDemoSeedEnabled()) {
      this.seedKycApplications();
      this.persistKycToStore();
    }
  }

  private persistKycToStore() {
    this.prismaService.saveKycApplications(this.kycApplications);
  }

  seedKycApplications() {
    const now = Date.now();
    this.kycApplications = [
      {
        id: 'kyc_1',
        driverId: 'driver_demo_1',
        fullName: 'মোঃ রফিকুল ইসলাম (Md. Rafiqul Islam)',
        phoneNumber: '01811223301',
        nidNumber: '19884811120001',
        vehicleType: 'EASYBIKE',
        vehicleModel: 'ভৈরব ইজিবাইক (টমটম) #১২',
        registrationNumber: 'ভৈরব-পৌর-টমটম-০১১২',
        brtaLicenseNo: 'প্রযোজ্য নয় (পৌরসভা লাইসেন্স)',
        unionCouncilorCert: 'ভৈরব পৌরসভা ওয়ার্ড নং ০৪ প্রত্যয়নপত্র #২০২৬-১০৪',
        wardNo: 'ওয়ার্ড নং ০৪ (ভৈরব বাজার)',
        status: 'APPROVED',
        submittedAt: new Date(now - 86400 * 1000 * 5).toISOString(),
        note: 'পৌরসভা টোকেন ও এনআইডি যাচাইকৃত',
      },
      {
        id: 'kyc_2',
        driverId: 'driver_demo_2',
        fullName: 'কামাল হোসেন (Kamal Hossain)',
        phoneNumber: '01711223302',
        nidNumber: '19904811120045',
        vehicleType: 'CNG',
        vehicleModel: 'বাজাজ সিএনজি অটোরিকশা (সবুজ)',
        registrationNumber: 'কিশোরগঞ্জ-থ-১১-৪৫৮২',
        brtaLicenseNo: 'DK-0492817-CNG',
        unionCouncilorCert: 'ভৈরব পৌরসভা ওয়ার্ড নং ০৭ প্রত্যয়নপত্র #২০২৬-২০৯',
        wardNo: 'ওয়ার্ড নং ০৭ (কমলপুর)',
        status: 'APPROVED',
        submittedAt: new Date(now - 86400 * 1000 * 4).toISOString(),
        note: 'বিআরটিএ এবং ওয়ার্ড কাউন্সিলর সনদ যাচাইকৃত',
      },
      {
        id: 'kyc_3',
        driverId: 'driver_demo_3',
        fullName: 'জাহিদ হাসান (Jahidul Hasan)',
        phoneNumber: '01911223303',
        nidNumber: '19964811120089',
        vehicleType: 'BIKE',
        vehicleModel: 'বাজাজ পালসার ১৫০ সিসি',
        registrationNumber: 'ঢাকা-মেট্রো-ল-৪২-৮৮১৯',
        brtaLicenseNo: 'DL-9981234-MTR',
        unionCouncilorCert: 'চণ্ডীবের ইউনিয়ন পরিষদ প্রত্যয়নপত্র #২০২৬-০৫৫',
        wardNo: 'ওয়ার্ড নং ০৯ (চণ্ডীবের)',
        status: 'PENDING_VERIFICATION',
        submittedAt: new Date(now - 3600 * 1000 * 8).toISOString(),
      },
      {
        id: 'kyc_4',
        driverId: 'driver_demo_4',
        fullName: 'আনোয়ার মিয়া (Anwar Mia)',
        phoneNumber: '01611223304',
        nidNumber: '19854811120033',
        vehicleType: 'EASYBIKE',
        vehicleModel: 'বোরাক ইজিবাইক ভৈরব #০৮',
        registrationNumber: 'ভৈরব-পৌর-টমটম-০২০৮',
        brtaLicenseNo: 'প্রযোজ্য নয় (পৌরসভা লাইসেন্স)',
        unionCouncilorCert: 'ভৈরব পৌরসভা ওয়ার্ড নং ০২ প্রত্যয়নপত্র #২০২৬-৩১২',
        wardNo: 'ওয়ার্ড নং ০২ (পুরাতন নদী ঘাট)',
        status: 'PENDING_VERIFICATION',
        submittedAt: new Date(now - 3600 * 1000 * 5).toISOString(),
      },
      {
        id: 'kyc_5',
        driverId: 'driver_demo_5',
        fullName: 'সোহেল রানা (Sohel Rana)',
        phoneNumber: '01711223305',
        nidNumber: '19834811120077',
        vehicleType: 'CAR_MICROBUS',
        vehicleModel: 'টয়োটা নোয়াহ হাইয়েস (ঢাকা-ভৈরব ইন্টারসিটি)',
        registrationNumber: 'ঢাকা-মেট্রো-চ-১৯-৩৩০৪',
        brtaLicenseNo: 'DL-4410982-PRO',
        unionCouncilorCert: 'ভৈরব পৌরসভা ওয়ার্ড নং ০১ প্রত্যয়নপত্র #২০২৬-০১৯',
        wardNo: 'ওয়ার্ড নং ০১ (কাচারি মোড়)',
        status: 'APPROVED',
        submittedAt: new Date(now - 86400 * 1000 * 7).toISOString(),
        note: 'ঢাকা-সিলেট হাইওয়ে রুট পারমিট ও বিআরটিএ যাচাইকৃত',
      },
      {
        id: 'kyc_6',
        driverId: 'driver_demo_6',
        fullName: 'শফিকুল আলম (Shafiqul Alam)',
        phoneNumber: '01811223306',
        nidNumber: '19924811120061',
        vehicleType: 'CNG',
        vehicleModel: 'টিভিএস কিং সিএনজি ২০০ সিসি',
        registrationNumber: 'কিশোরগঞ্জ-থ-১১-৬০১২',
        brtaLicenseNo: 'DK-0774129-CNG',
        unionCouncilorCert: 'শিমুলকান্দি ইউনিয়ন পরিষদ প্রত্যয়নপত্র #২০২৬-৪০১',
        wardNo: 'শিমুলকান্দি ইউনিয়ন (ওয়ার্ড ০৩)',
        status: 'PENDING_VERIFICATION',
        submittedAt: new Date(now - 3600 * 1000 * 2).toISOString(),
      },
    ];
  }

  resetSeedState() {
    this.prismaService.resetSeedState();
    this.ridesGateway.broadcastAdminEvent('SEED_RESET', {
      messageBangla: 'ডাটাবেস প্রাথমিক ভৈরব সিড অবস্থায় রিসেট করা হয়েছে',
    });
    return {
      success: true,
      messageBangla: 'ডাটাবেস প্রাথমিক ভৈরব সিড অবস্থায় রিসেট করা হয়েছে',
      wallets: this.walletService.getAllWallets(),
      kycApplications: this.kycApplications,
      activeRides: this.ridesService.getAllRides(),
    };
  }

  getOverview() {
    const onlineDrivers = this.ridesService.getAllOnlineDrivers();
    const allRides = this.ridesService.getAllRides();
    const wallets = this.walletService.getAllWallets();
    const recentTransactions = this.walletService.getAllTransactions();

    const activeRidesCount = allRides.filter(
      (r) => r.status !== 'COMPLETED' && r.status !== 'CANCELLED',
    ).length;
    const completedRides = allRides.filter((r) => r.status === 'COMPLETED');
    const completedRidesCount = completedRides.length;

    const totalCommissionBdt = recentTransactions
      .filter((t) => t.type === 'COMMISSION_DEDUCTION')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalGmvBdt = completedRides.reduce(
      (sum, r) => sum + (r.finalAgreedFare || r.initialOfferFare),
      0,
    );

    const pendingKycCount = this.kycApplications.filter(
      (k) => k.status === 'PENDING_VERIFICATION',
    ).length;

    const lowBalanceDriversCount = wallets.filter((w) => w.currentBalance < 50).length;

    const activeSosCount = allRides.filter((r) => r.sosActive === true).length;

    const vehicleBreakdown = {
      EASYBIKE: onlineDrivers.filter((d) => d.vehicleType === 'EASYBIKE').length,
      CNG: onlineDrivers.filter((d) => d.vehicleType === 'CNG').length,
      BIKE: onlineDrivers.filter((d) => d.vehicleType === 'BIKE').length,
      CAR_MICROBUS: onlineDrivers.filter((d) => d.vehicleType === 'CAR_MICROBUS').length,
    };

    return {
      success: true,
      bkashMode: process.env.BKASH_MODE || 'mock',
      dbStatus: this.prismaService.getStatus(),
      stats: {
        onlineDriversCount: onlineDrivers.length,
        activeRidesCount,
        completedRidesCount,
        totalCommissionBdt,
        totalGmvBdt,
        pendingKycCount,
        lowBalanceDriversCount,
        activeSosCount,
        vehicleBreakdown,
      },
      onlineDrivers,
      activeRides: allRides,
      wallets,
      recentTransactions,
      landmarks: BHAIRAB_LANDMARKS,
    };
  }

  getKycApplications() {
    return {
      success: true,
      applications: this.kycApplications,
    };
  }

  updateKycStatus(
    id: string,
    status: 'APPROVED' | 'SUSPENDED' | 'PENDING_VERIFICATION',
    note?: string,
  ) {
    if (!status || !['APPROVED', 'SUSPENDED', 'PENDING_VERIFICATION'].includes(status)) {
      throw new BadRequestException(
        'status must be APPROVED, SUSPENDED, or PENDING_VERIFICATION',
      );
    }

    const app = this.kycApplications.find((k) => k.id === id || k.driverId === id);
    if (!app) {
      throw new NotFoundException(`KYC application ${id} not found`);
    }

    app.status = status;
    if (note !== undefined) {
      app.note = note;
    }

    this.persistKycToStore();

    this.ridesGateway.broadcastAdminEvent('KYC_UPDATED', {
      application: app,
      status,
      messageBangla:
        status === 'APPROVED'
          ? `✓ চালক কেওয়াইসি অনুমোদিত: ${app.fullName} (${app.vehicleType})`
          : `✕ চালক কেওয়াইসি স্থগিত: ${app.fullName}`,
    });

    return {
      success: true,
      application: app,
    };
  }

  async topupDriverWallet(data: {
    driverId: string;
    amountBdt: number;
    method?: 'BKASH' | 'NAGAD' | 'ADMIN_MANUAL';
    trxId?: string;
  }) {
    if (!data.driverId || !data.amountBdt) {
      throw new BadRequestException('driverId and amountBdt are required');
    }

    const method = data.method || 'BKASH';
    const prefix = method === 'NAGAD' ? 'NGD' : method === 'ADMIN_MANUAL' ? 'ADM' : 'BKH';
    const trxId = data.trxId || `${prefix}${Math.floor(100000 + Math.random() * 900000)}`;

    const transaction = await this.walletService.topupViaBkash(
      data.driverId,
      Number(data.amountBdt),
      trxId,
      method,
    );
    const wallet = this.walletService.getWallet(data.driverId);

    this.ridesService.syncDriverWalletBalance(data.driverId, wallet.currentBalance);

    this.ridesGateway.broadcastAdminEvent('WALLET_TOPUP', {
      driverId: data.driverId,
      amountBdt: Number(data.amountBdt),
      method,
      transaction,
      wallet,
      messageBangla: `৳ ${method === 'NAGAD' ? 'নগদ' : method === 'ADMIN_MANUAL' ? 'অ্যাডমিন' : 'বিকাশ'} রিচার্জ সফল: ${wallet.driverName || data.driverId} (+${data.amountBdt} টাকা, বর্তমান ব্যালেন্স: ${wallet.currentBalance} টাকা)`,
    });

    return {
      success: true,
      transaction,
      wallet,
    };
  }

  triggerSos(rideId: string, resolved?: boolean) {
    const ride = this.ridesService.triggerRideSos(rideId, resolved);

    this.ridesGateway.broadcastAdminEvent('SOS_ALERT', {
      rideId: ride.id,
      ride,
      resolved: !ride.sosActive,
      messageBangla: ride.sosActive
        ? `🚨 জরুরি ৯৯৯ SOS অ্যালার্ট: যাত্রী ${ride.passengerName} (${ride.pickupAddress} → ${ride.dropoffAddress})`
        : `✓ ৯৯৯ SOS অ্যালার্ট সমাধান করা হয়েছে (${ride.passengerName})`,
    });

    return {
      success: true,
      ride,
    };
  }

  simulateLiveBhairabRide(): {
    success: boolean;
    ride: ActiveRide;
    messageBangla: string;
  } {
    this.simulationCounter += 1;

    const routes = [
      {
        pickup: BHAIRAB_LANDMARKS[0], // ভৈরব বাজার রেলওয়ে জংশন
        dropoff: BHAIRAB_LANDMARKS[1], // সৈয়দ নজরুল ইসলাম সেতু (মেঘনা ব্রিজ গোলচত্বর)
        vehicleType: 'EASYBIKE' as const,
        initialOfferFare: 80,
        passengerName: 'আব্দুল করিম (Karim)',
        passengerPhone: '01711998811',
      },
      {
        pickup: BHAIRAB_LANDMARKS[2], // ভৈরব বাস টার্মিনাল (কাচারি মোড়)
        dropoff: BHAIRAB_LANDMARKS[3], // ভৈরব বাজার পুরাতন নদী ঘাট
        vehicleType: 'CNG' as const,
        initialOfferFare: 90,
        passengerName: 'সাদিয়া ইসলাম (Sadia)',
        passengerPhone: '01822998822',
      },
      {
        pickup: BHAIRAB_LANDMARKS[4], // চণ্ডীবের মোড় (উপজেলা স্বাস্থ্য কমপ্লেক্স)
        dropoff: BHAIRAB_LANDMARKS[0], // ভৈরব বাজার রেলওয়ে জংশন
        vehicleType: 'BIKE' as const,
        initialOfferFare: 60,
        passengerName: 'তানভীর আহমেদ (Tanvir)',
        passengerPhone: '01933998833',
      },
      {
        pickup: BHAIRAB_LANDMARKS[5], // শিমুলকান্দি মোড়
        dropoff: BHAIRAB_LANDMARKS[1], // মেঘনা ব্রিজ গোলচত্বর
        vehicleType: 'CNG' as const,
        initialOfferFare: 120,
        passengerName: 'রহিমা বেগম (Rahima)',
        passengerPhone: '01644998844',
      },
    ];

    const route = routes[(this.simulationCounter - 1) % routes.length];

    const ride = this.ridesService.createRideRequest({
      passengerId: `passenger_sim_${this.simulationCounter}`,
      passengerName: route.passengerName,
      passengerPhone: route.passengerPhone,
      vehicleType: route.vehicleType,
      pickupLat: route.pickup.latitude,
      pickupLng: route.pickup.longitude,
      pickupAddress: route.pickup.banglaName,
      dropoffLat: route.dropoff.latitude,
      dropoffLng: route.dropoff.longitude,
      dropoffAddress: route.dropoff.banglaName,
      initialOfferFare: route.initialOfferFare,
    });

    // Step 0: Broadcast RIDE_REQUESTED immediately
    this.ridesGateway.broadcastAdminEvent('RIDE_REQUESTED', {
      rideId: ride.id,
      ride,
      audioPromptBangla: ride.audioPromptBangla,
      messageBangla: ride.audioPromptBangla,
    });

    // Pick 2 online drivers with balance >= 50 BDT for counter-bidding
    const eligibleDrivers = this.ridesService
      .getAllOnlineDrivers()
      .filter((d) => d.walletBalance >= 50);

    const driver1 = eligibleDrivers[0] || this.ridesService.getAllOnlineDrivers()[0];
    const driver2 = eligibleDrivers[1] || eligibleDrivers[0] || driver1;

    // Ensure selected drivers have >= 60 BDT so simulation bids never fail
    if (driver1 && driver1.walletBalance < 60) {
      this.ridesService.syncDriverWalletBalance(driver1.driverId, 200);
    }
    if (driver2 && driver2.walletBalance < 60) {
      this.ridesService.syncDriverWalletBalance(driver2.driverId, 200);
    }

    // Step 1 (0.9s): First Driver Counter-Bid
    setTimeout(() => {
      try {
        const bid1Amount = route.initialOfferFare + 15;
        const bid1 = this.ridesService.submitDriverBid({
          rideId: ride.id,
          driverId: driver1.driverId,
          bidAmount: bid1Amount,
          etaMinutes: 3,
        });
        const updatedRide = this.ridesService.getRide(ride.id);

        this.ridesGateway.broadcastAdminEvent('NEW_BID', {
          rideId: ride.id,
          bid: bid1,
          ride: updatedRide,
          messageBangla: `💬 ${bid1.driverName} (${bid1.vehicleModel}) পাল্টা বিড করেছেন: ${bid1.bidAmount} টাকা (ETA: ৩ মিনিট)`,
        });
      } catch (err: any) {
        this.logger.warn(`Simulation step 1 error: ${err.message}`);
      }
    }, 900);

    // Step 2 (1.8s): Second Driver Counter-Bid (Better offer)
    setTimeout(() => {
      try {
        const bid2Amount = route.initialOfferFare + 10;
        const bid2 = this.ridesService.submitDriverBid({
          rideId: ride.id,
          driverId: driver2.driverId,
          bidAmount: bid2Amount,
          etaMinutes: 2,
        });
        const updatedRide = this.ridesService.getRide(ride.id);

        this.ridesGateway.broadcastAdminEvent('NEW_BID', {
          rideId: ride.id,
          bid: bid2,
          ride: updatedRide,
          messageBangla: `💬 ${bid2.driverName} (${bid2.vehicleModel}) পাল্টা বিড করেছেন: ${bid2.bidAmount} টাকা (ETA: ২ মিনিট)`,
        });

        // Step 3 (2.7s): Passenger accepts the best counter-bid
        setTimeout(() => {
          try {
            const { ride: acceptedRide, acceptedBid } = this.ridesService.acceptBid(
              ride.id,
              bid2.id,
            );

            this.ridesGateway.broadcastAdminEvent('BID_ACCEPTED', {
              rideId: ride.id,
              ride: acceptedRide,
              acceptedBid,
              messageBangla: `🤝 যাত্রী ${acceptedRide.passengerName} চালক ${acceptedBid.driverName}-এর ${acceptedBid.bidAmount} টাকার বিড গ্রহণ করেছেন!`,
            });

            // Step 4 (3.6s): Ride completes & 8% commission is deducted automatically
            setTimeout(async () => {
              try {
                const { ride: completedRide, commissionDeducted } =
                  await this.ridesService.completeRide(ride.id);

                this.ridesGateway.broadcastAdminEvent('RIDE_COMPLETED', {
                  rideId: ride.id,
                  ride: completedRide,
                  commissionDeducted,
                  messageBangla: `✅ ভৈরব ট্রিপ সম্পন্ন! ভাড়া: ${completedRide.finalAgreedFare} টাকা | ৮% প্ল্যাটফর্ম কমিশন কর্তন: ${commissionDeducted} টাকা`,
                });
              } catch (err: any) {
                this.logger.warn(`Simulation step 4 error: ${err.message}`);
              }
            }, 900);
          } catch (err: any) {
            this.logger.warn(`Simulation step 3 error: ${err.message}`);
          }
        }, 900);
      } catch (err: any) {
        this.logger.warn(`Simulation step 2 error: ${err.message}`);
      }
    }, 1800);

    return {
      success: true,
      ride,
      messageBangla: 'লাইভ ভৈরব রাইড এবং বিডিং সিমুলেশন শুরু হয়েছে!',
    };
  }
}
