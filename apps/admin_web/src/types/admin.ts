export type VehicleType = 'EASYBIKE' | 'CNG' | 'BIKE' | 'CAR_MICROBUS';

export interface OnlineDriver {
  driverId: string;
  socketId: string;
  vehicleType: VehicleType;
  lat: number;
  lng: number;
  walletBalance: number;
  rating: number;
  driverName: string;
  driverPhone: string;
  vehicleModel: string;
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

export interface ActiveRide {
  id: string;
  passengerId: string;
  passengerName: string;
  passengerPhone: string;
  vehicleType: VehicleType;
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffAddress: string;
  initialOfferFare: number;
  finalAgreedFare?: number;
  selectedDriverId?: string;
  status: 'SEARCHING' | 'BIDDING' | 'ACCEPTED' | 'ARRIVING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  bids: ActiveBid[];
  createdAt: number;
  liveTrackingToken: string;
  sosActive?: boolean;
  sosTriggeredAt?: number;
  voiceBroadcastBangla?: string;
}

export interface WalletRecord {
  driverId: string;
  currentBalance: number;
  lastTopupAt?: string | Date;
}

export interface WalletTransactionRecord {
  id: string;
  driverId: string;
  type: 'BKASH_TOPUP' | 'NAGAD_TOPUP' | 'COMMISSION_DEDUCTION' | 'PROMOTIONAL_BONUS';
  amount: number;
  balanceAfter: number;
  referenceRideId?: string;
  gatewayTrxId?: string;
  noteBangla: string;
  createdAt: string | Date;
}

export interface BhairabLandmarkData {
  id: string;
  englishName: string;
  banglaName: string;
  category: 'transit_hub' | 'bridge' | 'commercial' | 'hospital' | 'residential';
  latitude: number;
  longitude: number;
  descriptionBangla: string;
}

export type KycStatus = 'PENDING_VERIFICATION' | 'APPROVED' | 'SUSPENDED';

export interface KycApplication {
  id: string;
  driverId: string;
  fullName: string;
  phoneNumber: string;
  nidNumber: string;
  vehicleType: VehicleType;
  vehicleModel: string;
  registrationNumber: string;
  brtaLicenseNo?: string | null;
  unionCouncilorCert?: string | null;
  wardNo?: string | null;
  status: KycStatus;
  submittedAt: string | Date;
  note?: string;
}

export interface OverviewStats {
  onlineDriversCount: number;
  activeRidesCount: number;
  completedRidesCount: number;
  totalCommissionBdt: number;
  totalGmvBdt: number;
  pendingKycCount: number;
  lowBalanceDriversCount: number;
  activeSosCount: number;
  vehicleBreakdown: {
    EASYBIKE: number;
    CNG: number;
    BIKE: number;
    CAR_MICROBUS: number;
  };
}

export interface OverviewResponse {
  success: boolean;
  stats: OverviewStats;
  onlineDrivers: OnlineDriver[];
  activeRides: ActiveRide[];
  wallets: WalletRecord[];
  recentTransactions: WalletTransactionRecord[];
  landmarks: BhairabLandmarkData[];
}

export interface BaseFareEstimate {
  vehicleType: VehicleType;
  distanceKm: number;
  estimatedMinutes: number;
  suggestedFareBdt: number;
  minimumFareBdt: number;
}

export interface AdminLiveEvent {
  id: string;
  type:
    | 'RIDE_REQUESTED'
    | 'NEW_BID'
    | 'BID_ACCEPTED'
    | 'RIDE_COMPLETED'
    | 'WALLET_TOPUP'
    | 'KYC_UPDATED'
    | 'SOS_ALERT'
    | 'DRIVER_ONLINE'
    | 'DRIVER_LOCATION'
    | string;
  payload: any;
  timestamp: number;
}
