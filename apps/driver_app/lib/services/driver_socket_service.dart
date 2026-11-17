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
  bool _isOnline = true;
  String _statusBannerBangla =
      'আপনি অনলাইন আছেন। নতুন ট্রিপের জন্য অপেক্ষা করুন।';
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
  CompletedRideSummary? _lastCompletedSummary;
  int _gpsPingCount = 0;

  DriverSocketService({
    required this.apiService,
    required this.voiceService,
    this.serverUrl = 'http://localhost:4000',
  }) {
    _initialize();
  }

  // Getters
  bool get isSocketConnected => _isSocketConnected;
  bool get isOnline => _isOnline;
  String get statusBannerBangla => _statusBannerBangla;
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
  CompletedRideSummary? get lastCompletedSummary => _lastCompletedSummary;
  int get gpsPingCount => _gpsPingCount;

  Future<void> _initialize() async {
    await Future.wait([
      refreshLandmarks(),
      refreshWallet(),
    ]);
    connectSocket();
    // Seed an initial incoming ride opportunity if none arrives within 1.5s so the UI is immediately interactive
    Future.delayed(const Duration(milliseconds: 900), () {
      if (_currentOpportunity == null && _activeTrip == null && _isOnline) {
        simulateIncomingOpportunity(speakAloud: false);
      }
    });
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
    if (_wallet.isLockedOut) {
      _lastErrorBangla =
          '🔒 আপনার ব্যালেন্স ৫০ টাকার নিচে! বিড করতে বিকাশ রিচার্জ করুন';
    }
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

      socket.on('driver:online_confirmed', (data) {
        if (data is Map) {
          final msg = data['messageBangla']?.toString();
          if (msg != null && msg.isNotEmpty) {
            _statusBannerBangla = msg;
            notifyListeners();
          }
        }
      });

      socket.on('driver:ride_opportunity', (data) {
        if (!_isOnline) return;
        if (data is Map) {
          final mapData = Map<String, dynamic>.from(data);
          final opp = IncomingRideOpportunity.fromJson(mapData);
          _handleNewOpportunity(opp, speakAloud: true);
        }
      });

      socket.on('driver:bid_submitted', (data) {
        _hasSubmittedBid = true;
        _statusBannerBangla =
            'আপনার বিড (৳${(_lastSubmittedBidAmount ?? 80).toStringAsFixed(0)}) যাত্রীর কাছে পাঠানো হয়েছে...';
        notifyListeners();
      });

      socket.on('driver:bid_won', (data) {
        if (data is Map) {
          final mapData = Map<String, dynamic>.from(data);
          final trip = ActiveDriverTrip.fromJson(mapData);
          _handleBidWon(trip);
        }
      });

      socket.on('driver:ride_summary', (data) {
        if (data is Map) {
          final mapData = Map<String, dynamic>.from(data);
          final summary = CompletedRideSummary.fromJson(mapData);
          _handleRideSummary(summary);
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
      _statusBannerBangla =
          'আপনি অনলাইন আছেন। নতুন ট্রিপের জন্য অপেক্ষা করুন।';
      emitGoOnline();
    } else {
      _statusBannerBangla =
          'আপনি এখন অফলাইন আছেন। নতুন ট্রিপ পেতে অনলাইনে যান।';
      _countdownTimer?.cancel();
      _currentOpportunity = null;
    }
    notifyListeners();
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

  void emitUpdateLocation({double? customLat, double? customLng}) {
    final jitterLat = customLat ??
        (_profile.lat + ((_gpsPingCount % 2 == 0 ? 1 : -1) * 0.0004));
    final jitterLng = customLng ??
        (_profile.lng + ((_gpsPingCount % 2 == 0 ? 1 : -1) * 0.0005));
    _gpsPingCount++;

    _profile = _profile.copyWith(
      lat: double.parse(jitterLat.toStringAsFixed(5)),
      lng: double.parse(jitterLng.toStringAsFixed(5)),
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
        notifyListeners();
      } else {
        _opportunityRemainingSeconds--;
        notifyListeners();
      }
    });

    notifyListeners();
  }

  void simulateIncomingOpportunity({bool speakAloud = true}) {
    final opp = IncomingRideOpportunity(
      rideId: 'ride_bhairab_${DateTime.now().millisecondsSinceEpoch}',
      passengerName: 'আব্দুল করিম (Karim)',
      pickupAddress: 'ভৈরব বাজার রেলওয়ে জংশন',
      pickupLat: 24.0487,
      pickupLng: 90.9852,
      dropoffAddress: 'সৈয়দ নজরুল ইসলাম সেতু (মেঘনা ব্রিজ গোলচত্বর)',
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
      _lastErrorBangla =
          '🔒 কম ব্যালেন্স! বিড করতে নূন্যতম ৫০ টাকা ওয়ালেট ব্যালেন্স প্রয়োজন। বিকাশ রিচার্জ করুন।';
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
    _statusBannerBangla =
        'বিড পাঠানো হয়েছে: ৳${bidAmount.toStringAsFixed(0)} (সম্ভাব্য সময়: $etaMinutes মিনিট)';

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

  /// Allows instant testing of bid win when passenger accepts or in standalone demo mode
  void simulatePassengerAcceptsBid() {
    final opp = _currentOpportunity;
    final agreed =
        _lastSubmittedBidAmount ?? opp?.initialOfferFare ?? 80.0;
    final trip = ActiveDriverTrip(
      rideId: opp?.rideId ?? 'ride_bhairab_active',
      passengerName: opp?.passengerName ?? 'আব্দুল করিম (Karim)',
      passengerPhone: '01700000001',
      pickupAddress: opp?.pickupAddress ?? 'ভৈরব বাজার রেলওয়ে জংশন',
      pickupLat: opp?.pickupLat ?? 24.0487,
      pickupLng: opp?.pickupLng ?? 90.9852,
      dropoffAddress:
          opp?.dropoffAddress ?? 'সৈয়দ নজরুল ইসলাম সেতু (মেঘনা ব্রিজ)',
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
    _statusBannerBangla = trip.messageBangla;
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

    _statusBannerBangla = summary.messageBangla;
    voiceService.speakSystemMessage(summary.messageBangla);

    if (_wallet.isLockedOut) {
      _lastErrorBangla =
          '🔒 আপনার ব্যালেন্স ৫০ টাকার নিচে! পরবর্তী বিড করতে বিকাশ রিচার্জ করুন';
    }

    notifyListeners();
  }

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

    if (!_wallet.isLockedOut) {
      _lastErrorBangla = null;
    }

    // Re-sync online driver wallet balance with backend socket
    if (_isOnline) {
      emitGoOnline();
    }

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

  /// Step 3 of bKash Tokenized Checkout: Execute Payment & Credit Ledger (`POST /payments/bkash/execute`)
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

    if (!_wallet.isLockedOut) {
      _lastErrorBangla = null;
    }

    if (_isOnline) {
      emitGoOnline();
    }

    voiceService.speakSystemMessage(result.transaction.noteBangla);
    notifyListeners();
    return result;
  }

  /// Switch between standard funded profile (193 BDT) and low-balance demo (35 BDT)
  Future<void> toggleLowBalanceDemoMode() async {
    if (_wallet.currentBalance >= 50.0) {
      _profile = _profile.copyWith(
        driverId: 'driver_demo_4',
        driverName: 'আনোয়ার মিয়া (Low Balance Demo)',
        driverPhone: '01611223304',
        vehicleType: 'EASYBIKE',
        vehicleModel: 'বোরাক ইজিবাইক ভৈরব #০৮',
      );
      _wallet = _wallet.copyWith(
        driverId: 'driver_demo_4',
        currentBalance: 35.0,
      );
      _lastErrorBangla =
          '🔒 আপনার ব্যালেন্স ৫০ টাকার নিচে! বিড করতে বিকাশ রিচার্জ করুন';
      voiceService.speakLowBalanceWarning();
    } else {
      _profile = _profile.copyWith(
        driverId: 'driver_demo_1',
        driverName: 'মোঃ রফিকুল ইসলাম',
        driverPhone: '01811223301',
        vehicleType: 'EASYBIKE',
        vehicleModel: 'ভৈরব ইজিবাইক (টমটম) #১২',
      );
      _wallet = _wallet.copyWith(
        driverId: 'driver_demo_1',
        currentBalance: 193.0,
      );
      _lastErrorBangla = null;
    }
    if (_isOnline) {
      emitGoOnline();
    }
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

    if (_isOnline) {
      emitGoOnline();
    }
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
