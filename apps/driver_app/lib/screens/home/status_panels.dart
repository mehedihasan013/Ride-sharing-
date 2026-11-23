import 'package:cholo_ui/cholo_ui.dart';
import 'package:material_ui/material_ui.dart';

import '../../l10n/app_localizations.dart';

/// Home panel while offline: where you are, and the big "Go online" button.
class OfflinePanel extends StatelessWidget {
  const OfflinePanel({
    super.key,
    required this.locationName,
    required this.onChooseLocation,
    required this.onGoOnline,
  });

  final String locationName;
  final VoidCallback onChooseLocation;
  final VoidCallback onGoOnline;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        LocationRow(label: l.homeLocation(locationName), onTap: onChooseLocation),
        Text(l.homeOfflineHint, style: Theme.of(context).textTheme.bodyMedium),
        const SizedBox(height: CbSpace.l),
        FilledButton(onPressed: onGoOnline, child: Text(l.homeGoOnline)),
      ],
    );
  }
}

/// Home panel while online and waiting for requests.
class OnlinePanel extends StatelessWidget {
  const OnlinePanel({
    super.key,
    required this.locationName,
    required this.onChooseLocation,
    required this.onGoOffline,
    this.onDemoRequest,
  });

  final String locationName;
  final VoidCallback onChooseLocation;
  final VoidCallback onGoOffline;

  /// Demo builds only.
  final VoidCallback? onDemoRequest;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            const StatusDot(color: CbColors.brand, size: 10),
            const SizedBox(width: CbSpace.s),
            Expanded(
              child: Text(l.homeWaiting(locationName), style: Theme.of(context).textTheme.titleMedium),
            ),
          ],
        ),
        LocationRow(label: l.homeLocation(locationName), onTap: onChooseLocation),
        const SizedBox(height: CbSpace.s),
        OutlinedButton(onPressed: onGoOffline, child: Text(l.homeGoOffline)),
        if (onDemoRequest != null) TextButton(onPressed: onDemoRequest, child: Text(l.homeDemoRequest)),
      ],
    );
  }
}

/// Home panel when online but the wallet is below the bidding minimum.
class LockoutPanel extends StatelessWidget {
  const LockoutPanel({
    super.key,
    required this.balance,
    required this.minimum,
    required this.onTopUp,
    required this.onOpenWallet,
    required this.onGoOffline,
  });

  final double balance;
  final double minimum;
  final VoidCallback onTopUp;
  final VoidCallback onOpenWallet;
  final VoidCallback onGoOffline;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        CbBanner(
          tone: CbTone.danger,
          icon: Icons.lock_outline,
          title: l.lockTitle,
          message: l.lockBody(fmtMoney(minimum), fmtMoney(balance)),
        ),
        const SizedBox(height: CbSpace.l),
        FilledButton(
          style: FilledButton.styleFrom(backgroundColor: CbColors.bkash, foregroundColor: CbColors.surface),
          onPressed: onTopUp,
          child: Text(l.lockTopup(fmtMoney(100))),
        ),
        const SizedBox(height: CbSpace.s),
        OutlinedButton(onPressed: onOpenWallet, child: Text(l.navWallet)),
        TextButton(
          style: TextButton.styleFrom(foregroundColor: CbColors.ink2),
          onPressed: onGoOffline,
          child: Text(l.homeGoOffline),
        ),
      ],
    );
  }
}

/// "Your location: …" row that opens the stand picker.
class LocationRow extends StatelessWidget {
  const LocationRow({super.key, required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(CbRadius.chip),
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 48),
          child: Row(
            children: [
              const Icon(Icons.place_outlined, size: 20, color: CbColors.ink2),
              const SizedBox(width: CbSpace.s),
              Expanded(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ),
              const Icon(Icons.expand_more, color: CbColors.ink3),
            ],
          ),
        ),
      );
}
