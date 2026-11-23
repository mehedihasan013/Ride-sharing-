import 'package:cholo_ui/cholo_ui.dart';
import 'package:material_ui/material_ui.dart';

import '../l10n/app_localizations.dart';
import '../models/passenger_models.dart';
import '../services/passenger_api_service.dart';
import '../widgets/labels.dart';

/// Drag the map under a fixed centre pin; returns a 'pin' landmark named after the nearest place.
class PickOnMapScreen extends StatefulWidget {
  const PickOnMapScreen({super.key, required this.landmarks, required this.start, required this.forPickup});

  final List<BhairabLandmark> landmarks;
  final LatLng start;
  final bool forPickup;

  @override
  State<PickOnMapScreen> createState() => _PickOnMapScreenState();
}

class _PickOnMapScreenState extends State<PickOnMapScreen> {
  /// Further than this from every known place counts as outside the service area.
  static const _maxKmFromPlace = 5.0;

  late LatLng _center = widget.start;

  (BhairabLandmark, double) get _nearest {
    BhairabLandmark? best;
    var bestKm = double.infinity;
    for (final p in widget.landmarks) {
      final km = BhairabLandmark.calculateDistanceKm(_center.latitude, _center.longitude, p.latitude, p.longitude);
      if (km < bestKm) {
        best = p;
        bestKm = km;
      }
    }
    return (best ?? BhairabLandmark.defaultLandmarks.first, bestKm);
  }

  void _confirm(BhairabLandmark nearest) {
    Navigator.of(context).pop(
      BhairabLandmark(
        id: 'pin_${_center.latitude.toStringAsFixed(5)}_${_center.longitude.toStringAsFixed(5)}',
        banglaName: '${nearest.banglaName}-এর কাছে',
        englishName: 'Near ${nearest.englishName}',
        category: 'pin',
        latitude: _center.latitude,
        longitude: _center.longitude,
        descriptionBangla: '',
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    final (nearest, km) = _nearest;
    final outside = km > _maxKmFromPlace;

    return Scaffold(
      body: CbMapLayout(
        map: Stack(
          children: [
            CbMap(
              userAgentPackageName: kAppPackageName,
              initialCenter: widget.start,
              initialZoom: 16,
              onCenterChanged: (center) => setState(() => _center = center),
            ),
            // The pin's tip marks the map centre.
            IgnorePointer(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 40),
                  child: Icon(
                    Icons.location_on,
                    size: 44,
                    color: widget.forPickup ? CbColors.brand : CbColors.ink,
                  ),
                ),
              ),
            ),
          ],
        ),
        topStart: CbFloatingButton(
          icon: Icons.arrow_back,
          tooltip: l.commonBack,
          onPressed: () => Navigator.of(context).pop(),
        ),
        panel: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(widget.forPickup ? l.pickTitlePickup : l.pickTitleDropoff, style: text.titleMedium),
            const SizedBox(height: CbSpace.xs),
            Text(
              outside ? l.pickOutside : l.pickNear(shortPlaceName(context, nearest)),
              style: text.bodyMedium?.copyWith(color: outside ? CbColors.danger : null),
            ),
            const SizedBox(height: CbSpace.l),
            FilledButton(
              onPressed: outside ? null : () => _confirm(nearest),
              child: Text(widget.forPickup ? l.pickConfirmPickup : l.pickConfirmDropoff),
            ),
          ],
        ),
      ),
    );
  }
}
