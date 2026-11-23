import 'dart:async';

import 'package:cholo_ui/cholo_ui.dart';
import 'package:flutter/services.dart';
import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../l10n/app_localizations.dart';
import '../../services/passenger_api_service.dart';
import 'name_screen.dart';
import 'sign_in_flow.dart';

enum _OtpError { none, wrong, server }

/// Step 2 of sign-in: the 6-digit code. Submits by itself on the 6th digit.
class OtpScreen extends StatefulWidget {
  const OtpScreen({super.key, required this.phone, this.demoOtp});

  /// Local 11-digit number, e.g. 01700000001.
  final String phone;

  /// Only set when a development server (or offline demo) provides the code.
  final String? demoOtp;

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  static const _resendAfter = 30;

  late final _controller = TextEditingController(text: widget.demoOtp ?? '');
  final _focus = FocusNode();
  _OtpError _error = _OtpError.none;
  bool _loading = false;
  int _secondsLeft = _resendAfter;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startResendTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    _focus.dispose();
    super.dispose();
  }

  void _startResendTimer() {
    _timer?.cancel();
    setState(() => _secondsLeft = _resendAfter);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_secondsLeft <= 1) t.cancel();
      setState(() => _secondsLeft--);
    });
  }

  Future<void> _resend() async {
    final api = context.read<PassengerApiService>();
    final messenger = ScaffoldMessenger.of(context);
    final l = AppLocalizations.of(context);
    try {
      final result = await api.requestOtp(widget.phone);
      final code = result['demoOtp']?.toString();
      if (code != null && mounted) _controller.text = code;
      _startResendTimer();
    } catch (_) {
      messenger.showSnackBar(SnackBar(content: Text(l.commonServerError)));
    }
  }

  Future<void> _verify() async {
    final code = _controller.text;
    if (code.length != 6 || _loading) return;
    setState(() {
      _loading = true;
      _error = _OtpError.none;
    });
    try {
      final session = await context.read<PassengerApiService>().verifyOtp(widget.phone, code);
      if (!mounted) return;
      if (session == null) {
        setState(() => _error = _OtpError.wrong);
        _controller.clear();
        _focus.requestFocus();
      } else if (session.needsName) {
        Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => NameScreen(session: session)));
      } else {
        await completeSignIn(context, session);
      }
    } catch (_) {
      if (mounted) setState(() => _error = _OtpError.server);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(CbSpace.gutter, CbSpace.s, CbSpace.gutter, CbSpace.xl),
        children: [
          Text(l.otpTitle, style: text.headlineSmall),
          const SizedBox(height: CbSpace.s),
          Text(l.otpSentTo(fmtBdPhone(widget.phone)), style: text.bodyMedium),
          Align(
            alignment: AlignmentDirectional.centerStart,
            child: TextButton(
              style: TextButton.styleFrom(padding: EdgeInsets.zero),
              onPressed: () => Navigator.of(context).pop(),
              child: Text(l.otpChangeNumber),
            ),
          ),
          const SizedBox(height: CbSpace.l),
          _OtpBoxes(
            controller: _controller,
            focusNode: _focus,
            hasError: _error != _OtpError.none,
            onChanged: (value) {
              if (_error != _OtpError.none) setState(() => _error = _OtpError.none);
              if (value.length == 6) _verify();
            },
          ),
          if (_error != _OtpError.none)
            Padding(
              padding: const EdgeInsets.only(top: CbSpace.m),
              child: Text(
                _error == _OtpError.wrong ? l.otpWrong : l.commonServerError,
                textAlign: TextAlign.center,
                style: text.bodyMedium?.copyWith(color: CbColors.danger),
              ),
            ),
          const SizedBox(height: CbSpace.l),
          Center(
            child: _secondsLeft > 0
                ? Text(l.otpResendIn(fmtCountdown(_secondsLeft)), style: text.bodyMedium)
                : TextButton(onPressed: _resend, child: Text(l.otpResend)),
          ),
          const SizedBox(height: CbSpace.xl),
          ValueListenableBuilder(
            valueListenable: _controller,
            builder: (context, value, _) => FilledButton(
              onPressed: value.text.length == 6 && !_loading ? _verify : null,
              child: _loading
                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5))
                  : Text(l.otpVerify),
            ),
          ),
        ],
      ),
    );
  }
}

/// Six boxes drawn over one invisible text field (keeps paste, SMS autofill and screen readers working).
class _OtpBoxes extends StatelessWidget {
  const _OtpBoxes({
    required this.controller,
    required this.focusNode,
    required this.hasError,
    required this.onChanged,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final bool hasError;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: focusNode.requestFocus,
      child: Stack(
        alignment: Alignment.center,
        children: [
          ExcludeSemantics(
            child: ListenableBuilder(
              listenable: Listenable.merge([controller, focusNode]),
              builder: (context, _) {
                final code = controller.text;
                return Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    for (var i = 0; i < 6; i++)
                      Padding(
                        padding: EdgeInsetsDirectional.only(start: i == 0 ? 0 : CbSpace.s),
                        child: _box(code, i, focusNode.hasFocus),
                      ),
                  ],
                );
              },
            ),
          ),
          Positioned.fill(
            child: Opacity(
              opacity: 0,
              child: TextField(
                controller: controller,
                focusNode: focusNode,
                autofocus: true,
                keyboardType: TextInputType.number,
                autofillHints: const [AutofillHints.oneTimeCode],
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(6),
                ],
                showCursor: false,
                enableInteractiveSelection: false,
                decoration: const InputDecoration(filled: false, border: InputBorder.none, counterText: ''),
                onChanged: onChanged,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _box(String code, int index, bool focused) {
    final isActive = focused && index == code.length.clamp(0, 5);
    final Color? borderColor = hasError ? CbColors.danger : (isActive ? CbColors.brand : null);
    return Container(
      width: 44,
      height: 56,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: CbColors.raised,
        borderRadius: BorderRadius.circular(CbRadius.control),
        border: borderColor == null ? null : Border.all(color: borderColor, width: 2),
      ),
      child: Text(index < code.length ? code[index] : '', style: cbMoneyStyle(24)),
    );
  }
}
