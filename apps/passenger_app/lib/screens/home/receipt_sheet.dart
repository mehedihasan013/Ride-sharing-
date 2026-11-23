import 'package:cholo_ui/cholo_ui.dart';
import 'package:material_ui/material_ui.dart';

import '../../l10n/app_localizations.dart';

/// Home panel when the trip is complete: the cash amount to hand over.
/// No rating: the backend has no endpoint for it yet, and a rating that goes nowhere would be fake.
class ReceiptSheet extends StatelessWidget {
  const ReceiptSheet({
    super.key,
    required this.fare,
    required this.driverName,
    required this.pickupName,
    required this.dropoffName,
    required this.onDone,
  });

  final int fare;
  final String? driverName;
  final String pickupName;
  final String dropoffName;
  final VoidCallback onDone;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Icon(Icons.check_circle, size: 40, color: CbColors.brand),
        const SizedBox(height: CbSpace.s),
        Text(l.receiptTitle, textAlign: TextAlign.center, style: text.titleLarge),
        Text(l.receiptPayCash, textAlign: TextAlign.center, style: text.bodyMedium),
        const SizedBox(height: CbSpace.l),
        Text(fmtMoney(fare), textAlign: TextAlign.center, style: cbMoneyStyle(40)),
        const SizedBox(height: CbSpace.l),
        if (driverName != null) _Row(label: l.receiptDriver, value: driverName!),
        _Row(label: l.receiptRoute, value: l.receiptRouteValue(pickupName, dropoffName)),
        const SizedBox(height: CbSpace.xl),
        FilledButton(onPressed: onDone, child: Text(l.commonDone)),
      ],
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: CbSpace.xs),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: text.bodyMedium),
          const SizedBox(width: CbSpace.l),
          Expanded(child: Text(value, textAlign: TextAlign.end, maxLines: 3, style: text.bodyLarge)),
        ],
      ),
    );
  }
}
