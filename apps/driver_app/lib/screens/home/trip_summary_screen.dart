import 'package:cholo_ui/cholo_ui.dart';
import 'package:material_ui/material_ui.dart';

import '../../l10n/app_localizations.dart';
import '../../models/driver_models.dart';

/// After "Complete": cash to collect, the 8% commission, what the driver keeps, new balance.
class TripSummaryScreen extends StatelessWidget {
  const TripSummaryScreen({super.key, required this.summary, required this.newBalance});

  final CompletedRideSummary summary;
  final double newBalance;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    final keep = summary.cashCollected - summary.commissionDeductedBdt;
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(CbSpace.gutter, CbSpace.xxl, CbSpace.gutter, CbSpace.xl),
          children: [
            const Icon(Icons.check_circle, size: 48, color: CbColors.brand),
            const SizedBox(height: CbSpace.m),
            Text(l.sumTitle, textAlign: TextAlign.center, style: text.titleLarge),
            const SizedBox(height: CbSpace.l),
            Text(fmtMoney(summary.cashCollected), textAlign: TextAlign.center, style: cbMoneyStyle(40)),
            const SizedBox(height: CbSpace.xl),
            _Row(label: l.sumFare, value: fmtMoney(summary.cashCollected)),
            _Row(label: l.sumCommission, value: fmtMoney(-summary.commissionDeductedBdt), color: CbColors.ink2),
            const Divider(),
            _Row(label: l.sumKeep, value: fmtMoney(keep), bold: true),
            _Row(label: l.sumBalance, value: fmtMoney(newBalance)),
            const SizedBox(height: CbSpace.xl),
            FilledButton(onPressed: () => Navigator.of(context).pop(), child: Text(l.commonDone)),
          ],
        ),
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.label, required this.value, this.color = CbColors.ink, this.bold = false});

  final String label;
  final String value;
  final Color color;
  final bool bold;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: CbSpace.s),
        child: Row(
          children: [
            Expanded(child: Text(label, style: Theme.of(context).textTheme.bodyLarge)),
            Text(value, style: cbMoneyStyle(bold ? 20 : 17, color: color, weight: bold ? FontWeight.w600 : FontWeight.w500)),
          ],
        ),
      );
}
