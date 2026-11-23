import 'package:cholo_ui/cholo_ui.dart';
import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../app_prefs.dart';
import '../l10n/app_localizations.dart';
import '../models/passenger_models.dart';
import '../services/passenger_api_service.dart';
import '../services/passenger_socket_service.dart';
import '../widgets/labels.dart';
import 'auth/phone_screen.dart';
import 'home/safety_sheet.dart';

/// Profile, language, emergency numbers, log out.
class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  Future<void> _pickLanguage(BuildContext context) async {
    final prefs = context.read<AppPrefs>();
    final current = prefs.locale.languageCode;
    final l = AppLocalizations.of(context);
    final code = await showModalBottomSheet<String>(
      context: context,
      builder: (sheetContext) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (final (value, label) in [('bn', l.languageBangla), ('en', l.languageEnglish)])
              ListTile(
                title: Text(label),
                trailing: value == current ? const Icon(Icons.check, color: CbColors.brand) : null,
                onTap: () => Navigator.pop(sheetContext, value),
              ),
          ],
        ),
      ),
    );
    if (code != null && code != current) await prefs.setLocale(code);
  }

  void _showNumbers(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      builder: (sheetContext) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(CbSpace.gutter, 0, CbSpace.gutter, CbSpace.l),
          child: EmergencyNumbers(
            onCall: (number) => launchUrl(Uri(scheme: 'tel', path: number)),
          ),
        ),
      ),
    );
  }

  Future<void> _logout(BuildContext context) async {
    final navigator = Navigator.of(context);
    context.read<PassengerSocketService>().resetRide();
    await context.read<AppPrefs>().clearSession();
    navigator.pushAndRemoveUntil(
      MaterialPageRoute<void>(builder: (_) => const PhoneScreen()),
      (_) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    final session = context.select<PassengerSocketService, PassengerSession>((s) => s.session);
    final connected = context.select<PassengerSocketService, bool>((s) => s.isConnected);

    return Scaffold(
      appBar: AppBar(title: Text(l.accountTitle)),
      body: ListView(
        children: [
          Padding(
            padding: const EdgeInsets.all(CbSpace.gutter),
            child: Row(
              children: [
                CbAvatar(name: session.fullName, size: 56),
                const SizedBox(width: CbSpace.l),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(session.fullName, maxLines: 2, overflow: TextOverflow.ellipsis, style: text.titleLarge),
                      Text(fmtBdPhone(session.phoneNumber), style: cbMoneyStyle(14, color: CbColors.ink2, weight: FontWeight.w400)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.translate),
            title: Text(l.accountLanguage),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(isBangla(context) ? l.languageBangla : l.languageEnglish, style: text.bodyMedium),
                const Icon(Icons.chevron_right),
              ],
            ),
            onTap: () => _pickLanguage(context),
          ),
          ListTile(
            leading: const Icon(Icons.health_and_safety_outlined),
            title: Text(l.safetyNumbers),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _showNumbers(context),
          ),
          ListTile(
            leading: const Icon(Icons.logout),
            title: Text(l.accountLogout),
            onTap: () => _logout(context),
          ),
          if (kDemoMode) ...[
            const Divider(),
            ListTile(
              leading: StatusDot(color: connected ? CbColors.brand : CbColors.warning),
              title: Text(l.accountServer),
              subtitle: Text(
                '${connected ? l.accountServerLive : l.homeOfflineDemo} · ${context.read<PassengerApiService>().baseUrl}',
              ),
            ),
          ],
        ],
      ),
    );
  }
}
