import 'package:cholo_ui/cholo_ui.dart';
import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../app_prefs.dart';
import '../../l10n/app_localizations.dart';
import '../../models/driver_models.dart';
import '../../services/bangla_voice_service.dart';
import '../../services/driver_api_service.dart';
import '../../services/driver_socket_service.dart';
import '../../widgets/labels.dart';
import 'kyc_screen.dart';
import 'voice_screen.dart';

/// Profile, documents, voice alerts, language and (demo builds) demo tools.
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

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    final (profile, wallet, connected) = context.select<DriverSocketService, (DriverProfileModel, DriverWalletModel, bool)>(
      (s) => (s.profile, s.wallet, s.isSocketConnected),
    );
    final muted = context.select<BanglaVoiceService, bool>((v) => v.isMuted);
    final (kycLabel, kycColor) = kycStatusLabel(l, profile.kycStatus);
    final socket = context.read<DriverSocketService>();

    Widget trailing(String value, [Color? dot]) => Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (dot != null) ...[StatusDot(color: dot), const SizedBox(width: 6)],
            Text(value, style: text.bodyMedium),
            const Icon(Icons.chevron_right),
          ],
        );

    return Scaffold(
      appBar: AppBar(title: Text(l.accountTitle)),
      body: ListView(
        children: [
          Padding(
            padding: const EdgeInsets.all(CbSpace.gutter),
            child: Row(
              children: [
                CbAvatar(name: profile.driverName, size: 56),
                const SizedBox(width: CbSpace.l),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(profile.driverName, maxLines: 2, overflow: TextOverflow.ellipsis, style: text.titleLarge),
                      Row(
                        children: [
                          Text(fmtBdPhone(profile.driverPhone), style: cbMoneyStyle(14, color: CbColors.ink2, weight: FontWeight.w400)),
                          const SizedBox(width: CbSpace.s),
                          const Icon(Icons.star_rounded, size: 16, color: CbColors.warning),
                          Text(profile.rating.toStringAsFixed(1), style: text.labelMedium),
                        ],
                      ),
                      Row(
                        children: [
                          StatusDot(color: CbColors.vehicle(profile.vehicleType)),
                          const SizedBox(width: 6),
                          Flexible(
                            child: Text(
                              '${vehicleLabel(l, profile.vehicleType)} · ${profile.vehicleModel}',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: text.bodySmall,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.badge_outlined),
            title: Text(l.accountDocuments),
            trailing: trailing(kycLabel, kycColor),
            onTap: () => Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => const KycScreen())),
          ),
          ListTile(
            leading: const Icon(Icons.record_voice_over_outlined),
            title: Text(l.accountVoice),
            trailing: trailing(muted ? l.voiceOff : l.voiceOn),
            onTap: () => Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => const VoiceScreen())),
          ),
          ListTile(
            leading: const Icon(Icons.translate),
            title: Text(l.accountLanguage),
            trailing: trailing(isBangla(context) ? l.languageBangla : l.languageEnglish),
            onTap: () => _pickLanguage(context),
          ),
          if (kDemoMode) ...[
            const Divider(),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: CbSpace.gutter),
              child: CbSectionLabel(l.accountDemoTools),
            ),
            ListTile(
              leading: const Icon(Icons.notifications_active_outlined),
              title: Text(l.homeDemoRequest),
              onTap: () {
                if (!socket.isOnline) socket.toggleOnlineStatus(true);
                socket.simulateIncomingOpportunity();
              },
            ),
            SwitchListTile(
              secondary: const Icon(Icons.account_balance_wallet_outlined),
              title: Text(l.accountLowBalanceMode),
              value: wallet.isLockedOut,
              onChanged: (_) => socket.toggleLowBalanceDemoMode(),
            ),
            ListTile(
              leading: StatusDot(color: connected ? CbColors.brand : CbColors.warning),
              title: Text(l.accountServer),
              subtitle: Text('${connected ? l.accountServerLive : l.accountServerOffline} · ${socket.serverUrl}'),
            ),
          ],
        ],
      ),
    );
  }
}
