import 'package:cholo_ui/cholo_ui.dart';
import 'package:flutter/services.dart';
import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../l10n/app_localizations.dart';
import '../../models/passenger_models.dart';
import '../../services/passenger_api_service.dart';
import 'otp_screen.dart';
import 'sign_in_flow.dart';

/// Step 1 of sign-in: the mobile number.
class PhoneScreen extends StatefulWidget {
  const PhoneScreen({super.key});

  @override
  State<PhoneScreen> createState() => _PhoneScreenState();
}

class _PhoneScreenState extends State<PhoneScreen> {
  final _controller = TextEditingController(text: kDemoMode ? '01700000001' : '');
  bool _showError = false;
  bool _loading = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final l = AppLocalizations.of(context);
    final local = normalizeBdPhone(_controller.text);
    if (!isValidBdPhone(local)) {
      setState(() => _showError = true);
      return;
    }
    setState(() => _loading = true);
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    try {
      final result = await context.read<PassengerApiService>().requestOtp(local);
      navigator.push(
        MaterialPageRoute<void>(
          builder: (_) => OtpScreen(phone: local, demoOtp: result['demoOtp']?.toString()),
        ),
      );
    } catch (_) {
      messenger.showSnackBar(SnackBar(content: Text(l.commonServerError)));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(CbSpace.gutter, CbSpace.xxl, CbSpace.gutter, CbSpace.xl),
          children: [
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: CbColors.brand,
                    borderRadius: BorderRadius.circular(CbRadius.control),
                  ),
                  child: const Icon(Icons.electric_rickshaw, color: CbColors.onBrand),
                ),
                const SizedBox(width: CbSpace.m),
                Text(l.appTitle, style: text.titleMedium?.copyWith(color: CbColors.brand)),
              ],
            ),
            const SizedBox(height: CbSpace.xxl),
            Text(l.phoneTitle, style: text.headlineSmall),
            const SizedBox(height: CbSpace.s),
            Text(l.phoneSubtitle, style: text.bodyMedium),
            const SizedBox(height: CbSpace.xl),
            TextField(
              controller: _controller,
              keyboardType: TextInputType.phone,
              autofillHints: const [AutofillHints.telephoneNumber],
              inputFormatters: [
                FilteringTextInputFormatter.allow(RegExp(r'[0-9+ \-]')),
                LengthLimitingTextInputFormatter(17),
              ],
              style: cbMoneyStyle(18, weight: FontWeight.w500),
              decoration: InputDecoration(
                labelText: l.phoneFieldLabel,
                hintText: '01XXX-XXXXXX',
                errorText: _showError ? l.phoneInvalid : null,
              ),
              onChanged: (_) {
                if (_showError) setState(() => _showError = false);
              },
              onSubmitted: (_) => _send(),
            ),
            const SizedBox(height: CbSpace.l),
            FilledButton(
              onPressed: _loading ? null : _send,
              child: _loading
                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5))
                  : Text(l.phoneSend),
            ),
            if (kDemoMode) ...[
              const SizedBox(height: CbSpace.s),
              TextButton(
                onPressed: _loading ? null : () => completeSignIn(context, PassengerSession.demo()),
                child: Text(l.phoneDemoSkip),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
