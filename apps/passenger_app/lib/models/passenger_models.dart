import 'dart:math' as math;

/// Represents one of the 6 core geographic landmarks in Bhairab Upazila, Kishoreganj.
class BhairabLandmark {
  final String id;
  final String englishName;
  final String banglaName;
  final String category; // 'transit_hub' | 'bridge' | 'commercial' | 'hospital' | 'residential' | 'pin' | 'intercity'
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

  Map<String, dynamic> toJson() => {
        'id': id,
        'englishName': englishName,
        'banglaName': banglaName,
        'category': category,
        'latitude': latitude,
        'longitude': longitude,
        'descriptionBangla': descriptionBangla,
      };

  /// Haversine distance in kilometers between two coordinates.
  static double calculateDistanceKm(
    double lat1,
    double lon1,
    double lat2,
    double lon2,
  ) {
    const double earthRadiusKm = 6371.0;
    final double dLat = _deg2rad(lat2 - lat1);
    final double dLon = _deg2rad(lon2 - lon1);
    final double a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(_deg2rad(lat1)) *
            math.cos(_deg2rad(lat2)) *
            math.sin(dLon / 2) *
            math.sin(dLon / 2);
    final double c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    return double.parse((earthRadiusKm * c).toStringAsFixed(2));
  }

  static double _deg2rad(double deg) => deg * (math.pi / 180.0);

  /// Pre-seeded fallback list of all 6 Bhairab landmarks matching backend/src/modules/geo/bhairab-landmarks.ts
  static const List<BhairabLandmark> defaultLandmarks = [
    BhairabLandmark(
      id: 'bhairab-rail-station',
      englishName: 'Bhairab Bazar Railway Junction',
      banglaName: 'ভৈরব বাজার রেলওয়ে জংশন',
      category: 'transit_hub',
      latitude: 24.0487,
      longitude: 90.9852,
      descriptionBangla:
          'ভৈরব এর প্রধান ট্রেন স্টেশন, ঢাকা-চট্টগ্রাম-সিলেট রেলওয়ে সংযোগ',
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
      descriptionBangla:
          'মেঘনা নদী তীরবর্তী প্রধান পাইকারি বাজার ও ট্রলার ঘাট',
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

/// Multi-modal vehicle option available in Bhairab
class VehicleOption {
  final String type; // 'EASYBIKE' | 'BIKE' | 'CNG' | 'CAR_MICROBUS'
  final String banglaName;
  final String englishName;
  final int suggestedFare;
  final int minFare;
  final int etaMinutes;

  const VehicleOption({
    required this.type,
    required this.banglaName,
    required this.englishName,
    required this.suggestedFare,
    required this.minFare,
    required this.etaMinutes,
  });

  VehicleOption copyWith({
    String? type,
    String? banglaName,
    String? englishName,
    int? suggestedFare,
    int? minFare,
    int? etaMinutes,
  }) {
    return VehicleOption(
      type: type ?? this.type,
      banglaName: banglaName ?? this.banglaName,
      englishName: englishName ?? this.englishName,
      suggestedFare: suggestedFare ?? this.suggestedFare,
      minFare: minFare ?? this.minFare,
      etaMinutes: etaMinutes ?? this.etaMinutes,
    );
  }

  factory VehicleOption.fromEstimateJson(
    Map<String, dynamic> json,
    VehicleOption fallback,
  ) {
    return fallback.copyWith(
      suggestedFare:
          (json['suggestedFareBdt'] as num?)?.round() ?? fallback.suggestedFare,
      minFare:
          (json['minimumFareBdt'] as num?)?.round() ?? fallback.minFare,
      etaMinutes:
          (json['estimatedMinutes'] as num?)?.round() ?? fallback.etaMinutes,
    );
  }

  static const List<VehicleOption> defaultOptions = [
    VehicleOption(
      type: 'EASYBIKE',
      banglaName: 'ইজিবাইক (টমটম)',
      englishName: 'Easy-Bike (Auto)',
      suggestedFare: 50,
      minFare: 20,
      etaMinutes: 3,
    ),
    VehicleOption(
      type: 'BIKE',
      banglaName: 'বাইক (মোটরসাইকেল)',
      englishName: 'Motorbike',
      suggestedFare: 65,
      minFare: 30,
      etaMinutes: 2,
    ),
    VehicleOption(
      type: 'CNG',
      banglaName: 'সিএনজি অটোরিকশা',
      englishName: 'CNG Auto-Rickshaw',
      suggestedFare: 90,
      minFare: 40,
      etaMinutes: 4,
    ),
    VehicleOption(
      type: 'CAR_MICROBUS',
      banglaName: 'মাইক্রোবাস / কার',
      englishName: 'Microbus / Noah',
      suggestedFare: 300,
      minFare: 250,
      etaMinutes: 6,
    ),
  ];
}

/// Real-time incoming driver bid during InDrive negotiation
class DriverBidModel {
  final String bidId;
  final String driverId;
  final String driverName;
  final String driverPhone;
  final double ratingAvg;
  final String vehicleModel;
  final int bidAmount;
  final int etaMinutes;
  final int timestamp;

  const DriverBidModel({
    required this.bidId,
    required this.driverId,
    required this.driverName,
    required this.driverPhone,
    required this.ratingAvg,
    required this.vehicleModel,
    required this.bidAmount,
    required this.etaMinutes,
    required this.timestamp,
  });

  /// Offers generated by the on-device demo simulator, never sent to the server.
  bool get isSimulated => bidId.startsWith('bid_sim_');

  factory DriverBidModel.fromJson(Map<String, dynamic> json) {
    return DriverBidModel(
      bidId: (json['bidId'] ?? json['id'] ?? 'bid_${DateTime.now().millisecondsSinceEpoch}').toString(),
      driverId: (json['driverId'] ?? 'driver_demo_1').toString(),
      driverName: (json['driverName'] ?? 'মোঃ রফিকুল ইসলাম').toString(),
      driverPhone: (json['driverPhone'] ?? '01811223301').toString(),
      ratingAvg: (json['ratingAvg'] as num?)?.toDouble() ?? 4.9,
      vehicleModel: (json['vehicleModel'] ?? 'ভৈরব ইজিবাইক #১২').toString(),
      bidAmount: (json['bidAmount'] as num?)?.round() ?? 80,
      etaMinutes: (json['etaMinutes'] as num?)?.round() ?? 3,
      timestamp: (json['timestamp'] as num?)?.toInt() ??
          DateTime.now().millisecondsSinceEpoch,
    );
  }

  Map<String, dynamic> toJson() => {
        'bidId': bidId,
        'driverId': driverId,
        'driverName': driverName,
        'driverPhone': driverPhone,
        'ratingAvg': ratingAvg,
        'vehicleModel': vehicleModel,
        'bidAmount': bidAmount,
        'etaMinutes': etaMinutes,
        'timestamp': timestamp,
      };
}

/// Active ride state tracked by the passenger app
class ActiveRideModel {
  final String rideId;
  final String status; // 'SEARCHING' | 'BIDDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED'
  final String pickupAddress;
  final String dropoffAddress;
  final double pickupLat;
  final double pickupLng;
  final double dropoffLat;
  final double dropoffLng;
  final int initialOfferFare;
  final int? agreedFare;
  final DriverBidModel? assignedDriver;
  final String liveTrackingToken;
  final double? driverLat;
  final double? driverLng;
  final bool isSosActive;
  final String vehicleType;

  const ActiveRideModel({
    required this.rideId,
    required this.status,
    required this.pickupAddress,
    required this.dropoffAddress,
    required this.pickupLat,
    required this.pickupLng,
    required this.dropoffLat,
    required this.dropoffLng,
    required this.initialOfferFare,
    this.agreedFare,
    this.assignedDriver,
    required this.liveTrackingToken,
    this.driverLat,
    this.driverLng,
    this.isSosActive = false,
    this.vehicleType = 'EASYBIKE',
  });

  ActiveRideModel copyWith({
    String? rideId,
    String? status,
    String? pickupAddress,
    String? dropoffAddress,
    double? pickupLat,
    double? pickupLng,
    double? dropoffLat,
    double? dropoffLng,
    int? initialOfferFare,
    int? agreedFare,
    DriverBidModel? assignedDriver,
    String? liveTrackingToken,
    double? driverLat,
    double? driverLng,
    bool? isSosActive,
    String? vehicleType,
  }) {
    return ActiveRideModel(
      rideId: rideId ?? this.rideId,
      status: status ?? this.status,
      pickupAddress: pickupAddress ?? this.pickupAddress,
      dropoffAddress: dropoffAddress ?? this.dropoffAddress,
      pickupLat: pickupLat ?? this.pickupLat,
      pickupLng: pickupLng ?? this.pickupLng,
      dropoffLat: dropoffLat ?? this.dropoffLat,
      dropoffLng: dropoffLng ?? this.dropoffLng,
      initialOfferFare: initialOfferFare ?? this.initialOfferFare,
      agreedFare: agreedFare ?? this.agreedFare,
      assignedDriver: assignedDriver ?? this.assignedDriver,
      liveTrackingToken: liveTrackingToken ?? this.liveTrackingToken,
      driverLat: driverLat ?? this.driverLat,
      driverLng: driverLng ?? this.driverLng,
      isSosActive: isSosActive ?? this.isSosActive,
      vehicleType: vehicleType ?? this.vehicleType,
    );
  }

  /// Back to bidding with no driver (copyWith can't clear nullable fields).
  ActiveRideModel withoutDriver() => ActiveRideModel(
        rideId: rideId,
        status: 'BIDDING',
        pickupAddress: pickupAddress,
        dropoffAddress: dropoffAddress,
        pickupLat: pickupLat,
        pickupLng: pickupLng,
        dropoffLat: dropoffLat,
        dropoffLng: dropoffLng,
        initialOfferFare: initialOfferFare,
        liveTrackingToken: liveTrackingToken,
        isSosActive: isSosActive,
        vehicleType: vehicleType,
      );
}

/// Scheduled Intercity Route for Bhairab <-> Dhaka / Kishoreganj / Brahmanbaria
class IntercityRouteModel {
  final String id;

  /// Pickup landmark id from [BhairabLandmark.defaultLandmarks].
  final String originLandmarkId;
  final String destinationBangla;
  final String destinationEnglish;

  /// Approximate destination coordinates (to verify with the owner before launch).
  final double destinationLat;
  final double destinationLng;

  /// Default departure, 24-hour 'HH:mm'.
  final String departureTime;
  final int seatFareBdt;
  final int fullCarFareBdt;
  final int availableSeats;
  final String vehicleNameBangla;
  final String vehicleNameEnglish;

  const IntercityRouteModel({
    required this.id,
    required this.originLandmarkId,
    required this.destinationBangla,
    required this.destinationEnglish,
    required this.destinationLat,
    required this.destinationLng,
    required this.departureTime,
    required this.seatFareBdt,
    required this.fullCarFareBdt,
    required this.availableSeats,
    required this.vehicleNameBangla,
    required this.vehicleNameEnglish,
  });

  /// Bookable departure slots shown as chips.
  static const List<String> departureSlots = ['08:30', '10:30', '12:15', '16:00', '18:30', '20:00'];

  static const List<IntercityRouteModel> defaultRoutes = [
    IntercityRouteModel(
      id: 'route_dhaka_morning',
      originLandmarkId: 'bhairab-bus-stand',
      destinationBangla: 'ঢাকা (উত্তরা / এয়ারপোর্ট / মহাখালী)',
      destinationEnglish: 'Dhaka (Uttara / Airport / Mohakhali)',
      destinationLat: 23.8759,
      destinationLng: 90.3795,
      departureTime: '08:30',
      seatFareBdt: 300,
      fullCarFareBdt: 2400,
      availableSeats: 4,
      vehicleNameBangla: 'টয়োটা নোয়াহ এসি (৭ সিট)',
      vehicleNameEnglish: 'Toyota Noah AC (7 seats)',
    ),
    IntercityRouteModel(
      id: 'route_dhaka_noon',
      originLandmarkId: 'meghna-bridge-point',
      destinationBangla: 'ঢাকা (যাত্রাবাড়ী / মতিঝিল / গুলিস্তান)',
      destinationEnglish: 'Dhaka (Jatrabari / Motijheel / Gulistan)',
      destinationLat: 23.7104,
      destinationLng: 90.4347,
      departureTime: '12:15',
      seatFareBdt: 300,
      fullCarFareBdt: 2400,
      availableSeats: 3,
      vehicleNameBangla: 'টয়োটা এক্স-নোয়াহ মাইক্রোবাস',
      vehicleNameEnglish: 'Toyota X-Noah microbus',
    ),
    IntercityRouteModel(
      id: 'route_kishoreganj_afternoon',
      originLandmarkId: 'bhairab-rail-station',
      destinationBangla: 'কিশোরগঞ্জ সদর (গাইটাল বাস স্ট্যান্ড)',
      destinationEnglish: 'Kishoreganj Sadar (Gaital bus stand)',
      destinationLat: 24.4331,
      destinationLng: 90.7830,
      departureTime: '16:00',
      seatFareBdt: 180,
      fullCarFareBdt: 1400,
      availableSeats: 4,
      vehicleNameBangla: 'টয়োটা প্রোবক্স / নোয়াহ কারপুল',
      vehicleNameEnglish: 'Toyota Probox / Noah carpool',
    ),
    IntercityRouteModel(
      id: 'route_brahmanbaria_evening',
      originLandmarkId: 'meghna-bridge-point',
      destinationBangla: 'ব্রাহ্মণবাড়িয়া সদর / বিশ্বরোড মোড়',
      destinationEnglish: 'Brahmanbaria Sadar / Biswa Road',
      destinationLat: 23.9681,
      destinationLng: 91.0965,
      departureTime: '18:30',
      seatFareBdt: 120,
      fullCarFareBdt: 900,
      availableSeats: 3,
      vehicleNameBangla: 'স্পেশাল সিএনজি / প্রাইভেট কার',
      vehicleNameEnglish: 'Special CNG / private car',
    ),
  ];
}

/// Authenticated passenger session
class PassengerSession {
  final String userId;
  final String phoneNumber;
  final String fullName;
  final String accessToken;

  const PassengerSession({
    required this.userId,
    required this.phoneNumber,
    required this.fullName,
    required this.accessToken,
  });

  factory PassengerSession.demo() {
    return const PassengerSession(
      userId: 'passenger_demo_1',
      phoneNumber: '01700000001',
      fullName: 'আব্দুল করিম (Karim)',
      accessToken: 'jwt_cholobhairab_demo_passenger_01',
    );
  }

  /// Placeholder the backend gives new passengers who haven't told us their name.
  static const newPassengerPlaceholder = 'নতুন যাত্রী';

  bool get needsName => fullName.trim().isEmpty || fullName.trim() == newPassengerPlaceholder;

  PassengerSession withName(String name) => PassengerSession(
        userId: userId,
        phoneNumber: phoneNumber,
        fullName: name.trim(),
        accessToken: accessToken,
      );

  /// Accepts the backend `session` object ({id, phoneNumber, fullName, role, token})
  /// and the app's own saved form ({id, phoneNumber, fullName, accessToken}).
  factory PassengerSession.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>? ?? json;
    return PassengerSession(
      userId: (user['id'] ?? user['userId'] ?? 'passenger_demo_1').toString(),
      phoneNumber: (user['phoneNumber'] ?? '01700000001').toString(),
      fullName: (user['fullName'] ?? '').toString(),
      accessToken: (json['accessToken'] ?? json['token'] ?? 'jwt_cholobhairab_token').toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': userId,
        'phoneNumber': phoneNumber,
        'fullName': fullName,
        'accessToken': accessToken,
      };
}
