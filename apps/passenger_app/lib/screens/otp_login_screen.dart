import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/passenger_models.dart';
import '../services/passenger_socket_service.dart';
import 'passenger_home_screen.dart';

/// Bangladeshi `+880 1XXX-XXXXXX` phone authentication & 6-digit OTP verification screen.
/// Features 1-tap demo passenger prefill (`01700000001` — আব্দুল করিম) and `123456` OTP verification.
class OtpLoginScreen extends StatefulWidget {
  const OtpLoginScreen({super.key});

  @override
  State<OtpLoginScreen> createState() => _OtpLoginScreenState();
}

class _OtpLoginScreenState extends State<OtpLoginScreen> {
  final TextEditingController _phoneController =
      TextEditingController(text: '01700000001');
  final TextEditingController _nameController =
      TextEditingController(text: 'আব্দুল করিম (Karim)');
  final TextEditingController _otpController =
      TextEditingController(text: '123456');

  bool _otpRequested = false;
  bool _isLoading = false;
  String? _feedbackBangla;

  @override
  void dispose() {
    _phoneController.dispose();
    _nameController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  void _prefillDemoPassenger() {
    setState(() {
      _phoneController.text = '01700000001';
      _nameController.text = 'আব্দুল করিম (Karim)';
      _otpController.text = '123456';
      _feedbackBangla =
          '✓ ডেমো যাত্রী প্রোফাইল লোড হয়েছে: আব্দুল করিম (01700000001)';
    });
  }

  Future<void> _handleRequestOtp() async {
    final phone = _phoneController.text.trim();
    if (phone.length < 10) {
      setState(() {
        _feedbackBangla = 'অনুগ্রহ করে সঠিক বাংলাদেশী মোবাইল নাম্বার দিন (017XXXXXXXX)';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _feedbackBangla = null;
    });

    final socketService = context.read<PassengerSocketService>();
    final res = await socketService.apiService.requestOtp(phone);

    if (!mounted) return;
    setState(() {
      _isLoading = false;
      _otpRequested = true;
      _otpController.text = (res['demoOtp'] ?? '123456').toString();
      _feedbackBangla = (res['messageBangla'] ??
              '৬-সংখ্যার ভেরিফিকেশন কোড পাঠানো হয়েছে (ডেমো কোড: 123456)')
          .toString();
    });
  }

  Future<void> _handleVerifyOtp() async {
    final phone = _phoneController.text.trim();
    final otp = _otpController.text.trim();
    final fullName = _nameController.text.trim();

    if (otp.length < 4) {
      setState(() {
        _feedbackBangla = 'অনুগ্রহ করে ৬-সংখ্যার ওটিপি কোড প্রদান করুন (123456)';
      });
      return;
    }

    setState(() {
      _isLoading = true;
    });

    final socketService = context.read<PassengerSocketService>();
    final session = await socketService.apiService.verifyOtp(
      phone,
      otp,
      fullName.isEmpty ? 'আব্দুল করিম' : fullName,
    );

    socketService.updateSession(session);

    if (!mounted) return;
    setState(() {
      _isLoading = false;
    });

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => const PassengerHomeScreen(),
      ),
    );
  }

  void _instantDemoLogin() {
    final socketService = context.read<PassengerSocketService>();
    socketService.updateSession(PassengerSession.demo());
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => const PassengerHomeScreen(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final socketService = context.watch<PassengerSocketService>();

    return Scaffold(
      backgroundColor: const Color(0xFF0B131E),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 460),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Brand Hero Header
                  Container(
                    padding: const EdgeInsets.all(22),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF006A4E), Color(0xFF044E3A)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(22),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF006A4E).withOpacity(0.35),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.15),
                                shape: BoxShape.circle,
                              ),
                              child: const Text(
                                '🛺',
                                style: TextStyle(fontSize: 28),
                              ),
                            ),
                            const SizedBox(width: 12),
                            const Flexible(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'চলো ভৈরব • CholoBhairab',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 22,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  SizedBox(height: 2),
                                  Text(
                                    'ভৈরবের নিজস্ব ইনড্রাইভ ভাড়া দরকষাকষি অ্যাপ',
                                    style: TextStyle(
                                      color: Colors.white70,
                                      fontSize: 13,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.25),
                            borderRadius: BorderRadius.circular(30),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.circle,
                                size: 9,
                                color: socketService.isConnected
                                    ? const Color(0xFF34D399)
                                    : const Color(0xFFF59E0B),
                              ),
                              const SizedBox(width: 6),
                              Flexible(
                                child: Text(
                                  socketService.isConnected
                                      ? 'সার্ভার সংযুক্ত (${socketService.apiService.baseUrl})'
                                      : 'অফলাইন ডেমো সিমুলেটর প্রস্তুত (${socketService.apiService.baseUrl})',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 11.5,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Main Login Card
                  Container(
                    padding: const EdgeInsets.all(22),
                    decoration: BoxDecoration(
                      color: const Color(0xFF111C2D),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: const Color(0xFF1E293B),
                        width: 1.2,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'যাত্রী লগইন / নিবন্ধন',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            TextButton.icon(
                              onPressed: _prefillDemoPassenger,
                              icon: const Icon(
                                Icons.bolt,
                                color: Color(0xFFF59E0B),
                                size: 18,
                              ),
                              label: const Text(
                                'ডেমো প্রি-ফিল',
                                style: TextStyle(
                                  color: Color(0xFFF59E0B),
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'আপনার মোবাইল নাম্বার দিয়ে ওটিপি (OTP) ভেরিফাই করুন',
                          style: TextStyle(
                            color: Color(0xFF94A3B8),
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(height: 18),

                        // Full Name Field
                        const Text(
                          'যাত্রীর নাম (Full Name)',
                          style: TextStyle(
                            color: Color(0xFFCBD5E1),
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 6),
                        TextField(
                          controller: _nameController,
                          style: const TextStyle(color: Colors.white),
                          decoration: InputDecoration(
                            prefixIcon: const Icon(
                              Icons.person_outline,
                              color: Color(0xFF34D399),
                            ),
                            hintText: 'আব্দুল করিম (Karim)',
                            hintStyle:
                                const TextStyle(color: Color(0xFF64748B)),
                            filled: true,
                            fillColor: const Color(0xFF0B131E),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide:
                                  const BorderSide(color: Color(0xFF334155)),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide:
                                  const BorderSide(color: Color(0xFF334155)),
                            ),
                          ),
                        ),
                        const SizedBox(height: 14),

                        // Bangladeshi Phone Input
                        const Text(
                          'মোবাইল নাম্বার (+880 1XXX-XXXXXX)',
                          style: TextStyle(
                            color: Color(0xFFCBD5E1),
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 6),
                        TextField(
                          controller: _phoneController,
                          keyboardType: TextInputType.phone,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.6,
                          ),
                          decoration: InputDecoration(
                            prefixIcon: Container(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 12),
                              alignment: Alignment.centerLeft,
                              width: 84,
                              child: const Text(
                                '🇧🇩 +880',
                                style: TextStyle(
                                  color: Color(0xFF34D399),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13.5,
                                ),
                              ),
                            ),
                            hintText: '01700000001',
                            hintStyle:
                                const TextStyle(color: Color(0xFF64748B)),
                            filled: true,
                            fillColor: const Color(0xFF0B131E),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide:
                                  const BorderSide(color: Color(0xFF334155)),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide:
                                  const BorderSide(color: Color(0xFF334155)),
                            ),
                          ),
                        ),

                        if (_otpRequested) ...[
                          const SizedBox(height: 16),
                          const Text(
                            '৬-সংখ্যার ওটিপি কোড (OTP: 123456)',
                            style: TextStyle(
                              color: Color(0xFFF59E0B),
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 6),
                          TextField(
                            controller: _otpController,
                            keyboardType: TextInputType.number,
                            maxLength: 6,
                            style: const TextStyle(
                              color: Color(0xFFF59E0B),
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 8,
                            ),
                            decoration: InputDecoration(
                              counterText: '',
                              prefixIcon: const Icon(
                                Icons.lock_clock_outlined,
                                color: Color(0xFFF59E0B),
                              ),
                              hintText: '123456',
                              filled: true,
                              fillColor: const Color(0xFF0B131E),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide:
                                    const BorderSide(color: Color(0xFFF59E0B)),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide:
                                    const BorderSide(color: Color(0xFFF59E0B)),
                              ),
                            ),
                          ),
                        ],

                        if (_feedbackBangla != null) ...[
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: const Color(0xFF006A4E).withOpacity(0.2),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: const Color(0xFF006A4E),
                              ),
                            ),
                            child: Text(
                              _feedbackBangla!,
                              style: const TextStyle(
                                color: Color(0xFF6EE7B7),
                                fontSize: 12.5,
                              ),
                            ),
                          ),
                        ],

                        const SizedBox(height: 20),

                        // Primary Action Button
                        SizedBox(
                          height: 50,
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF006A4E),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                            onPressed: _isLoading
                                ? null
                                : (_otpRequested
                                    ? _handleVerifyOtp
                                    : _handleRequestOtp),
                            icon: _isLoading
                                ? const SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  )
                                : Icon(
                                    _otpRequested
                                        ? Icons.verified_user
                                        : Icons.sms_outlined,
                                  ),
                            label: Text(
                              _otpRequested
                                  ? '✓ ওটিপি যাচাই ও প্রবেশ করুন (Verify 123456)'
                                  : 'ওটিপি কোড পাঠান (Send OTP)',
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(height: 12),

                        // 1-Tap Quick Demo Entry Button
                        OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFFF59E0B),
                            side: const BorderSide(
                              color: Color(0xFFF59E0B),
                              width: 1.2,
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 13),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          onPressed: _instantDemoLogin,
                          icon: const Icon(Icons.flash_on, size: 18),
                          label: const Text(
                            '১-ট্যাপ ডেমো যাত্রী লগইন (01700000001 — আব্দুল করিম)',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 18),

                  // Bhairab Local Highlights Footer
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFF111C2D).withOpacity(0.7),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFF1E293B)),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _FeaturePill(icon: '🛺', label: 'ইজিবাইক ও সিএনজি'),
                        _FeaturePill(icon: '🤝', label: 'ভাড়া দরকষাকষি'),
                        _FeaturePill(icon: '🚨', label: '৯৯৯ ও এসওএস'),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _FeaturePill extends StatelessWidget {
  final String icon;
  final String label;

  const _FeaturePill({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(icon, style: const TextStyle(fontSize: 16)),
        const SizedBox(width: 5),
        Text(
          label,
          style: const TextStyle(
            color: Color(0xFF94A3B8),
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
