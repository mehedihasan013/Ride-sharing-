import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../models/passenger_models.dart';
import 'passenger_api_service.dart';

/// Real-time Socket.io client & state manager for the CholoBhairab Passenger App.
/// Connects to `apiService.baseUrl` (`kApiUrl`, or `http://10.0.2.2:4000` on Android emulator)
/// and includes a seamless built-in demo simulator when offline or when no live driver responds.
class PassengerSocketService extends ChangeNotifier {
  final PassengerApiService apiService;

  io.Socket? _socket;
  bool _isConnected = false;
  bool _isOfflineDemoMode = false;
  PassengerSession _session = PassengerSession.demo();

  ActiveRideModel? _activeRide;
  final List<DriverBidModel> _incomingBids = [];
  String? _statusBannerBangla;
  String? _errorBannerBangla;
  int? _lastCompletedFareBdt;

  Timer? _demoBidTimer1;
  Timer? _demoBidTimer2;
  Timer? _demoBidTimer3;
  Timer? _demoGpsStreamTimer;

  PassengerSocketService({PassengerApiService? apiService})
      : apiService = apiService ?? PassengerApiService() {
    connectSocket();
  }

  bool get isConnected => _isConnected;
  bool get isOfflineDemoMode => _isOfflineDemoMode;
  PassengerSession get session => _session;
  ActiveRideModel? get activeRide => _activeRide;

  /// Returns incoming bids sorted by lowest bid amount first, then fastest ETA.
  List<DriverBidModel> get incomingBids {
    final copy = List<DriverBidModel>.from(_incomingBids);
    copy.sort((a, b) {
      final priceCmp = a.bidAmount.compareTo(b.bidAmount);
      if (priceCmp != 0) return priceCmp;
      return a.etaMinutes.compareTo(b.etaMinutes);
    });
    return copy;
  }

  String? get statusBannerBangla => _statusBannerBangla;
  String? get errorBannerBangla => _errorBannerBangla;
  int? get lastCompletedFareBdt => _lastCompletedFareBdt;

  void updateSession(PassengerSession newSession) {
    _session = newSession;
    notifyListeners();
  }

  void clearBanners() {
    _statusBannerBangla = null;
    _errorBannerBangla = null;
    notifyListeners();
  }

  /// Connects to the NestJS Socket.io gateway
  void connectSocket({String? customUrl}) {
    if (customUrl != null && customUrl.trim().isNotEmpty) {
      apiService.baseUrl = customUrl.trim();
    }

    _socket?.dispose();

    try {
      final socket = io.io(
        apiService.baseUrl,
        io.OptionBuilder()
            .setTransports(['websocket', 'polling'])
            .enableAutoConnect()
            .enableReconnection()
            .setReconnectionAttempts(5)
            .setReconnectionDelay(1500)
            .build(),
      );

      socket.onConnect((_) {
        _isConnected = true;
        _isOfflineDemoMode = false;
        debugPrint('PassengerSocketService connected to ${apiService.baseUrl}');
        notifyListeners();
      });

      socket.onDisconnect((_) {
        _isConnected = false;
        notifyListeners();
      });

      socket.onConnectError((err) {
        _isConnected = false;
        _isOfflineDemoMode = true;
        debugPrint('Socket connect error (offline demo fallback active): $err');
        notifyListeners();
      });

      // 1. Listen to ride:created
      socket.on('ride:created', (data) {
        if (data is Map) {
          final map = Map<String, dynamic>.from(data);
          final rideId = (map['rideId'] ?? _activeRide?.rideId ?? '').toString();
          final trackingToken =
              (map['liveTrackingToken'] ?? 'track_bhairab_live').toString();
          final offerFare = (map['initialOfferFare'] as num?)?.round() ??
              _activeRide?.initialOfferFare ??
              80;

          if (_activeRide != null) {
            _activeRide = _activeRide!.copyWith(
              rideId: rideId,
              status: 'SEARCHING',
              initialOfferFare: offerFare,
              liveTrackingToken: trackingToken,
            );
          }
          _statusBannerBangla =
              'নিকটস্থ ভৈরব চালকদের কাছে আপনার ৳$offerFare প্রস্তাব পাঠানো হয়েছে...';
          notifyListeners();
        }
      });

      // 2. Listen to ride:new_bid
      socket.on('ride:new_bid', (data) {
        if (data is Map) {
          final map = Map<String, dynamic>.from(data);
          final bid = DriverBidModel.fromJson(map);
          _upsertBid(bid);
        }
      });

      // 3. Listen to ride:driver_assigned
      socket.on('ride:driver_assigned', (data) {
        if (data is Map) {
          final map = Map<String, dynamic>.from(data);
          final agreedFare = (map['agreedFare'] as num?)?.round() ??
              _activeRide?.initialOfferFare ??
              85;
          final assigned = DriverBidModel(
            bidId: (map['bidId'] ?? 'bid_assigned').toString(),
            driverId: (map['driverId'] ?? 'driver_demo_1').toString(),
            driverName: (map['driverName'] ?? 'মোঃ রফিকুল ইসলাম').toString(),
            driverPhone: (map['driverPhone'] ?? '01811223301').toString(),
            ratingAvg: (map['ratingAvg'] as num?)?.toDouble() ?? 4.9,
            vehicleModel:
                (map['vehicleModel'] ?? 'ভৈরব ইজিবাইক #১২').toString(),
            bidAmount: agreedFare,
            etaMinutes: (map['etaMinutes'] as num?)?.round() ?? 2,
            timestamp: DateTime.now().millisecondsSinceEpoch,
          );

          if (_activeRide != null) {
            _activeRide = _activeRide!.copyWith(
              status: 'ACCEPTED',
              agreedFare: agreedFare,
              assignedDriver: assigned,
              driverLat: _activeRide!.pickupLat - 0.0025,
              driverLng: _activeRide!.pickupLng + 0.0020,
            );
          }
          _statusBannerBangla =
              '🎉 রাইড নিশ্চিত হয়েছে! ${assigned.driverName} (৳$agreedFare) আপনার দিকে আসছেন।';
          _startSimulatedGpsTelemetryIfIdle();
          notifyListeners();
        }
      });

      // 4. Listen to ride:driver_location
      socket.on('ride:driver_location', (data) {
        if (data is Map && _activeRide != null) {
          final map = Map<String, dynamic>.from(data);
          final lat = (map['lat'] as num?)?.toDouble();
          final lng = (map['lng'] as num?)?.toDouble();
          if (lat != null && lng != null) {
            _activeRide = _activeRide!.copyWith(
              status: 'IN_PROGRESS',
              driverLat: lat,
              driverLng: lng,
            );
            notifyListeners();
          }
        }
      });

      // 5. Listen to ride:completed
      socket.on('ride:completed', (data) {
        if (data is Map) {
          final map = Map<String, dynamic>.from(data);
          final totalFare = (map['totalFare'] as num?)?.round() ??
              _activeRide?.agreedFare ??
              _activeRide?.initialOfferFare ??
              80;
          final msg = (map['messageBangla'] ??
                  'ভ্রমণ সম্পন্ন হয়েছে। চলো ভৈরব সাথে থাকার জন্য ধন্যবাদ!')
              .toString();

          _lastCompletedFareBdt = totalFare;
          if (_activeRide != null) {
            _activeRide = _activeRide!.copyWith(status: 'COMPLETED');
          }
          _statusBannerBangla = msg;
          _demoGpsStreamTimer?.cancel();
          notifyListeners();
        }
      });

      // 6. Listen to rider:error
      socket.on('rider:error', (data) {
        if (data is Map) {
          _errorBannerBangla =
              (data['message'] ?? 'একটি ত্রুটি ঘটেছে').toString();
          notifyListeners();
        }
      });

      _socket = socket;
    } catch (e) {
      _isConnected = false;
      _isOfflineDemoMode = true;
      debugPrint('Socket initialization failed, using demo mode: $e');
    }
  }

  void _upsertBid(DriverBidModel bid) {
    _incomingBids.removeWhere((b) => b.driverId == bid.driverId);
    _incomingBids.add(bid);
    if (_activeRide != null &&
        (_activeRide!.status == 'SEARCHING' ||
            _activeRide!.status == 'BIDDING')) {
      _activeRide = _activeRide!.copyWith(status: 'BIDDING');
    }
    _statusBannerBangla =
        '🔔 নতুন বিড এসেছে: ${bid.driverName} প্রস্তাব করেছেন ৳${bid.bidAmount} (${bid.etaMinutes} মিনিট)';
    notifyListeners();
  }

  /// Emits `rider:request_ride` to backend and schedules fallback Bhairab driver bids
  /// if offline or if no live driver responds within a few seconds.
  void requestRide({
    required String vehicleType,
    required BhairabLandmark pickup,
    required BhairabLandmark dropoff,
    required int initialOfferFare,
  }) {
    _cancelDemoTimers();
    _incomingBids.clear();
    _errorBannerBangla = null;
    _lastCompletedFareBdt = null;

    final tempRideId = 'ride_${DateTime.now().millisecondsSinceEpoch}';
    final tempToken =
        'track_bhairab_${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';

    _activeRide = ActiveRideModel(
      rideId: tempRideId,
      status: 'SEARCHING',
      pickupAddress: pickup.banglaName,
      dropoffAddress: dropoff.banglaName,
      pickupLat: pickup.latitude,
      pickupLng: pickup.longitude,
      dropoffLat: dropoff.latitude,
      dropoffLng: dropoff.longitude,
      initialOfferFare: initialOfferFare,
      liveTrackingToken: tempToken,
      vehicleType: vehicleType,
    );

    _statusBannerBangla =
        '📡 ভৈরবে নিকটস্থ চালকদের কাছে ৳$initialOfferFare ভাড়ার প্রস্তাব পাঠানো হচ্ছে...';
    notifyListeners();

    final payload = {
      'passengerId': _session.userId,
      'passengerName': _session.fullName,
      'passengerPhone': _session.phoneNumber,
      'vehicleType': vehicleType,
      'pickupLat': pickup.latitude,
      'pickupLng': pickup.longitude,
      'pickupAddress': pickup.banglaName,
      'dropoffLat': dropoff.latitude,
      'dropoffLng': dropoff.longitude,
      'dropoffAddress': dropoff.banglaName,
      'initialOfferFare': initialOfferFare,
    };

    if (_isConnected && _socket != null) {
      _socket!.emit('rider:request_ride', payload);
    } else {
      _isOfflineDemoMode = true;
    }

    // Schedule realistic Bhairab counter-bids if no live driver bid has arrived yet
    _scheduleSimulatedDriverBids(vehicleType, initialOfferFare);
  }

  void _scheduleSimulatedDriverBids(String vehicleType, int offerFare) {
    final vehicleLabel = _vehicleModelForType(vehicleType, 1);
    final vehicleLabel2 = _vehicleModelForType(vehicleType, 2);
    final vehicleLabel3 = _vehicleModelForType(vehicleType, 3);

    _demoBidTimer1 = Timer(const Duration(milliseconds: 2200), () {
      if (_activeRide == null ||
          (_activeRide!.status != 'SEARCHING' &&
              _activeRide!.status != 'BIDDING')) {
        return;
      }
      // Only inject if no bid from this driver yet
      if (_incomingBids.isEmpty) {
        _upsertBid(
          DriverBidModel(
            bidId: 'bid_sim_1_${DateTime.now().millisecondsSinceEpoch}',
            driverId: 'driver_demo_1',
            driverName: 'মোঃ রফিকুল ইসলাম',
            driverPhone: '01811223301',
            ratingAvg: 4.9,
            vehicleModel: vehicleLabel,
            bidAmount: offerFare, // Accepts passenger's exact offer!
            etaMinutes: 2,
            timestamp: DateTime.now().millisecondsSinceEpoch,
          ),
        );
      }
    });

    _demoBidTimer2 = Timer(const Duration(milliseconds: 3800), () {
      if (_activeRide == null ||
          (_activeRide!.status != 'SEARCHING' &&
              _activeRide!.status != 'BIDDING')) {
        return;
      }
      if (_incomingBids.length < 2) {
        _upsertBid(
          DriverBidModel(
            bidId: 'bid_sim_2_${DateTime.now().millisecondsSinceEpoch}',
            driverId: 'driver_demo_2',
            driverName: 'কামাল হোসেন',
            driverPhone: '01711223302',
            ratingAvg: 4.8,
            vehicleModel: vehicleLabel2,
            bidAmount: offerFare + 10, // Counter-offer +10 BDT
            etaMinutes: 1,
            timestamp: DateTime.now().millisecondsSinceEpoch,
          ),
        );
      }
    });

    _demoBidTimer3 = Timer(const Duration(milliseconds: 5500), () {
      if (_activeRide == null ||
          (_activeRide!.status != 'SEARCHING' &&
              _activeRide!.status != 'BIDDING')) {
        return;
      }
      if (_incomingBids.length < 3) {
        _upsertBid(
          DriverBidModel(
            bidId: 'bid_sim_3_${DateTime.now().millisecondsSinceEpoch}',
            driverId: 'driver_demo_6',
            driverName: 'শফিকুল আলম',
            driverPhone: '01811223306',
            ratingAvg: 4.7,
            vehicleModel: vehicleLabel3,
            bidAmount: offerFare + 20, // Counter-offer +20 BDT
            etaMinutes: 3,
            timestamp: DateTime.now().millisecondsSinceEpoch,
          ),
        );
      }
    });
  }

  String _vehicleModelForType(String type, int variant) {
    switch (type) {
      case 'BIKE':
        return variant == 1
            ? 'বাজাজ পালসার ১৫০ (ভৈরব-হ-১২৪৫)'
            : variant == 2
                ? 'টিভিএস অ্যাপাচি আরটিআর ১৬০'
                : 'হিরো গ্ল্যামার ১২৫';
      case 'CNG':
        return variant == 1
            ? 'বাজাজ সিএনজি অটোরিকশা #২১'
            : variant == 2
                ? 'টিভিএস কিং সিএনজি ভৈরব #০৯'
                : 'সিএনজি এক্সপ্রেস মেঘনা #১৪';
      case 'CAR_MICROBUS':
        return variant == 1
            ? 'টয়োটা নোয়াহ হাইয়েস (ঢাকা-ভৈরব)'
            : variant == 2
                ? 'টয়োটা এক্স-নোয়াহ এসি মাইক্রোবাস'
                : 'টয়োটা প্রোবক্স স্পেশাল';
      case 'EASYBIKE':
      default:
        return variant == 1
            ? 'ভৈরব ইজিবাইক (টমটম) #১২'
            : variant == 2
                ? 'বোরাক ইজিবাইক ভৈরব #০৮'
                : 'মেঘনা টমটম এক্সপ্রেস #৩৩';
    }
  }

  /// Emits `rider:accept_bid` when passenger taps Accept on a driver bid card.
  void acceptBid(DriverBidModel bid) {
    if (_activeRide == null) return;
    _cancelDemoTimers();

    if (_isConnected && _socket != null && !bid.bidId.startsWith('bid_sim_')) {
      _socket!.emit('rider:accept_bid', {
        'rideId': _activeRide!.rideId,
        'bidId': bid.bidId,
      });
    }

    _activeRide = _activeRide!.copyWith(
      status: 'ACCEPTED',
      agreedFare: bid.bidAmount,
      assignedDriver: bid,
      driverLat: _activeRide!.pickupLat - 0.0020,
      driverLng: _activeRide!.pickupLng + 0.0018,
    );

    _statusBannerBangla =
        '🎉 রাইড কনফার্ম হয়েছে! ${bid.driverName} (${bid.vehicleModel}) ৳${bid.bidAmount} ভাড়ায় আসছেন।';
    _startSimulatedGpsTelemetryIfIdle();
    notifyListeners();
  }

  /// Streams smooth GPS movement from pickup toward dropoff so the Live Tracking radar & coordinates animate live.
  void _startSimulatedGpsTelemetryIfIdle() {
    _demoGpsStreamTimer?.cancel();
    int step = 0;
    const int totalSteps = 25;

    _demoGpsStreamTimer = Timer.periodic(const Duration(seconds: 2), (timer) {
      if (_activeRide == null ||
          _activeRide!.status == 'COMPLETED' ||
          _activeRide!.status == 'CANCELLED') {
        timer.cancel();
        return;
      }

      step++;
      final progress = (step / totalSteps).clamp(0.0, 1.0);
      final currentLat = _activeRide!.pickupLat +
          (_activeRide!.dropoffLat - _activeRide!.pickupLat) * progress;
      final currentLng = _activeRide!.pickupLng +
          (_activeRide!.dropoffLng - _activeRide!.pickupLng) * progress;

      _activeRide = _activeRide!.copyWith(
        status: progress < 1.0 ? 'IN_PROGRESS' : 'IN_PROGRESS',
        driverLat: double.parse(currentLat.toStringAsFixed(5)),
        driverLng: double.parse(currentLng.toStringAsFixed(5)),
      );
      notifyListeners();

      if (step >= totalSteps) {
        timer.cancel();
      }
    });
  }

  /// Triggers or resolves 999 Emergency SOS via both REST and Socket.io
  Future<Map<String, dynamic>> triggerEmergencySos({bool resolved = false}) async {
    final rideId = _activeRide?.rideId ?? 'demo';

    if (_isConnected && _socket != null) {
      _socket!.emit('ride:sos', {
        'rideId': rideId,
        'resolved': resolved,
      });
    }

    final result = await apiService.triggerSos(rideId, resolved: resolved);

    if (_activeRide != null) {
      _activeRide = _activeRide!.copyWith(isSosActive: !resolved);
    }
    _statusBannerBangla = !resolved
        ? '🚨 জরুরী ৯৯৯ ও কমান্ড সেন্টারে SOS অ্যালার্ট পাঠানো হয়েছে!'
        : '✓ SOS অ্যালার্ট সমাধান করা হয়েছে।';
    notifyListeners();
    return result;
  }

  /// Completes active ride (for passenger demo verification or cash handover)
  void completeActiveRideDemo() {
    if (_activeRide == null) return;
    _demoGpsStreamTimer?.cancel();
    final fare = _activeRide!.agreedFare ?? _activeRide!.initialOfferFare;
    _lastCompletedFareBdt = fare;
    _activeRide = _activeRide!.copyWith(
      status: 'COMPLETED',
      driverLat: _activeRide!.dropoffLat,
      driverLng: _activeRide!.dropoffLng,
    );
    _statusBannerBangla =
        '✅ ভ্রমণ সম্পন্ন হয়েছে! চালককে নগদ ৳$fare পরিশোধ করুন। ধন্যবাদ!';
    notifyListeners();
  }

  /// Cancels or resets the current ride back to idle booking state
  void resetRide() {
    _cancelDemoTimers();
    _demoGpsStreamTimer?.cancel();
    _activeRide = null;
    _incomingBids.clear();
    _statusBannerBangla = null;
    _errorBannerBangla = null;
    notifyListeners();
  }

  void _cancelDemoTimers() {
    _demoBidTimer1?.cancel();
    _demoBidTimer2?.cancel();
    _demoBidTimer3?.cancel();
  }

  @override
  void dispose() {
    _cancelDemoTimers();
    _demoGpsStreamTimer?.cancel();
    _socket?.dispose();
    super.dispose();
  }
}
