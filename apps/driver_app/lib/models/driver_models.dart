class BhairabLandmark {
  final String id;
  final String englishName;
  final String banglaName;
  final String category;
  final double latitude;
  final double longitude;
  final String descriptionBangla;

  const BhairabLandmark({
    required this.id,
    required this.englishName,
    required this.banglaName,
    required this.category,
    required this.latitude,
    required this.longitude,
    required this.descriptionBangla,
  });

  factory BhairabLandmark.fromJson(Map<String, dynamic> json) {
    return BhairabLandmark(
      id: (json['id'] ?? '').toString(),
      englishName: (json['englishName'] ?? '').toString(),
      banglaName: (json['banglaName'] ?? '').toString(),
      category: (json['category'] ?? 'transit_hub').toString(),
      latitude: (json['latitude'] as num?)?.toDouble() ?? 24.0487,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 90.9852,
      descriptionBangla: (json['descriptionBangla'] ?? '').toString(),
    );
  }

  static const List<BhairabLandmark> defaultLandmarks = [
    BhairabLandmark(
      id: 'bhairab-rail-station',
      englishName: 'Bhairab Bazar Railway Junction',
      banglaName: 'ভৈরব বাজার রেলওয়ে জংশন',
      category: 'transit_hub',
      latitude: 24.0487,
      longitude: 90.9852,
      descriptionBangla: 'ভৈরব এর প্রধান ট্রেন স্টেশন, ঢাকা-চট্টগ্রাম-সিলেট রেলওয়ে সংযোগ',
    ),
    BhairabLandmark(
      id: 'meghna-bridge-point',
      englishName: 'Syed Nazrul Islam Bridge (Meghna Bridge)',
      banglaName: 'সৈয়দ নজরুল ইসলাম সেতু (মেঘনা ব্রিজ গোলচত্বর)',
      category: 'bridge',
      latitude: 24.0418,
      longitude: 91.0022,
      descriptionBangla: 'আশুগঞ্জ ও সিলেট হাইওয়ে প্রবেশদ্বার',
    ),
    BhairabLandmark(
      id: 'bhairab-bus-stand',
      englishName: 'Bhairab Central Bus Stand (Kachari Mor)',
      banglaName: 'ভৈরব বাস টার্মিনাল (কাচারি মোড়)',
      category: 'transit_hub',
      latitude: 24.0535,
      longitude: 90.9811,
      descriptionBangla: 'ঢাকা-কিশোরগঞ্জ বাস এবং মাইক্রোবাস কাউন্টার',
    ),
    BhairabLandmark(
      id: 'bhairab-bazar-ghat',
      englishName: 'Bhairab Bazar Old River Ghat',
      banglaName: 'ভৈরব বাজার পুরাতন নদী ঘাট',
      category: 'commercial',
      latitude: 24.0425,
      longitude: 90.9840,
      descriptionBangla: 'মেঘনা নদী তীরবর্তী প্রধান পাইকারি বাজার ও ট্রলার ঘাট',
    ),
    BhairabLandmark(
      id: 'chandiber-mor',
      englishName: 'Chandiber Mor & Upazila Hospital',
      banglaName: 'চণ্ডীবের মোড় (উপজেলা স্বাস্থ্য কমপ্লেক্স)',
      category: 'hospital',
      latitude: 24.0620,
      longitude: 90.9785,
      descriptionBangla: 'ভৈরব ৫০ শয্যা বিশিষ্ট হাসপাতাল ও আবাসিক এলাকা',
    ),
    BhairabLandmark(
      id: 'shimulkandi-mor',
      englishName: 'Shimulkandi Mor',
      banglaName: 'শিমুলকান্দি মোড়',
      category: 'residential',
      latitude: 24.0750,
      longitude: 90.9650,
      descriptionBangla: 'ভৈরব-কুলিয়ারচর আঞ্চলিক সড়ক সংযোগ',
    ),
  ];
}

class DriverProfileModel {
  final String driverId;
  final String driverName;
  final String driverPhone;
  final String vehicleType; // 'EASYBIKE' | 'CNG' | 'BIKE' | 'CAR_MICROBUS'
  final String vehicleModel;
  final String registrationNumber;
  final String nidNumber;
  final String? brtaLicenseNo;
  final String? unionCouncilorCert;
  final String kycStatus; // 'APPROVED' | 'PENDING' | 'REJECTED'
  final double rating;
  final double lat;
  final double lng;
  final String currentLandmarkBangla;

  const DriverProfileModel({
    required this.driverId,
    required this.driverName,
    required this.driverPhone,
    required this.vehicleType,
    required this.vehicleModel,
    required this.registrationNumber,
    required this.nidNumber,
    this.brtaLicenseNo,
    this.unionCouncilorCert,
    this.kycStatus = 'APPROVED',
    this.rating = 4.9,
    this.lat = 24.0487,
    this.lng = 90.9852,
    this.currentLandmarkBangla = 'ভৈরব বাজার রেলওয়ে জংশন',
  });

  DriverProfileModel copyWith({
    String? driverId,
    String? driverName,
    String? driverPhone,
    String? vehicleType,
    String? vehicleModel,
    String? registrationNumber,
    String? nidNumber,
    String? brtaLicenseNo,
    String? unionCouncilorCert,
    String? kycStatus,
    double? rating,
    double? lat,
    double? lng,
    String? currentLandmarkBangla,
  }) {
    return DriverProfileModel(
      driverId: driverId ?? this.driverId,
      driverName: driverName ?? this.driverName,
      driverPhone: driverPhone ?? this.driverPhone,
      vehicleType: vehicleType ?? this.vehicleType,
      vehicleModel: vehicleModel ?? this.vehicleModel,
      registrationNumber: registrationNumber ?? this.registrationNumber,
      nidNumber: nidNumber ?? this.nidNumber,
      brtaLicenseNo: brtaLicenseNo ?? this.brtaLicenseNo,
      unionCouncilorCert: unionCouncilorCert ?? this.unionCouncilorCert,
      kycStatus: kycStatus ?? this.kycStatus,
      rating: rating ?? this.rating,
      lat: lat ?? this.lat,
      lng: lng ?? this.lng,
      currentLandmarkBangla:
          currentLandmarkBangla ?? this.currentLandmarkBangla,
    );
  }

  String get vehicleTypeBangla {
    switch (vehicleType) {
      case 'EASYBIKE':
        return 'ইজিবাইক / টমটম';
      case 'CNG':
        return 'সিএনজি অটোরিকশা';
      case 'BIKE':
        return 'মোটরবাইক';
      case 'CAR_MICROBUS':
        return 'কার / মাইক্রোবাস';
      default:
        return vehicleType;
    }
  }

  bool get requiresMunicipalCertificate =>
      vehicleType == 'EASYBIKE' || vehicleType == 'CNG';

  Map<String, dynamic> toJson() {
    return {
      'driverId': driverId,
      'driverName': driverName,
      'driverPhone': driverPhone,
      'vehicleType': vehicleType,
      'vehicleModel': vehicleModel,
      'registrationNumber': registrationNumber,
      'nidNumber': nidNumber,
      'brtaLicenseNo': brtaLicenseNo,
      'unionCouncilorCert': unionCouncilorCert,
      'kycStatus': kycStatus,
      'rating': rating,
      'lat': lat,
      'lng': lng,
      'currentLandmarkBangla': currentLandmarkBangla,
    };
  }
}

class IncomingRideOpportunity {
  final String rideId;
  final String passengerName;
  final String pickupAddress;
  final double pickupLat;
  final double pickupLng;
  final String dropoffAddress;
  /// Sent by newer backends; older ones omit it (then the app looks the place up by name).
  final double? dropoffLat;
  final double? dropoffLng;
  final double initialOfferFare;
  final String audioPromptBangla;
  final int expiresInSeconds;
  final DateTime receivedAt;

  const IncomingRideOpportunity({
    required this.rideId,
    required this.passengerName,
    required this.pickupAddress,
    required this.pickupLat,
    required this.pickupLng,
    required this.dropoffAddress,
    this.dropoffLat,
    this.dropoffLng,
    required this.initialOfferFare,
    required this.audioPromptBangla,
    required this.expiresInSeconds,
    required this.receivedAt,
  });

  factory IncomingRideOpportunity.fromJson(Map<String, dynamic> json) {
    final pickupAddress =
        (json['pickupAddress'] ?? 'ভৈরব বাজার রেলওয়ে জংশন').toString();
    final dropoffAddress =
        (json['dropoffAddress'] ?? 'সৈয়দ নজরুল ইসলাম সেতু (মেঘনা ব্রিজ)')
            .toString();
    final initialOfferFare =
        (json['initialOfferFare'] as num?)?.toDouble() ?? 80.0;
    final defaultPrompt =
        'নতুন ট্রিপ রিকোয়েস্ট: $pickupAddress থেকে $dropoffAddress, প্রস্তাবিত ভাড়া ${initialOfferFare.toStringAsFixed(0)} টাকা';

    return IncomingRideOpportunity(
      rideId: (json['rideId'] ?? 'ride_${DateTime.now().millisecondsSinceEpoch}')
          .toString(),
      passengerName: (json['passengerName'] ?? 'আব্দুল করিম').toString(),
      pickupAddress: pickupAddress,
      pickupLat: (json['pickupLat'] as num?)?.toDouble() ?? 24.0487,
      pickupLng: (json['pickupLng'] as num?)?.toDouble() ?? 90.9852,
      dropoffAddress: dropoffAddress,
      dropoffLat: (json['dropoffLat'] as num?)?.toDouble(),
      dropoffLng: (json['dropoffLng'] as num?)?.toDouble(),
      initialOfferFare: initialOfferFare,
      audioPromptBangla:
          (json['audioPromptBangla'] ?? defaultPrompt).toString(),
      expiresInSeconds: (json['expiresInSeconds'] as num?)?.toInt() ?? 60,
      receivedAt: DateTime.now(),
    );
  }
}

class ActiveDriverTrip {
  final String rideId;
  final String passengerName;
  final String passengerPhone;
  final String pickupAddress;
  final double pickupLat;
  final double pickupLng;
  final String dropoffAddress;
  /// Sent by newer backends; older ones omit it (then the app looks the place up by name).
  final double? dropoffLat;
  final double? dropoffLng;
  final double agreedFare;
  final String messageBangla;
  final DateTime startedAt;

  const ActiveDriverTrip({
    required this.rideId,
    required this.passengerName,
    required this.passengerPhone,
    required this.pickupAddress,
    required this.pickupLat,
    required this.pickupLng,
    required this.dropoffAddress,
    this.dropoffLat,
    this.dropoffLng,
    required this.agreedFare,
    required this.messageBangla,
    required this.startedAt,
  });

  factory ActiveDriverTrip.fromJson(Map<String, dynamic> json) {
    return ActiveDriverTrip(
      rideId: (json['rideId'] ?? '').toString(),
      passengerName: (json['passengerName'] ?? 'আব্দুল করিম').toString(),
      passengerPhone: (json['passengerPhone'] ?? '01700000001').toString(),
      pickupAddress:
          (json['pickupAddress'] ?? 'ভৈরব বাজার রেলওয়ে জংশন').toString(),
      pickupLat: (json['pickupLat'] as num?)?.toDouble() ?? 24.0487,
      pickupLng: (json['pickupLng'] as num?)?.toDouble() ?? 90.9852,
      dropoffAddress:
          (json['dropoffAddress'] ?? 'সৈয়দ নজরুল ইসলাম সেতু (মেঘনা ব্রিজ)')
              .toString(),
      dropoffLat: (json['dropoffLat'] as num?)?.toDouble(),
      dropoffLng: (json['dropoffLng'] as num?)?.toDouble(),
      agreedFare: (json['agreedFare'] as num?)?.toDouble() ?? 90.0,
      messageBangla: (json['messageBangla'] ??
              'রাইড কনফার্ম হয়েছে! যাত্রীর কাছে রওয়ানা হন।')
          .toString(),
      startedAt: DateTime.now(),
    );
  }
}

class CompletedRideSummary {
  final String rideId;
  final double cashCollected;
  final double commissionDeductedBdt;
  final String messageBangla;
  final DateTime completedAt;

  const CompletedRideSummary({
    required this.rideId,
    required this.cashCollected,
    required this.commissionDeductedBdt,
    required this.messageBangla,
    required this.completedAt,
  });

  factory CompletedRideSummary.fromJson(Map<String, dynamic> json) {
    final cash = (json['cashCollected'] as num?)?.toDouble() ?? 90.0;
    final comm = (json['commissionDeductedBdt'] as num?)?.toDouble() ??
        (cash * 0.08).roundToDouble();
    return CompletedRideSummary(
      rideId: (json['rideId'] ?? '').toString(),
      cashCollected: cash,
      commissionDeductedBdt: comm,
      messageBangla: (json['messageBangla'] ??
              'নগদ গ্রহণ করুন: ${cash.toStringAsFixed(0)} টাকা (৮% কমিশন কর্তন: ${comm.toStringAsFixed(0)} টাকা)')
          .toString(),
      completedAt: DateTime.now(),
    );
  }
}

class DriverWalletModel {
  static const double minimumBidBalanceBdt = 50.0;
  static const double platformCommissionRate = 0.08;

  final String driverId;
  final double currentBalance;
  final bool isLockedOut;
  final DateTime lastTopupAt;

  const DriverWalletModel({
    required this.driverId,
    required this.currentBalance,
    required this.isLockedOut,
    required this.lastTopupAt,
  });

  factory DriverWalletModel.fromJson(Map<String, dynamic> json) {
    final balance = (json['currentBalance'] as num?)?.toDouble() ?? 193.0;
    final topupRaw = json['lastTopupAt'];
    DateTime parsedTopup = DateTime.now();
    if (topupRaw is String) {
      parsedTopup = DateTime.tryParse(topupRaw) ?? DateTime.now();
    }
    return DriverWalletModel(
      driverId: (json['driverId'] ?? 'driver_demo_1').toString(),
      currentBalance: balance,
      isLockedOut: balance < minimumBidBalanceBdt,
      lastTopupAt: parsedTopup,
    );
  }

  DriverWalletModel copyWith({
    String? driverId,
    double? currentBalance,
    bool? isLockedOut,
    DateTime? lastTopupAt,
  }) {
    final nextBalance = currentBalance ?? this.currentBalance;
    return DriverWalletModel(
      driverId: driverId ?? this.driverId,
      currentBalance: nextBalance,
      isLockedOut: isLockedOut ?? (nextBalance < minimumBidBalanceBdt),
      lastTopupAt: lastTopupAt ?? this.lastTopupAt,
    );
  }
}

class WalletTransactionModel {
  final String id;
  final String type; // 'BKASH_TOPUP' | 'NAGAD_TOPUP' | 'COMMISSION_DEDUCTION' | 'PROMOTIONAL_BONUS'
  final double amount;
  final double balanceAfter;
  final String noteBangla;
  final String? gatewayTrxId;
  final String? referenceRideId;
  final DateTime createdAt;

  const WalletTransactionModel({
    required this.id,
    required this.type,
    required this.amount,
    required this.balanceAfter,
    required this.noteBangla,
    this.gatewayTrxId,
    this.referenceRideId,
    required this.createdAt,
  });

  factory WalletTransactionModel.fromJson(Map<String, dynamic> json) {
    final createdRaw = json['createdAt'];
    DateTime parsedCreated = DateTime.now();
    if (createdRaw is String) {
      parsedCreated = DateTime.tryParse(createdRaw) ?? DateTime.now();
    }
    return WalletTransactionModel(
      id: (json['id'] ?? 'tx_${DateTime.now().millisecondsSinceEpoch}')
          .toString(),
      type: (json['type'] ?? 'BKASH_TOPUP').toString(),
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      balanceAfter: (json['balanceAfter'] as num?)?.toDouble() ?? 0.0,
      noteBangla: (json['noteBangla'] ?? '').toString(),
      gatewayTrxId: json['gatewayTrxId']?.toString(),
      referenceRideId: json['referenceRideId']?.toString(),
      createdAt: parsedCreated,
    );
  }

  bool get isCredit => amount >= 0;

  String get typeBadgeBangla {
    switch (type) {
      case 'BKASH_TOPUP':
        return 'বিকাশ রিচার্জ';
      case 'NAGAD_TOPUP':
        return 'নগদ রিচার্জ';
      case 'COMMISSION_DEDUCTION':
        return '৮% কমিশন কর্তন';
      case 'PROMOTIONAL_BONUS':
        return 'স্বাগতম বোনাস';
      default:
        return type;
    }
  }
}
