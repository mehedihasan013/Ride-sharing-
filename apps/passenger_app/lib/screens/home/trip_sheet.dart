import 'package:cholo_ui/cholo_ui.dart';
import 'package:material_ui/material_ui.dart';

import '../../l10n/app_localizations.dart';
import '../../models/passenger_models.dart';

/// Home panel once a driver is assigned: status, route, driver, call / share / safety.
class TripSheet extends StatelessWidget {
  const TripSheet({
    super.key,
    required this.ride,
    required this.pickupName,
    required this.dropoffName,
    required this.onCall,
    required this.onShare,
    required this.onSafety,
    required this.onCancel,
    this.onDemoComplete,
  });

  final ActiveRideModel ride;
  final String pickupName;
  final String dropoffName;
  final VoidCallback onCall;
  final VoidCallback onShare;
  final VoidCallback onSafety;
  final VoidCallback onCancel;

  /// Demo builds only.
  final VoidCallback? onDemoComplete;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    final driver = ride.assignedDriver;
    final fare = ride.agreedFare ?? ride.initialOfferFare;
    final (title, dotColor) = switch (ride.status) {
      'ACCEPTED' => (l.tripDriverComing('${driver?.etaMinutes ?? 2}'), CbColors.warning),
      'ARRIVING' => (l.tripArrived, CbColors.brand),
      _ => (l.tripOnTrip, CbColors.brand),
    };

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            StatusDot(color: dotColor, size: 10),
            const SizedBox(width: CbSpace.s),
            Expanded(child: Text(title, style: text.titleMedium)),
          ],
        ),
        const SizedBox(height: CbSpace.m),
        RouteStops(
          pickupLabel: l.tripPickup,
          pickup: pickupName,
          dropoffLabel: l.tripDropoff,
          dropoff: dropoffName,
          maxLines: 1,
        ),
        const SizedBox(height: CbSpace.m),
        const Divider(),
        const SizedBox(height: CbSpace.m),
        if (driver != null)
          Row(
            children: [
              CbAvatar(name: driver.driverName),
              const SizedBox(width: CbSpace.m),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            driver.driverName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: text.titleSmall,
                          ),
                        ),
                        const SizedBox(width: CbSpace.xs),
                        const Icon(Icons.star_rounded, size: 16, color: CbColors.warning),
                        Text(driver.ratingAvg.toStringAsFixed(1), style: text.labelMedium),
                      ],
                    ),
                    Row(
                      children: [
                        StatusDot(color: CbColors.vehicle(ride.vehicleType)),
                        const SizedBox(width: 6),
                        Flexible(
                          child: Text(
                            driver.vehicleModel,
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
              const SizedBox(width: CbSpace.s),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(fmtMoney(fare), style: cbMoneyStyle(24)),
                  Text(l.commonCash, style: text.bodySmall),
                ],
              ),
            ],
          ),
        const SizedBox(height: CbSpace.l),
        Row(
          children: [
            Expanded(child: _ActionButton(icon: Icons.call_outlined, label: l.tripCall, onPressed: onCall)),
            const SizedBox(width: CbSpace.s),
            Expanded(child: _ActionButton(icon: Icons.share_outlined, label: l.tripShare, onPressed: onShare)),
            const SizedBox(width: CbSpace.s),
            Expanded(child: _ActionButton(icon: Icons.shield_outlined, label: l.tripSafety, onPressed: onSafety)),
          ],
        ),
        if (onDemoComplete != null) ...[
          const SizedBox(height: CbSpace.s),
          TextButton(onPressed: onDemoComplete, child: Text(l.tripDemoComplete)),
        ],
        TextButton(
          style: TextButton.styleFrom(foregroundColor: CbColors.ink2),
          onPressed: onCancel,
          child: Text(l.tripCancel),
        ),
      ],
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({required this.icon, required this.label, required this.onPressed});

  final IconData icon;
  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) => OutlinedButton(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(0, 64),
          padding: const EdgeInsets.symmetric(horizontal: CbSpace.xs, vertical: CbSpace.s),
        ),
        onPressed: onPressed,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 22),
            const SizedBox(height: 2),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.labelMedium?.copyWith(color: CbColors.ink),
            ),
          ],
        ),
      );
}
