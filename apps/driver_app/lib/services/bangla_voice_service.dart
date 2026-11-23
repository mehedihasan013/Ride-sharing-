import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

class BanglaVoiceLogEntry {
  final String id;
  final String textBangla;
  final String category; // 'RIDE_OPPORTUNITY' | 'RIDE_CONFIRMED' | 'LOW_BALANCE' | 'SYSTEM'
  final DateTime timestamp;
  final bool wasMuted;

  const BanglaVoiceLogEntry({
    required this.id,
    required this.textBangla,
    required this.category,
    required this.timestamp,
    required this.wasMuted,
  });

  String get categoryTitleBangla {
    switch (category) {
      case 'RIDE_OPPORTUNITY':
        return 'নতুন ট্রিপ অফার ভয়েস';
      case 'RIDE_CONFIRMED':
        return 'রাইড কনফার্মেশন ভয়েস';
      case 'LOW_BALANCE':
        return 'ওয়ালেট সতর্কবার্তা';
      default:
        return 'সিস্টেম ভয়েস অ্যালার্ট';
    }
  }
}

class BanglaVoiceService extends ChangeNotifier {
  static const String sampleRidePromptBangla =
      'নতুন ট্রিপ রিকোয়েস্ট: ভৈরব বাজার রেলওয়ে জংশন থেকে মেঘনা ব্রিজ, প্রস্তাবিত ভাড়া ৮০ টাকা';
  static const String rideConfirmedPromptBangla =
      'রাইড কনফার্ম হয়েছে! যাত্রীর কাছে রওয়ানা হন।';
  static const String lowBalancePromptBangla =
      'আপনার ওয়ালেট ব্যালেন্স কম। ট্রিপ পেতে বিকাশ দিয়ে রিচার্জ করুন।';

  bool _isMuted = false;
  bool _isSpeaking = false;
  String? _activePromptBangla;
  Timer? _speechTimer;

  final List<BanglaVoiceLogEntry> _history = [
    BanglaVoiceLogEntry(
      id: 'voice_seed_1',
      textBangla:
          'চলো ভৈরব চালক অ্যাপে স্বাগতম। বাংলা ভয়েস অ্যালার্ট সক্রিয় আছে।',
      category: 'SYSTEM',
      timestamp: DateTime.now().subtract(const Duration(minutes: 10)),
      wasMuted: false,
    ),
    BanglaVoiceLogEntry(
      id: 'voice_seed_2',
      textBangla: sampleRidePromptBangla,
      category: 'RIDE_OPPORTUNITY',
      timestamp: DateTime.now().subtract(const Duration(minutes: 4)),
      wasMuted: false,
    ),
  ];

  bool get isMuted => _isMuted;
  bool get isSpeaking => _isSpeaking;
  String? get activePromptBangla => _activePromptBangla;
  List<BanglaVoiceLogEntry> get history => List.unmodifiable(_history);


  void toggleMute() {
    _isMuted = !_isMuted;
    if (_isMuted && _isSpeaking) {
      _stopActiveSpeech();
    }
    notifyListeners();
  }


  Future<void> speakRideOpportunity(String promptBangla) async {
    final text = promptBangla.trim().isEmpty
        ? sampleRidePromptBangla
        : promptBangla.trim();
    await _announce(text, category: 'RIDE_OPPORTUNITY');
  }

  Future<void> speakRideConfirmed([String? customText]) async {
    final text = (customText == null || customText.trim().isEmpty)
        ? rideConfirmedPromptBangla
        : customText.trim();
    await _announce(text, category: 'RIDE_CONFIRMED');
  }

  Future<void> speakLowBalanceWarning([String? customText]) async {
    final text = (customText == null || customText.trim().isEmpty)
        ? lowBalancePromptBangla
        : customText.trim();
    await _announce(text, category: 'LOW_BALANCE');
  }

  Future<void> speakSystemMessage(String textBangla) async {
    await _announce(textBangla, category: 'SYSTEM');
  }

  Future<void> replay(String textBangla, {String category = 'RIDE_OPPORTUNITY'}) async {
    await _announce(textBangla, category: category, recordInHistory: false);
  }

  void clearHistory() {
    _history.clear();
    notifyListeners();
  }

  Future<void> _announce(
    String textBangla, {
    required String category,
    bool recordInHistory = true,
  }) async {
    if (recordInHistory) {
      _history.insert(
        0,
        BanglaVoiceLogEntry(
          id: 'voice_${DateTime.now().millisecondsSinceEpoch}',
          textBangla: textBangla,
          category: category,
          timestamp: DateTime.now(),
          wasMuted: _isMuted,
        ),
      );
      if (_history.length > 30) {
        _history.removeLast();
      }
    }

    if (_isMuted) {
      notifyListeners();
      return;
    }

    _speechTimer?.cancel();

    _isSpeaking = true;
    _activePromptBangla = textBangla;
    notifyListeners();

    try {
      await SystemSound.play(SystemSoundType.alert);
      await HapticFeedback.mediumImpact();
    } catch (_) {
      // Ignore platform channel errors in headless or test environments.
    }


    final durationMs = (textBangla.length * 55).clamp(2600, 5200);
    _speechTimer = Timer(Duration(milliseconds: durationMs), () {
      _stopActiveSpeech();
    });
  }

  void _stopActiveSpeech() {
    _speechTimer?.cancel();
    _isSpeaking = false;
    _activePromptBangla = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _speechTimer?.cancel();
    super.dispose();
  }
}
