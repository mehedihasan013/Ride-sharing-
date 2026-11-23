import 'package:cholo_ui/cholo_ui.dart';
import 'package:material_ui/material_ui.dart';

import '../../l10n/app_localizations.dart';

/// Driver trip steps, kept on this phone (the backend has no arrived/started events).
enum TripStep { goToPickup, waitForPassenger, driveToDropoff }

/// Home panel during a trip: step, passenger, route, call, and the next-step button.
class TripPanel extends StatelessWidget {
  const TripPanel({
    super.key,
    required this.step,
    required this.passengerName,
    required this.fare,
    required this.pickupName,
    required this.dropoffName,
    required this.onCall,
    required this.onNext,
  });

  final TripStep step;
  final String passengerName;
  final double fare;
  final String pickupName;
  final String dropoffName;
  final VoidCallback onCall;
  final VoidCallback onNext;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    final (title, action) = switch (step) {
      TripStep.goToPickup => (l.tripGoPickup, l.tripArrived),
      TripStep.waitForPassenger => (l.tripWaitPassenger, l.tripStart),
      TripStep.driveToDropoff => (l.tripDriveDropoff, l.tripComplete(fmtMoney(fare))),
    };

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            StatusDot(color: step == TripStep.driveToDropoff ? CbColors.brand : CbColors.warning, size: 10),
            const SizedBox(width: CbSpace.s),
            Expanded(child: Text(title, style: text.titleMedium)),
          ],
        ),
        const SizedBox(height: CbSpace.m),
        Row(
          children: [
            CbAvatar(name: passengerName, size: 40),
            const SizedBox(width: CbSpace.m),
            Expanded(
              child: Text(passengerName, maxLines: 1, overflow: TextOverflow.ellipsis, style: text.titleSmall),
            ),
            const SizedBox(width: CbSpace.s),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(fmtMoney(fare), style: cbMoneyStyle(22)),
                Text(l.commonCash, style: text.bodySmall),
              ],
            ),
          ],
        ),
        const SizedBox(height: CbSpace.m),
        RouteStops(
          pickupLabel: l.reqPickup,
          pickup: pickupName,
          dropoffLabel: l.reqDropoff,
          dropoff: dropoffName,
          maxLines: 1,
        ),
        const SizedBox(height: CbSpace.m),
        OutlinedButton.icon(
          onPressed: onCall,
          icon: const Icon(Icons.call_outlined),
          label: Text(l.tripCallPassenger),
        ),
        const SizedBox(height: CbSpace.s),
        FilledButton(onPressed: onNext, child: Text(action)),
      ],
    );
  }
}
