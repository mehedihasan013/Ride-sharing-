import 'package:cholo_ui/cholo_ui.dart';
import 'package:material_ui/material_ui.dart';

import '../../l10n/app_localizations.dart';
import '../../models/passenger_models.dart';
import '../../widgets/labels.dart';
import '../../widgets/place_row.dart';

/// A suggested destination on the idle panel.
typedef PlaceSuggestion = ({BhairabLandmark place, double km, bool recent});

/// Home panel before a destination is chosen: pickup, "Where to?", services, suggestions.
class IdleSheet extends StatelessWidget {
  const IdleSheet({
    super.key,
    required this.pickupName,
    required this.suggestions,
    required this.onEditPickup,
    required this.onWhereTo,
    required this.onIntercity,
    required this.onSuggestion,
  });

  final String pickupName;
  final List<PlaceSuggestion> suggestions;
  final VoidCallback onEditPickup;
  final VoidCallback onWhereTo;
  final VoidCallback onIntercity;
  final ValueChanged<BhairabLandmark> onSuggestion;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        InkWell(
          onTap: onEditPickup,
          borderRadius: BorderRadius.circular(CbRadius.chip),
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 44),
            child: Row(
              children: [
                const StatusDot(color: CbColors.brand, size: 10),
                const SizedBox(width: CbSpace.s),
                Expanded(
                  child: Text(
                    l.homePickupFrom(pickupName),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: text.bodyMedium,
                  ),
                ),
                const Icon(Icons.expand_more, color: CbColors.ink3),
              ],
            ),
          ),
        ),
        const SizedBox(height: CbSpace.s),
        Material(
          color: CbColors.raised,
          borderRadius: BorderRadius.circular(CbRadius.control),
          child: InkWell(
            onTap: onWhereTo,
            borderRadius: BorderRadius.circular(CbRadius.control),
            child: SizedBox(
              height: 56,
              child: Row(
                children: [
                  const SizedBox(width: CbSpace.l),
                  const Icon(Icons.search, color: CbColors.ink),
                  const SizedBox(width: CbSpace.m),
                  Expanded(
                    child: Text(
                      l.homeWhereTo,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: text.bodyLarge?.copyWith(fontWeight: FontWeight.w500),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: CbSpace.m),
        Row(
          children: [
            Expanded(
              child: _ServiceTile(
                icon: Icons.electric_rickshaw,
                title: l.homeServiceRide,
                hint: l.homeServiceRideHint,
                onTap: onWhereTo,
              ),
            ),
            const SizedBox(width: CbSpace.m),
            Expanded(
              child: _ServiceTile(
                icon: Icons.airport_shuttle,
                title: l.homeServiceIntercity,
                hint: l.homeServiceIntercityHint,
                onTap: onIntercity,
              ),
            ),
          ],
        ),
        if (suggestions.isNotEmpty) const SizedBox(height: CbSpace.s),
        for (final s in suggestions)
          PlaceRow(
            icon: s.recent ? Icons.history : Icons.place_outlined,
            title: placeName(context, s.place),
            trailing: l.commonKm(fmtKm(s.km)),
            onTap: () => onSuggestion(s.place),
          ),
      ],
    );
  }
}

class _ServiceTile extends StatelessWidget {
  const _ServiceTile({required this.icon, required this.title, required this.hint, required this.onTap});

  final IconData icon;
  final String title;
  final String hint;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Material(
      color: CbColors.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(CbRadius.control),
        side: const BorderSide(color: CbColors.line),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(CbRadius.control),
        child: Padding(
          padding: const EdgeInsets.all(CbSpace.m),
          child: Row(
            children: [
              Icon(icon, color: CbColors.brand),
              const SizedBox(width: CbSpace.s),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: text.titleSmall),
                    Text(hint, maxLines: 1, overflow: TextOverflow.ellipsis, style: text.bodySmall),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
