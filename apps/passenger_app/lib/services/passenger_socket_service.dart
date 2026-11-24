import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../models/passenger_models.dart';
import 'passenger_api_service.dart';

/// Real-time Socket.io client & state manager for the CholoBhairab Passenger App.
/// Connects to `apiService.baseUrl` (`kApiUrl`, or `http://10.0.2.2:4000` on Android emulator).
/// In demo mode ([kDemoMode]) it also simulates driver offers and driver movement so the app
/// can be shown without live drivers.
class PassengerSocketService extends ChangeNotifier {
  final PassengerApiService apiService;

  io.Socket? _socket;
  bool _isConnected = false;
  PassengerSession _session = PassengerSession.demo();

  ActiveRideModel? _activeRide;
  final List<DriverBidModel> _incomingBids = [];
  String? _errorMessage;
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

  /// Last server error (e.g. an offer that was no longer available). Cleared by [clearError].
  String? get errorMessage => _errorMessage;
  int? get lastCompletedFareBdt => _lastCompletedFareBdt;

  void updateSession(PassengerSession newSession) {
    _session = newSession;
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
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
        debugPrint('PassengerSocketService connected to ${apiService.baseUrl}');
        notifyListeners();
      });

      socket.onDisconnect((_) {
        _isConnected = false;
        notifyListeners();
      });

      socket.onConnectError((err) {
        _isConnected = false;
        debugPrint('Socket connect error: $err');
        notifyListeners();
      });

      // 1. Listen to ride:created
      socket.on('ride:created', (data) {
        if (data is Map && _activeRide != null) {
          final map = Map<String, dynamic>.from(data);
          _activeRide = _activeRide!.copyWith(
            rideId: (map['rideId'] ?? _activeRide!.rideId).toString(),
            status: 'SEARCHING',
            initialOfferFare:
                (map['initialOfferFare'] as num?)?.round() ?? _activeRide!.initialOfferFare,
            liveTrackingToken:
                (map['liveTrackingToken'] ?? _activeRide!.liveTrackingToken).toString(),
          );
          notifyListeners();
        }
      });

      // 2. Listen to ride:new_bid
      socket.on('ride:new_bid', (data) {
        if (data is Map) {
          _upsertBid(DriverBidModel.fromJson(Map<String, dynamic>.from(data)));
        }
      });

      // 3. Listen to ride:driver_assigned
      socket.on('ride:driver_assigned', (data) {
        if (data is Map && _activeRide != null) {
          final map = Map<String, dynamic>.from(data);
          final agreedFare = (map['agreedFare'] as num?)?.round() ?? _activeRide!.initialOfferFare;
          final assigned = DriverBidModel(
            bidId: (map['bidId'] ?? 'bid_assigned').toString(),
            driverId: (map['driverId'] ?? 'driver_demo_1').toString(),
            driverName: (map['driverName'] ?? 'মোঃ রফিকুল ইসলাম').toString(),
            driverPhone: (map['driverPhone'] ?? '01811223301').toString(),
            ratingAvg: (map['ratingAvg'] as num?)?.toDouble() ?? 4.9,
            vehicleModel: (map['vehicleModel'] ?? 'ভৈরব ইজিবাইক #১২').toString(),
            bidAmount: agreedFare,
            etaMinutes: (map['etaMinutes'] as num?)?.round() ?? 2,
            timestamp: DateTime.now().millisecondsSinceEpoch,
          );

          _activeRide = _activeRide!.copyWith(
            status: 'ACCEPTED',
            agreedFare: agreedFare,
            assignedDriver: assigned,
            driverLat: _activeRide!.pickupLat - 0.0025,
            driverLng: _activeRide!.pickupLng + 0.0020,
          );
          _startSimulatedGpsTelemetryIfIdle();
          notifyListeners();
        }
      });

      // Driver reached the pickup / started the trip (newer backends).
      socket.on('ride:driver_arrived', (_) => _setStatus('ARRIVING'));
      socket.on('ride:started', (_) => _setStatus('IN_PROGRESS'));

      // 4. Listen to ride:driver_location (the real driver started the trip)
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
        if (data is Map && _activeRide != null) {
          final map = Map<String, dynamic>.from(data);
          _lastCompletedFareBdt = (map['totalFare'] as num?)?.round() ??
              _activeRide!.agreedFare ??
              _activeRide!.initialOfferFare;
          _activeRide = _activeRide!.copyWith(status: 'COMPLETED');
          _demoGpsStreamTimer?.cancel();
          notifyListeners();
        }
      });

      // 6. Listen to rider:error (e.g. accepting an offer that is no longer available)
      socket.on('rider:error', (data) {
        _errorMessage = (data is Map ? data['message'] : null)?.toString() ?? 'error';
        final ride = _activeRide;
        if (ride != null && ride.status == 'ACCEPTED') {
          // Undo the optimistic accept so the passenger can pick another offer.
          _demoGpsStreamTimer?.cancel();
          final failedBidId = ride.assignedDriver?.bidId;
          _incomingBids.removeWhere((b) => b.bidId == failedBidId);
          _activeRide = ride.withoutDriver();
        }
        notifyListeners();
      });

      _socket = socket;
    } catch (e) {
      _isConnected = false;
      debugPrint('Socket initialization failed: $e');
    }
  }

  void _upsertBid(DriverBidModel bid) {
    _incomingBids.removeWhere((b) => b.driverId == bid.driverId);
    _incomingBids.add(bid);
    if (_activeRide != null &&
        (_activeRide!.status == 'SEARCHING' || _activeRide!.status == 'BIDDING')) {
      _activeRide = _activeRide!.copyWith(status: 'BIDDING');
    }
    notifyListeners();
  }

  void _setStatus(String status) {
    final ride = _activeRide;
    if (ride == null || ride.status == 'COMPLETED') return;
    _activeRide = ride.copyWith(status: status);
    notifyListeners();
  }

  /// Cancels the ride on the server (the driver is told) and clears it on this phone.
  void cancelRide() {
    final ride = _activeRide;
    if (ride != null && _isConnected && _socket != null) {
      _socket!.emit('rider:cancel_ride', {'rideId': ride.rideId});
    }
    resetRide();
  }

  /// Hides an offer on this phone (the backend has no decline event).
  void declineBid(String bidId) {
    _incomingBids.removeWhere((b) => b.bidId == bidId);
    notifyListeners();
  }

  /// Emits `rider:request_ride`; in demo mode also schedules simulated driver offers.
  void requestRide({
    required String vehicleType,
    required BhairabLandmark pickup,
    required BhairabLandmark dropoff,
    required int initialOfferFare,
  }) {
    _cancelDemoTimers();
    _incomingBids.clear();
    _errorMessage = null;
    _lastCompletedFareBdt = null;

    final now = DateTime.now().millisecondsSinceEpoch;
    _activeRide = ActiveRideModel(
      rideId: 'ride_$now',
      status: 'SEARCHING',
      pickupAddress: pickup.banglaName,
      dropoffAddress: dropoff.banglaName,
      pickupLat: pickup.latitude,
      pickupLng: pickup.longitude,
      dropoffLat: dropoff.latitude,
      dropoffLng: dropoff.longitude,
      initialOfferFare: initialOfferFare,
      liveTrackingToken: 'track_bhairab_${now.toString().substring(7)}',
      vehicleType: vehicleType,
    );
    notifyListeners();

    if (_isConnected && _socket != null) {
      _socket!.emit('rider:request_ride', {
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
      });
    }

    if (kDemoMode) _scheduleSimulatedDriverBids(vehicleType, initialOfferFare);
  }

  void _scheduleSimulatedDriverBids(String vehicleType, int offerFare) {
    bool stillBidding() =>
        _activeRide != null &&
        (_activeRide!.status == 'SEARCHING' || _activeRide!.status == 'BIDDING');

    _demoBidTimer1 = Timer(const Duration(milliseconds: 2200), () {
      if (!stillBidding() || _incomingBids.isNotEmpty) return;
      _upsertBid(_simulatedBid(1, 'driver_demo_1', 'মোঃ রফিকুল ইসলাম', '01811223301', 4.9,
          vehicleType, offerFare, 2));
    });

    _demoBidTimer2 = Timer(const Duration(milliseconds: 3800), () {
      if (!stillBidding() || _incomingBids.length >= 2) return;
      _upsertBid(_simulatedBid(2, 'driver_demo_2', 'কামাল হোসেন', '01711223302', 4.8,
          vehicleType, offerFare + 10, 1));
    });

    _demoBidTimer3 = Timer(const Duration(milliseconds: 5500), () {
      if (!stillBidding() || _incomingBids.length >= 3) return;
      _upsertBid(_simulatedBid(3, 'driver_demo_6', 'শফিকুল আলম', '01811223306', 4.7,
          vehicleType, offerFare + 20, 3));
    });
  }

  DriverBidModel _simulatedBid(int variant, String driverId, String name, String phone,
      double rating, String vehicleType, int amount, int eta) {
    final now = DateTime.now().millisecondsSinceEpoch;
    return DriverBidModel(
      bidId: 'bid_sim_${variant}_$now',
      driverId: driverId,
      driverName: name,
      driverPhone: phone,
      ratingAvg: rating,
      vehicleModel: _vehicleModelForType(vehicleType, variant),
      bidAmount: amount,
      etaMinutes: eta,
      timestamp: now,
    );
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

    if (_isConnected && _socket != null && !bid.isSimulated) {
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
    _startSimulatedGpsTelemetryIfIdle();
    notifyListeners();
  }

  /// Demo only: the driver drives to the pickup (ACCEPTED), waits there (ARRIVING), then drives
  /// to the drop-off (IN_PROGRESS).
  void _startSimulatedGpsTelemetryIfIdle() {
    _demoGpsStreamTimer?.cancel();
    final ride = _activeRide;
    if (!kDemoMode || ride == null) return;

    const approachSteps = 4;
    const waitSteps = 2;
    const tripSteps = 25;
    final startLat = ride.driverLat ?? ride.pickupLat;
    final startLng = ride.driverLng ?? ride.pickupLng;
    var step = 0;

    _demoGpsStreamTimer = Timer.periodic(const Duration(seconds: 2), (timer) {
      final current = _activeRide;
      if (current == null || current.status == 'COMPLETED' || current.status == 'BIDDING') {
        timer.cancel();
        return;
      }
      step++;
      final double lat;
      final double lng;
      final String status;
      if (step <= approachSteps) {
        final t = step / approachSteps;
        lat = startLat + (current.pickupLat - startLat) * t;
        lng = startLng + (current.pickupLng - startLng) * t;
        status = step == approachSteps ? 'ARRIVING' : 'ACCEPTED';
      } else if (step <= approachSteps + waitSteps) {
        lat = current.pickupLat;
        lng = current.pickupLng;
        status = 'ARRIVING';
      } else {
        final t = ((step - approachSteps - waitSteps) / tripSteps).clamp(0.0, 1.0);
        lat = current.pickupLat + (current.dropoffLat - current.pickupLat) * t;
        lng = current.pickupLng + (current.dropoffLng - current.pickupLng) * t;
        status = 'IN_PROGRESS';
      }

      _activeRide = current.copyWith(
        status: status,
        driverLat: double.parse(lat.toStringAsFixed(5)),
        driverLng: double.parse(lng.toStringAsFixed(5)),
      );
      notifyListeners();

      if (step >= approachSteps + waitSteps + tripSteps) timer.cancel();
    });
  }

  /// Triggers or resolves SOS via both REST and Socket.io
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
    notifyListeners();
    return result;
  }

  /// Demo only: completes the active ride on this phone (cash handover).
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
    notifyListeners();
  }

  /// Clears the current ride on this phone (the backend has no cancel event).
  void resetRide() {
    _cancelDemoTimers();
    _activeRide = null;
    _incomingBids.clear();
    _errorMessage = null;
    notifyListeners();
  }

  void _cancelDemoTimers() {
    _demoBidTimer1?.cancel();
    _demoBidTimer2?.cancel();
    _demoBidTimer3?.cancel();
    // A new request must not inherit the previous trip's simulated GPS stream.
    _demoGpsStreamTimer?.cancel();
  }

  @override
  void dispose() {
    _cancelDemoTimers();
    _socket?.dispose();
    super.dispose();
  }
}
