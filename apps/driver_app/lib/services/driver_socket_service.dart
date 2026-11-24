import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../models/driver_models.dart';
import 'bangla_voice_service.dart';
import 'driver_api_service.dart';

class DriverSocketService extends ChangeNotifier {
  final DriverApiService apiService;
  final BanglaVoiceService voiceService;
  final String serverUrl;

  io.Socket? _socket;
  bool _isSocketConnected = false;

  /// Drivers start offline and go online on purpose (big "Go online" button).
  bool _isOnline = false;
  String? _lastErrorBangla;

  DriverProfileModel _profile = const DriverProfileModel(
    driverId: 'driver_demo_1',
    driverName: 'মোঃ রফিকুল ইসলাম',
    driverPhone: '01811223301',
    vehicleType: 'EASYBIKE',
    vehicleModel: 'ভৈরব ইজিবাইক (টমটম) #১২',
    registrationNumber: 'ভৈরব-পৌর-ইজিবাইক-০১২৪',
    nidNumber: '1988481112233',
    unionCouncilorCert: 'ভৈরব পৌরসভা ওয়ার্ড নং ৪ প্রত্যয়নপত্র #৮৯২',
    brtaLicenseNo: '',
    kycStatus: 'APPROVED',
    rating: 4.9,
    lat: 24.0487,
    lng: 90.9852,
    currentLandmarkBangla: 'ভৈরব বাজার রেলওয়ে জংশন',
  );

  List<BhairabLandmark> _landmarks = BhairabLandmark.defaultLandmarks;
  BhairabLandmark _selectedLandmark = BhairabLandmark.defaultLandmarks.first;

  DriverWalletModel _wallet = DriverWalletModel(
    driverId: 'driver_demo_1',
    currentBalance: 193.0,
    isLockedOut: false,
    lastTopupAt: DateTime.now().subtract(const Duration(hours: 2)),
  );

  List<WalletTransactionModel> _transactions = [];

  IncomingRideOpportunity? _currentOpportunity;
  int _opportunityRemainingSeconds = 0;
  Timer? _countdownTimer;

  bool _hasSubmittedBid = false;
  double? _lastSubmittedBidAmount;
  int? _lastSubmittedEtaMinutes;

  ActiveDriverTrip? _activeTrip;
  String? _lastCancelledRideId;
  CompletedRideSummary? _lastCompletedSummary;
  bool _lastWalletWasLive = false;

  DriverSocketService({
    required this.apiService,
    required this.voiceService,
    this.serverUrl = kApiUrl,
  }) {
    _initialize();
  }

  // Getters
  bool get isSocketConnected => _isSocketConnected;
  bool get isOnline => _isOnline;

  /// Last server or bid error (Bangla text from the backend); the UI shows its own wording.
  String? get lastErrorBangla => _lastErrorBangla;
  DriverProfileModel get profile => _profile;
  List<BhairabLandmark> get landmarks => _landmarks;
  BhairabLandmark get selectedLandmark => _selectedLandmark;
  DriverWalletModel get wallet => _wallet;
  List<WalletTransactionModel> get transactions =>
      List.unmodifiable(_transactions);
  IncomingRideOpportunity? get currentOpportunity => _currentOpportunity;
  int get opportunityRemainingSeconds => _opportunityRemainingSeconds;
  bool get hasSubmittedBid => _hasSubmittedBid;
  double? get lastSubmittedBidAmount => _lastSubmittedBidAmount;
  int? get lastSubmittedEtaMinutes => _lastSubmittedEtaMinutes;
  ActiveDriverTrip? get activeTrip => _activeTrip;

  /// Set when the passenger cancels the trip in progress; the UI shows a message once.
  String? get lastCancelledRideId => _lastCancelledRideId;

  /// False when the wallet shown is the offline demo fallback.
  bool get walletIsLive => _lastWalletWasLive;

  Future<void> _initialize() async {
    await Future.wait([
      refreshLandmarks(),
      refreshWallet(),
    ]);
    connectSocket();
  }

  Future<void> refreshLandmarks() async {
    final loaded = await apiService.fetchBhairabLandmarks();
    if (loaded.isNotEmpty) {
      _landmarks = loaded;
      _selectedLandmark = _landmarks.firstWhere(
        (l) => l.banglaName == _profile.currentLandmarkBangla,
        orElse: () => _landmarks.first,
      );
      notifyListeners();
    }
  }

  Future<void> refreshWallet() async {
    final result = await apiService.fetchDriverWallet(
      _profile.driverId,
      fallbackBalance: _wallet.currentBalance,
    );
    _wallet = result.wallet;
    _transactions = result.transactions;
    _lastWalletWasLive = result.isLiveBackend;
    notifyListeners();
  }

  void connectSocket() {
    try {
      _socket?.dispose();
      final socket = io.io(
        serverUrl,
        io.OptionBuilder()
            .setTransports(['websocket', 'polling'])
            .enableAutoConnect()
            .enableReconnection()
            .build(),
      );

      socket.onConnect((_) {
        _isSocketConnected = true;
        _lastErrorBangla = null;
        if (_isOnline) {
          emitGoOnline();
        }
        notifyListeners();
      });

      socket.onDisconnect((_) {
        _isSocketConnected = false;
        notifyListeners();
      });

      socket.onConnectError((_) {
        _isSocketConnected = false;
        notifyListeners();
      });

      socket.on('driver:ride_opportunity', (data) {
        if (!_isOnline || _activeTrip != null) return;
        if (data is Map) {
          final opp = IncomingRideOpportunity.fromJson(Map<String, dynamic>.from(data));
          _handleNewOpportunity(opp, speakAloud: true);
        }
      });

      socket.on('driver:bid_submitted', (data) {
        _hasSubmittedBid = true;
        notifyListeners();
      });

      socket.on('driver:bid_won', (data) {
        if (data is Map) {
          _handleBidWon(ActiveDriverTrip.fromJson(Map<String, dynamic>.from(data)));
        }
      });

      // The passenger cancelled: close the request or the trip it belongs to.
      socket.on('driver:ride_cancelled', (data) {
        final rideId = data is Map ? data['rideId']?.toString() : null;
        if (rideId == null) return;
        if (_activeTrip?.rideId == rideId) {
          _activeTrip = null;
          _lastCancelledRideId = rideId;
        }
        if (_currentOpportunity?.rideId == rideId) {
          _countdownTimer?.cancel();
          _currentOpportunity = null;
          _hasSubmittedBid = false;
        }
        notifyListeners();
      });

      socket.on('driver:ride_summary', (data) {
        if (data is Map) {
          _handleRideSummary(CompletedRideSummary.fromJson(Map<String, dynamic>.from(data)));
        }
      });

      socket.on('driver:error', (data) {
        if (data is Map) {
          final message = (data['message'] ?? 'সার্ভার ত্রুটি ঘটেছে').toString();
          _lastErrorBangla = message;
          if (message.contains('৫০') || message.contains('ব্যালেন্স')) {
            voiceService.speakLowBalanceWarning(message);
          }
          notifyListeners();
        }
      });

      _socket = socket;
    } catch (_) {
      _isSocketConnected = false;
      notifyListeners();
    }
  }

  void toggleOnlineStatus(bool value) {
    _isOnline = value;
    if (_isOnline) {
      emitGoOnline();
    } else {
      _socket?.emit('driver:go_offline', {'driverId': _profile.driverId});
      dismissOpportunity();
    }
    notifyListeners();
  }

  /// Tells the passenger the driver is at the pickup.
  void markArrived() => _emitTripStep('driver:arrived');

  /// Tells the passenger the trip has started.
  void startTrip() => _emitTripStep('driver:start_trip');

  void _emitTripStep(String event) {
    final trip = _activeTrip;
    if (trip == null || _socket == null || !_isSocketConnected) return;
    _socket!.emit(event, {'rideId': trip.rideId, 'driverId': _profile.driverId});
  }

  void emitGoOnline() {
    if (_socket != null && _isSocketConnected) {
      _socket!.emit('driver:go_online', {
        'driverId': _profile.driverId,
        'driverName': _profile.driverName,
        'driverPhone': _profile.driverPhone,
        'vehicleType': _profile.vehicleType,
        'vehicleModel': _profile.vehicleModel,
        'lat': _profile.lat,
        'lng': _profile.lng,
        'walletBalance': _wallet.currentBalance,
        'rating': _profile.rating,
      });
    }
  }

  void selectBhairabLandmark(BhairabLandmark landmark) {
    _selectedLandmark = landmark;
    _profile = _profile.copyWith(
      lat: landmark.latitude,
      lng: landmark.longitude,
      currentLandmarkBangla: landmark.banglaName,
    );
    emitUpdateLocation();
    notifyListeners();
  }

  /// Sends the driver's position. During a trip the backend relays it to the passenger, whose app
  /// then shows "On your trip", so only call it once the trip has started.
  /// shortcut: position is the chosen stand plus a small jitter (no GPS yet); add geolocator for real tracking.
  void emitUpdateLocation() {
    final jitter = DateTime.now().second.isEven ? 1 : -1;
    _profile = _profile.copyWith(
      lat: double.parse((_selectedLandmark.latitude + jitter * 0.0004).toStringAsFixed(5)),
      lng: double.parse((_selectedLandmark.longitude + jitter * 0.0005).toStringAsFixed(5)),
    );

    if (_socket != null && _isSocketConnected) {
      _socket!.emit('driver:update_location', {
        'driverId': _profile.driverId,
        'lat': _profile.lat,
        'lng': _profile.lng,
        if (_activeTrip != null) 'activeRideId': _activeTrip!.rideId,
      });
    }
    notifyListeners();
  }

  void _handleNewOpportunity(
    IncomingRideOpportunity opportunity, {
    bool speakAloud = true,
  }) {
    _countdownTimer?.cancel();
    _currentOpportunity = opportunity;
    _opportunityRemainingSeconds = opportunity.expiresInSeconds;
    _hasSubmittedBid = false;
    _lastSubmittedBidAmount = null;
    _lastSubmittedEtaMinutes = null;
    _lastErrorBangla = null;

    if (speakAloud) {
      voiceService.speakRideOpportunity(opportunity.audioPromptBangla);
    }

    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_opportunityRemainingSeconds <= 1) {
        timer.cancel();
        _opportunityRemainingSeconds = 0;
        // Unanswered requests close themselves; a sent offer stays visible until the passenger decides.
        if (!_hasSubmittedBid) _currentOpportunity = null;
      } else {
        _opportunityRemainingSeconds--;
      }
      notifyListeners();
    });

    notifyListeners();
  }

  /// Closes the current request on this phone (the backend has no "ignore" event).
  void dismissOpportunity() {
    _countdownTimer?.cancel();
    _currentOpportunity = null;
    _hasSubmittedBid = false;
    notifyListeners();
  }

  /// Demo: a request as if a passenger near the railway junction had booked.
  void simulateIncomingOpportunity({bool speakAloud = true}) {
    final opp = IncomingRideOpportunity(
      rideId: 'ride_bhairab_${DateTime.now().millisecondsSinceEpoch}',
      passengerName: 'আব্দুল করিম (Karim)',
      pickupAddress: 'ভৈরব বাজার রেলওয়ে জংশন',
      pickupLat: 24.0487,
      pickupLng: 90.9852,
      dropoffAddress: 'সৈয়দ নজরুল ইসলাম সেতু (মেঘনা ব্রিজ গোলচত্বর)',
      dropoffLat: 24.0418,
      dropoffLng: 91.0022,
      initialOfferFare: 80.0,
      audioPromptBangla:
          'নতুন ট্রিপ রিকোয়েস্ট: ভৈরব বাজার রেলওয়ে জংশন থেকে মেঘনা ব্রিজ, প্রস্তাবিত ভাড়া ৮০ টাকা',
      expiresInSeconds: 60,
      receivedAt: DateTime.now(),
    );
    _handleNewOpportunity(opp, speakAloud: speakAloud);
  }

  void submitBid({
    required double bidAmount,
    required int etaMinutes,
  }) {
    final opp = _currentOpportunity;
    if (opp == null) return;

    if (_wallet.isLockedOut) {
      // Kept even though the UI disables bidding: the voice warning, and the server's own check.
      _lastErrorBangla =
          'কম ব্যালেন্স! বিড করতে নূন্যতম ৫০ টাকা ওয়ালেট ব্যালেন্স প্রয়োজন। বিকাশ রিচার্জ করুন।';
      voiceService.speakLowBalanceWarning();
      if (_socket != null && _isSocketConnected) {
        _socket!.emit('driver:submit_bid', {
          'rideId': opp.rideId,
          'driverId': _profile.driverId,
          'bidAmount': bidAmount,
          'etaMinutes': etaMinutes,
        });
      }
      notifyListeners();
      return;
    }

    _lastErrorBangla = null;
    _hasSubmittedBid = true;
    _lastSubmittedBidAmount = bidAmount;
    _lastSubmittedEtaMinutes = etaMinutes;

    if (_socket != null && _isSocketConnected) {
      _socket!.emit('driver:submit_bid', {
        'rideId': opp.rideId,
        'driverId': _profile.driverId,
        'bidAmount': bidAmount,
        'etaMinutes': etaMinutes,
      });
    }
    notifyListeners();
  }

  /// Demo: the passenger accepts this driver's offer.
  void simulatePassengerAcceptsBid() {
    final opp = _currentOpportunity;
    final agreed = _lastSubmittedBidAmount ?? opp?.initialOfferFare ?? 80.0;
    final trip = ActiveDriverTrip(
      rideId: opp?.rideId ?? 'ride_bhairab_active',
      passengerName: opp?.passengerName ?? 'আব্দুল করিম (Karim)',
      passengerPhone: '01700000001',
      pickupAddress: opp?.pickupAddress ?? 'ভৈরব বাজার রেলওয়ে জংশন',
      pickupLat: opp?.pickupLat ?? 24.0487,
      pickupLng: opp?.pickupLng ?? 90.9852,
      dropoffAddress: opp?.dropoffAddress ?? 'সৈয়দ নজরুল ইসলাম সেতু (মেঘনা ব্রিজ)',
      dropoffLat: opp?.dropoffLat,
      dropoffLng: opp?.dropoffLng,
      agreedFare: agreed,
      messageBangla: 'রাইড কনফার্ম হয়েছে! যাত্রীর কাছে রওয়ানা হন।',
      startedAt: DateTime.now(),
    );
    _handleBidWon(trip);
  }

  void _handleBidWon(ActiveDriverTrip trip) {
    _countdownTimer?.cancel();
    _currentOpportunity = null;
    _hasSubmittedBid = false;
    _activeTrip = trip;
    voiceService.speakRideConfirmed(trip.messageBangla);
    notifyListeners();
  }

  Future<CompletedRideSummary?> completeActiveRide() async {
    final trip = _activeTrip;
    if (trip == null) return null;

    if (_socket != null && _isSocketConnected) {
      _socket!.emit('driver:complete_ride', {
        'rideId': trip.rideId,
        'driverId': _profile.driverId,
      });
    }

    final commission = (trip.agreedFare * DriverWalletModel.platformCommissionRate)
        .roundToDouble();
    final summary = CompletedRideSummary(
      rideId: trip.rideId,
      cashCollected: trip.agreedFare,
      commissionDeductedBdt: commission,
      messageBangla:
          'নগদ গ্রহণ করুন: ${trip.agreedFare.toStringAsFixed(0)} টাকা (৮% কমিশন কর্তন: ${commission.toStringAsFixed(0)} টাকা)',
      completedAt: DateTime.now(),
    );

    _handleRideSummary(summary);
    return summary;
  }

  void _handleRideSummary(CompletedRideSummary summary) {
    // Avoid double-deducting if summary already processed for the same rideId
    if (_lastCompletedSummary?.rideId == summary.rideId) {
      return;
    }

    _lastCompletedSummary = summary;
    _activeTrip = null;

    final nextBalance = double.parse(
      (_wallet.currentBalance - summary.commissionDeductedBdt)
          .toStringAsFixed(2),
    );
    _wallet = _wallet.copyWith(currentBalance: nextBalance);

    _transactions.insert(
      0,
      WalletTransactionModel(
        id: 'tx_comm_${DateTime.now().millisecondsSinceEpoch}',
        type: 'COMMISSION_DEDUCTION',
        amount: -summary.commissionDeductedBdt,
        balanceAfter: nextBalance,
        referenceRideId: summary.rideId,
        noteBangla:
            'ট্রিপ কমিশন কর্তন (৮%): ${summary.commissionDeductedBdt.toStringAsFixed(0)} টাকা (ভাড়া ${summary.cashCollected.toStringAsFixed(0)} টাকা)',
        createdAt: DateTime.now(),
      ),
    );

    voiceService.speakSystemMessage(summary.messageBangla);
    notifyListeners();
  }

  /// Legacy top-up used by the Nagad demo path.
  /// shortcut: POST /wallet/topup/bkash needs the admin key, so outside demo mode this only
  /// credits locally; keep Nagad demo-only until a driver-facing Nagad API exists.
  Future<WalletTransactionModel> topupWallet({
    required double amountBdt,
    String method = 'BKASH',
  }) async {
    final tx = await apiService.topupWallet(
      driverId: _profile.driverId,
      amountBdt: amountBdt,
      method: method,
      currentBalance: _wallet.currentBalance,
    );

    _wallet = _wallet.copyWith(
      currentBalance: tx.balanceAfter,
      lastTopupAt: DateTime.now(),
    );
    _transactions.insert(0, tx);
    if (!_wallet.isLockedOut) _lastErrorBangla = null;

    // Re-sync online driver wallet balance with backend socket
    if (_isOnline) emitGoOnline();

    voiceService.speakSystemMessage(tx.noteBangla);
    notifyListeners();
    return tx;
  }

  /// Step 1 of bKash Tokenized Checkout: Create PaymentID (`POST /payments/bkash/create`)
  Future<BkashCreatePaymentResult> createBkashTokenizedPayment(
    double amountBdt,
  ) {
    return apiService.createBkashTokenizedPayment(_profile.driverId, amountBdt);
  }

  /// Step 2 of bKash Tokenized Checkout: Execute Payment & Credit Ledger (`POST /payments/bkash/execute`)
  Future<BkashExecutePaymentResult> executeBkashTokenizedPayment({
    required String paymentID,
    required double amountBdt,
    String msisdn = '01811223304',
  }) async {
    final result = await apiService.executeBkashTokenizedPayment(
      paymentID,
      status: 'success',
      msisdn: msisdn,
      fallbackAmountBdt: amountBdt,
      currentBalance: _wallet.currentBalance,
    );

    _wallet = _wallet.copyWith(
      currentBalance: result.newBalance,
      lastTopupAt: DateTime.now(),
    );
    _transactions.insert(0, result.transaction);
    if (!_wallet.isLockedOut) _lastErrorBangla = null;

    if (_isOnline) emitGoOnline();

    voiceService.speakSystemMessage(result.transaction.noteBangla);
    notifyListeners();
    return result;
  }

  /// Demo: switch between the funded driver (৳193) and a low-balance driver (৳35).
  Future<void> toggleLowBalanceDemoMode() async {
    if (_wallet.currentBalance >= DriverWalletModel.minimumBidBalanceBdt) {
      _profile = _profile.copyWith(
        driverId: 'driver_demo_4',
        driverName: 'আনোয়ার মিয়া',
        driverPhone: '01611223304',
        vehicleType: 'EASYBIKE',
        vehicleModel: 'বোরাক ইজিবাইক ভৈরব #০৮',
      );
      _wallet = _wallet.copyWith(driverId: 'driver_demo_4', currentBalance: 35.0);
      voiceService.speakLowBalanceWarning();
    } else {
      _profile = _profile.copyWith(
        driverId: 'driver_demo_1',
        driverName: 'মোঃ রফিকুল ইসলাম',
        driverPhone: '01811223301',
        vehicleType: 'EASYBIKE',
        vehicleModel: 'ভৈরব ইজিবাইক (টমটম) #১২',
      );
      _wallet = _wallet.copyWith(driverId: 'driver_demo_1', currentBalance: 193.0);
      _lastErrorBangla = null;
    }
    if (_isOnline) emitGoOnline();
    notifyListeners();
  }

  Future<KycSubmissionResult> submitKycApplication({
    required String driverName,
    required String driverPhone,
    required String vehicleType,
    required String vehicleModel,
    required String registrationNumber,
    required String nidNumber,
    String? brtaLicenseNo,
    String? unionCouncilorCert,
  }) async {
    final result = await apiService.submitDriverKyc(
      driverId: _profile.driverId,
      nidNumber: nidNumber,
      vehicleType: vehicleType,
      vehicleModel: vehicleModel,
      brtaLicenseNo: brtaLicenseNo,
      unionCouncilorCertUrl: unionCouncilorCert,
    );

    _profile = _profile.copyWith(
      driverName: driverName,
      driverPhone: driverPhone,
      vehicleType: vehicleType,
      vehicleModel: vehicleModel,
      registrationNumber: registrationNumber,
      nidNumber: nidNumber,
      brtaLicenseNo: brtaLicenseNo,
      unionCouncilorCert: unionCouncilorCert,
      kycStatus: result.status,
    );

    if (_isOnline) emitGoOnline();
    voiceService.speakSystemMessage(result.messageBangla);
    notifyListeners();
    return result;
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _socket?.dispose();
    super.dispose();
  }
}
