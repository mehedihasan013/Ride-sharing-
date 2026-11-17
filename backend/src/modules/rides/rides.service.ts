import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { GeoService } from '../geo/geo.service';
import { WalletService } from '../wallet/wallet.service';
import { PrismaService } from '../../prisma/prisma.service';

export interface ActiveRide {
  id: string;
  passengerId: string;
  passengerName: string;
  passengerPhone: string;
  vehicleType: 'BIKE' | 'CNG' | 'EASYBIKE' | 'CAR_MICROBUS';
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffAddress: string;
  initialOfferFare: number;
  finalAgreedFare?: number;
  selectedDriverId?: string;
  selectedDriverName?: string;
  selectedDriverPhone?: string;
  selectedVehicleModel?: string;
  commissionBdt?: number;
  audioPromptBangla?: string;
  sosActive?: boolean;
  sosTriggeredAt?: number;
  sosResolvedAt?: number;
  status:
    | 'SEARCHING'
    | 'BIDDING'
    | 'ACCEPTED'
    | 'ARRIVING'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED';
  bids: ActiveBid[];
  createdAt: number;
  liveTrackingToken: string;
}

export interface ActiveBid {
  id: string;
  rideId: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  ratingAvg: number;
  vehicleModel: string;
  bidAmount: number;
  etaMinutes: number;
  timestamp: number;
}

export interface OnlineDriver {
  driverId: string;
  socketId: string;
  vehicleType: 'BIKE' | 'CNG' | 'EASYBIKE' | 'CAR_MICROBUS';
  lat: number;
  lng: number;
  walletBalance: number;
  rating: number;
  driverName: string;
  driverPhone: string;
  vehicleModel: string;
  landmarkName?: string;
}

@Injectable()
export class RidesService {
  private readonly logger = new Logger(RidesService.name);

  // Active state stores backed by PrismaService durable store + Supabase PostgreSQL
  private activeRides = new Map<string, ActiveRide>();
  private onlineDrivers = new Map<string, OnlineDriver>();

  constructor(
    private readonly geoService: GeoService,
    private readonly walletService: WalletService,
    private readonly prismaService: PrismaService,
  ) {
    this.loadOrSeedFleetAndRides();
    this.prismaService.registerResetListener(() => {
      this.seedBhairabFleetAndRides();
      this.persistToStore();
    });
  }

  private loadOrSeedFleetAndRides() {
    const storedRides = this.prismaService.getRides();
    const storedDrivers = this.prismaService.getOnlineDrivers();

    // Always seed initial fleet first so all 6 Bhairab drivers are online, then overlay stored drivers
    this.seedBhairabFleetDriversOnly();
    if (Array.isArray(storedDrivers) && storedDrivers.length > 0) {
      for (const d of storedDrivers) {
        this.onlineDrivers.set(d.driverId, {
          ...d,
          walletBalance: this.walletService.getWallet(d.driverId).currentBalance,
        });
      }
    }
    // Sync all online drivers with live WalletService balances
    for (const d of this.onlineDrivers.values()) {
      d.walletBalance = this.walletService.getWallet(d.driverId).currentBalance;
    }

    if (Array.isArray(storedRides) && storedRides.length > 0) {
      this.activeRides.clear();
      for (const r of storedRides) {
        this.activeRides.set(r.id, {
          ...r,
          bids: Array.isArray(r.bids) ? r.bids : [],
        });
      }
      this.logger.log(
        `Restored ${this.activeRides.size} rides and ${this.onlineDrivers.size} online drivers from durable state`,
      );
    } else {
      this.seedBhairabRidesOnly();
      this.persistToStore();
    }
  }

  private persistToStore() {
    this.prismaService.saveRidesAndDrivers(
      Array.from(this.activeRides.values()),
      Array.from(this.onlineDrivers.values()),
    );
  }

  private seedBhairabFleetDriversOnly() {
    this.onlineDrivers.clear();
    const initialFleet: OnlineDriver[] = [
      {
        driverId: 'driver_demo_1',
        socketId: 'seed_sock_1',
        vehicleType: 'EASYBIKE',
        lat: 24.0487,
        lng: 90.9852,
        walletBalance: this.walletService.getWallet('driver_demo_1').currentBalance,
        rating: 4.9,
        driverName: 'মোঃ রফিকুল ইসলাম',
        driverPhone: '01811223301',
        vehicleModel: 'ভৈরব ইজিবাইক (টমটম) #১২',
        landmarkName: 'ভৈরব বাজার রেলওয়ে জংশন',
      },
      {
        driverId: 'driver_demo_2',
        socketId: 'seed_sock_2',
        vehicleType: 'CNG',
        lat: 24.0418,
        lng: 91.0022,
        walletBalance: this.walletService.getWallet('driver_demo_2').currentBalance,
        rating: 4.8,
        driverName: 'কামাল হোসেন',
        driverPhone: '01711223302',
        vehicleModel: 'বাজাজ সিএনজি অটোরিকশা',
        landmarkName: 'সৈয়দ নজরুল ইসলাম সেতু (মেঘনা ব্রিজ গোলচত্বর)',
      },
      {
        driverId: 'driver_demo_3',
        socketId: 'seed_sock_3',
        vehicleType: 'BIKE',
        lat: 24.0535,
        lng: 90.9811,
        walletBalance: this.walletService.getWallet('driver_demo_3').currentBalance,
        rating: 4.9,
        driverName: 'জাহিদ হাসান',
        driverPhone: '01911223303',
        vehicleModel: 'বাজাজ পালসার ১৫০',
        landmarkName: 'ভৈরব বাস টার্মিনাল (কাচারি মোড়)',
      },
      {
        driverId: 'driver_demo_4',
        socketId: 'seed_sock_4',
        vehicleType: 'EASYBIKE',
        lat: 24.0425,
        lng: 90.9840,
        walletBalance: this.walletService.getWallet('driver_demo_4').currentBalance,
        rating: 4.6,
        driverName: 'আনোয়ার মিয়া',
        driverPhone: '01611223304',
        vehicleModel: 'বোরাক ইজিবাইক ভৈরব #০৮',
        landmarkName: 'ভৈরব বাজার পুরাতন নদী ঘাট',
      },
      {
        driverId: 'driver_demo_5',
        socketId: 'seed_sock_5',
        vehicleType: 'CAR_MICROBUS',
        lat: 24.0620,
        lng: 90.9785,
        walletBalance: this.walletService.getWallet('driver_demo_5').currentBalance,
        rating: 5.0,
        driverName: 'সোহেল রানা',
        driverPhone: '01711223305',
        vehicleModel: 'টয়োটা নোয়াহ হাইয়েস (ঢাকা-ভৈরব)',
        landmarkName: 'চণ্ডীবের মোড় (উপজেলা স্বাস্থ্য কমপ্লেক্স)',
      },
      {
        driverId: 'driver_demo_6',
        socketId: 'seed_sock_6',
        vehicleType: 'CNG',
        lat: 24.0750,
        lng: 90.9650,
        walletBalance: this.walletService.getWallet('driver_demo_6').currentBalance,
        rating: 4.7,
        driverName: 'শফিকুল আলম',
        driverPhone: '01811223306',
        vehicleModel: 'টিভিএস কিং সিএনজি',
        landmarkName: 'শিমুলকান্দি মোড়',
      },
    ];

    for (const driver of initialFleet) {
      this.onlineDrivers.set(driver.driverId, driver);
    }
  }

  private seedBhairabRidesOnly() {
    this.activeRides.clear();
    const now = Date.now();

    // Seed 1 Completed Ride for historical GMV & Commission stats
    const completedRide: ActiveRide = {
      id: 'ride_seed_completed_1',
      passengerId: 'passenger_demo_0',
      passengerName: 'মাহমুদুল হাসান (Mahmud)',
      passengerPhone: '01712345670',
      vehicleType: 'EASYBIKE',
      pickupLat: 24.0535,
      pickupLng: 90.9811,
      pickupAddress: 'ভৈরব বাস টার্মিনাল (কাচারি মোড়)',
      dropoffLat: 24.0425,
      dropoffLng: 90.9840,
      dropoffAddress: 'ভৈরব বাজার পুরাতন নদী ঘাট',
      initialOfferFare: 80,
      finalAgreedFare: 90,
      selectedDriverId: 'driver_demo_1',
      selectedDriverName: 'মোঃ রফিকুল ইসলাম',
      selectedDriverPhone: '01811223301',
      selectedVehicleModel: 'ভৈরব ইজিবাইক (টমটম) #১২',
      commissionBdt: 7,
      audioPromptBangla:
        'নতুন ট্রিপ রিকোয়েস্ট: ভৈরব বাস টার্মিনাল (কাচারি মোড়) থেকে ভৈরব বাজার পুরাতন নদী ঘাট, প্রস্তাবিত ভাড়া ৮০ টাকা',
      status: 'COMPLETED',
      bids: [
        {
          id: 'bid_seed_comp_1',
          rideId: 'ride_seed_completed_1',
          driverId: 'driver_demo_1',
          driverName: 'মোঃ রফিকুল ইসলাম',
          driverPhone: '01811223301',
          ratingAvg: 4.9,
          vehicleModel: 'ভৈরব ইজিবাইক (টমটম) #১২',
          bidAmount: 90,
          etaMinutes: 2,
          timestamp: now - 1800 * 1000,
        },
      ],
      createdAt: now - 1900 * 1000,
      liveTrackingToken: 'track_bhairab_comp_01',
    };
    this.activeRides.set(completedRide.id, completedRide);

    // Seed 1 Live Active Bidding Ride for immediate dashboard activity
    const activeBiddingRide: ActiveRide = {
      id: 'ride_seed_live_1',
      passengerId: 'passenger_demo_1',
      passengerName: 'আব্দুল করিম (Karim)',
      passengerPhone: '01700000001',
      vehicleType: 'CNG',
      pickupLat: 24.0487,
      pickupLng: 90.9852,
      pickupAddress: 'ভৈরব বাজার রেলওয়ে জংশন',
      dropoffLat: 24.0418,
      dropoffLng: 91.0022,
      dropoffAddress: 'সৈয়দ নজরুল ইসলাম সেতু (মেঘনা ব্রিজ গোলচত্বর)',
      initialOfferFare: 80,
      audioPromptBangla:
        'নতুন ট্রিপ রিকোয়েস্ট: ভৈরব বাজার রেলওয়ে জংশন থেকে সৈয়দ নজরুল ইসলাম সেতু (মেঘনা ব্রিজ গোলচত্বর), প্রস্তাবিত ভাড়া ৮০ টাকা',
      status: 'BIDDING',
      bids: [
        {
          id: 'bid_seed_live_1',
          rideId: 'ride_seed_live_1',
          driverId: 'driver_demo_2',
          driverName: 'কামাল হোসেন',
          driverPhone: '01711223302',
          ratingAvg: 4.8,
          vehicleModel: 'বাজাজ সিএনজি অটোরিকশা',
          bidAmount: 90,
          etaMinutes: 3,
          timestamp: now - 45 * 1000,
        },
        {
          id: 'bid_seed_live_2',
          rideId: 'ride_seed_live_1',
          driverId: 'driver_demo_6',
          driverName: 'শফিকুল আলম',
          driverPhone: '01811223306',
          ratingAvg: 4.7,
          vehicleModel: 'টিভিএস কিং সিএনজি',
          bidAmount: 85,
          etaMinutes: 4,
          timestamp: now - 20 * 1000,
        },
      ],
      createdAt: now - 60 * 1000,
      liveTrackingToken: 'track_bhairab_live_01',
    };
    this.activeRides.set(activeBiddingRide.id, activeBiddingRide);
  }

  seedBhairabFleetAndRides() {
    this.seedBhairabFleetDriversOnly();
    this.seedBhairabRidesOnly();
  }

  registerOnlineDriver(driver: OnlineDriver) {
    const liveBalance = this.walletService.getWallet(driver.driverId).currentBalance;
    driver.walletBalance = liveBalance;
    this.onlineDrivers.set(driver.driverId, driver);
    this.persistToStore();
    this.logger.log(
      `Driver ${driver.driverId} online (${driver.vehicleType}) at [${driver.lat}, ${driver.lng}]`,
    );
  }

  removeOnlineDriver(driverId: string) {
    this.onlineDrivers.delete(driverId);
    this.persistToStore();
  }

  updateDriverLocation(driverId: string, lat: number, lng: number) {
    const driver = this.onlineDrivers.get(driverId);
    if (driver) {
      driver.lat = lat;
      driver.lng = lng;
      this.persistToStore();
    }
  }

  getAllOnlineDrivers(): OnlineDriver[] {
    for (const d of this.onlineDrivers.values()) {
      d.walletBalance = this.walletService.getWallet(d.driverId).currentBalance;
    }
    return Array.from(this.onlineDrivers.values());
  }

  getAllRides(): ActiveRide[] {
    return Array.from(this.activeRides.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  syncDriverWalletBalance(driverId: string, newBalance: number) {
    const driver = this.onlineDrivers.get(driverId);
    if (driver) {
      driver.walletBalance = Number(newBalance.toFixed(2));
      this.persistToStore();
    }
  }

  triggerRideSos(rideId: string, resolved?: boolean): ActiveRide {
    let ride = this.activeRides.get(rideId);

    if (rideId === 'demo' || !ride) {
      const demoSosId = rideId === 'demo' ? 'ride_sos_demo' : rideId;
      ride = this.activeRides.get(demoSosId);
      if (!ride) {
        ride = {
          id: demoSosId,
          passengerId: 'passenger_sos_1',
          passengerName: 'ফারজানা আক্তার (Farzana)',
          passengerPhone: '01755667788',
          vehicleType: 'CNG',
          pickupLat: 24.0418,
          pickupLng: 91.0022,
          pickupAddress: 'সৈয়দ নজরুল ইসলাম সেতু (মেঘনা ব্রিজ গোলচত্বর)',
          dropoffLat: 24.0487,
          dropoffLng: 90.9852,
          dropoffAddress: 'ভৈরব বাজার রেলওয়ে জংশন',
          initialOfferFare: 100,
          finalAgreedFare: 110,
          selectedDriverId: 'driver_demo_2',
          selectedDriverName: 'কামাল হোসেন',
          selectedDriverPhone: '01711223302',
          selectedVehicleModel: 'বাজাজ সিএনজি অটোরিকশা',
          audioPromptBangla:
            'জরুরি ৯৯৯ অ্যালার্ট: সৈয়দ নজরুল ইসলাম সেতু থেকে ভৈরব বাজার রেলওয়ে জংশন ট্রিপে যাত্রী SOS বাটন চেপেছেন!',
          status: 'IN_PROGRESS',
          bids: [],
          createdAt: Date.now(),
          liveTrackingToken: 'track_sos_bhairab_999',
          sosActive: true,
          sosTriggeredAt: Date.now(),
        };
        this.activeRides.set(demoSosId, ride);
      }
    }

    if (resolved === true) {
      ride.sosActive = false;
      ride.sosResolvedAt = Date.now();
    } else if (resolved === false) {
      ride.sosActive = true;
      ride.sosTriggeredAt = Date.now();
    } else {
      if (rideId === 'demo') {
        ride.sosActive = true;
        ride.sosTriggeredAt = Date.now();
      } else {
        ride.sosActive = !ride.sosActive;
        if (ride.sosActive) {
          ride.sosTriggeredAt = Date.now();
        } else {
          ride.sosResolvedAt = Date.now();
        }
      }
    }

    this.prismaService.recordSosEvent({
      id: `sos_${Date.now()}`,
      rideId: ride.id,
      triggeredBy: ride.passengerId,
      resolved: !ride.sosActive,
      createdAt: new Date().toISOString(),
      resolvedAt: !ride.sosActive ? new Date().toISOString() : undefined,
    });
    this.persistToStore();

    return ride;
  }

  getNearbyDriversForRide(ride: ActiveRide, radiusKm = 4.0): OnlineDriver[] {
    const eligible: OnlineDriver[] = [];
    for (const driver of this.onlineDrivers.values()) {
      // Sync live wallet balance
      driver.walletBalance = this.walletService.getWallet(driver.driverId).currentBalance;

      // Must match vehicle type
      if (driver.vehicleType !== ride.vehicleType) continue;

      // Must have minimum wallet balance (50 BDT)
      if (driver.walletBalance < 50) continue;

      const dist = this.geoService.calculateDistanceKm(
        ride.pickupLat,
        ride.pickupLng,
        driver.lat,
        driver.lng,
      );

      if (dist <= radiusKm) {
        eligible.push(driver);
      }
    }
    return eligible;
  }

  createRideRequest(data: {
    passengerId: string;
    passengerName: string;
    passengerPhone: string;
    vehicleType: 'BIKE' | 'CNG' | 'EASYBIKE' | 'CAR_MICROBUS';
    pickupLat: number;
    pickupLng: number;
    pickupAddress: string;
    dropoffLat: number;
    dropoffLng: number;
    dropoffAddress: string;
    initialOfferFare: number;
  }): ActiveRide {
    const rideId = `ride_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const liveTrackingToken = `track_${Math.random().toString(36).substr(2, 9)}`;
    const audioPromptBangla = `নতুন ট্রিপ রিকোয়েস্ট: ${data.pickupAddress} থেকে ${data.dropoffAddress}, প্রস্তাবিত ভাড়া ${data.initialOfferFare} টাকা`;

    const ride: ActiveRide = {
      id: rideId,
      ...data,
      audioPromptBangla,
      status: 'SEARCHING',
      bids: [],
      createdAt: Date.now(),
      liveTrackingToken,
    };

    this.activeRides.set(rideId, ride);
    this.persistToStore();
    return ride;
  }

  submitDriverBid(data: {
    rideId: string;
    driverId: string;
    bidAmount: number;
    etaMinutes: number;
  }): ActiveBid {
    const ride = this.activeRides.get(data.rideId);
    if (!ride) throw new NotFoundException('Ride request expired or not found');

    if (ride.status !== 'SEARCHING' && ride.status !== 'BIDDING') {
      throw new BadRequestException('Ride is no longer accepting bids');
    }

    const driver = this.onlineDrivers.get(data.driverId);
    if (!driver) throw new BadRequestException('Driver is not currently registered online');

    // Always check live wallet balance from WalletService and sync driver.walletBalance
    const liveWalletBalance = this.walletService.getWallet(data.driverId).currentBalance;
    driver.walletBalance = liveWalletBalance;

    if (liveWalletBalance < 50) {
      throw new BadRequestException(
        'কম ব্যালেন্স! বিড করতে নূন্যতম ৫০ টাকা ওয়ালেট ব্যালেন্স প্রয়োজন',
      );
    }

    ride.status = 'BIDDING';

    const bid: ActiveBid = {
      id: `bid_${Date.now()}_${data.driverId}`,
      rideId: data.rideId,
      driverId: data.driverId,
      driverName: driver.driverName,
      driverPhone: driver.driverPhone,
      ratingAvg: driver.rating,
      vehicleModel: driver.vehicleModel,
      bidAmount: data.bidAmount,
      etaMinutes: data.etaMinutes,
      timestamp: Date.now(),
    };

    // Remove existing bid from same driver if present and replace
    ride.bids = ride.bids.filter((b) => b.driverId !== data.driverId);
    ride.bids.push(bid);

    this.persistToStore();
    return bid;
  }

  acceptBid(rideId: string, bidId: string): { ride: ActiveRide; acceptedBid: ActiveBid } {
    const ride = this.activeRides.get(rideId);
    if (!ride) throw new NotFoundException('Ride not found');

    const bid = ride.bids.find((b) => b.id === bidId);
    if (!bid) throw new NotFoundException('Bid not found');

    ride.status = 'ACCEPTED';
    ride.selectedDriverId = bid.driverId;
    ride.selectedDriverName = bid.driverName;
    ride.selectedDriverPhone = bid.driverPhone;
    ride.selectedVehicleModel = bid.vehicleModel;
    ride.finalAgreedFare = bid.bidAmount;

    this.persistToStore();
    return { ride, acceptedBid: bid };
  }

  async completeRide(rideId: string): Promise<{ ride: ActiveRide; commissionDeducted: number }> {
    const ride = this.activeRides.get(rideId);
    if (!ride) throw new NotFoundException('Ride not found');

    ride.status = 'COMPLETED';

    const fare = ride.finalAgreedFare || ride.initialOfferFare;
    const commissionPercent = 8.0; // 8% Bhairab rate
    const commissionDeducted = Math.round((fare * commissionPercent) / 100);
    ride.commissionBdt = commissionDeducted;

    if (ride.selectedDriverId) {
      const tx = await this.walletService.deductCommission(
        ride.selectedDriverId,
        commissionDeducted,
        ride.id,
      );
      this.syncDriverWalletBalance(ride.selectedDriverId, tx.balanceAfter);
    }

    this.persistToStore();
    return { ride, commissionDeducted };
  }

  getRide(rideId: string): ActiveRide | undefined {
    return this.activeRides.get(rideId);
  }

  getRideByTrackingToken(token: string): ActiveRide | undefined {
    for (const r of this.activeRides.values()) {
      if (r.liveTrackingToken === token) return r;
    }
    return undefined;
  }
}
