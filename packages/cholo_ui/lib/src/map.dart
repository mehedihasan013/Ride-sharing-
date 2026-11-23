import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:material_ui/material_ui.dart';

import 'tokens.dart';

/// Same tile source as the admin web (apps/admin_web/src/components/BhairabMap.tsx).
/// shortcut: public OSM tiles are for light pilot use only; switch to Barikoi/MapTiler before public traffic.
const kOsmTileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

/// Bhairab Bazar railway junction.
const kBhairabCenter = LatLng(24.0487, 90.9852);

/// Camera is kept inside Bhairab and the intercity corridor (Dhaka to Brahmanbaria).
final kServiceBounds = LatLngBounds(const LatLng(23.6, 90.2), const LatLng(24.6, 91.3));

/// Muted basemap, the web's `saturate(0.5) contrast(0.95)`, so the green route and pins stand out.
const _mutedTiles = ColorFilter.matrix(<double>[
  0.5760, 0.3397, 0.0343, 0, 6.375, //
  0.1010, 0.8147, 0.0343, 0, 6.375, //
  0.1010, 0.3397, 0.5093, 0, 6.375, //
  0, 0, 0, 1, 0,
]);

/// Straight-line distance in km (no routing service).
double cbDistanceKm(LatLng a, LatLng b) => const Distance().as(LengthUnit.Meter, a, b) / 1000;

/// A tappable named place shown on the map (Bhairab landmarks, driver stands).
class CbMapPlace {
  const CbMapPlace({required this.id, required this.point, required this.label});

  final String id;
  final LatLng point;
  final String label;
}

/// The one map widget both apps use.
///
/// The camera fits pickup and drop-off whenever either changes, never on driver movement.
class CbMap extends StatefulWidget {
  const CbMap({
    super.key,
    required this.userAgentPackageName,
    this.pickup,
    this.dropoff,
    this.driver,
    this.driverVehicleType = 'EASYBIKE',
    this.places = const [],
    this.onPlaceTap,
    this.onCenterChanged,
    this.fitPadding = const EdgeInsets.fromLTRB(56, 120, 56, 360),
    this.initialZoom = 14.5,
    this.initialCenter,
  });

  /// The app's applicationId; OpenStreetMap blocks requests without a real User-Agent.
  final String userAgentPackageName;
  final LatLng? pickup;
  final LatLng? dropoff;
  final LatLng? driver;
  final String driverVehicleType;
  final List<CbMapPlace> places;
  final ValueChanged<String>? onPlaceTap;

  /// Called as the user drags the map (pick-on-map).
  final ValueChanged<LatLng>? onCenterChanged;

  /// Space to keep clear around the fitted route (bottom panel, top controls).
  final EdgeInsets fitPadding;
  final double initialZoom;

  /// Where the camera starts when there is no pickup (defaults to Bhairab).
  final LatLng? initialCenter;

  @override
  State<CbMap> createState() => _CbMapState();
}

class _CbMapState extends State<CbMap> {
  final _controller = MapController();
  bool _ready = false;

  @override
  void didUpdateWidget(CbMap old) {
    super.didUpdateWidget(old);
    if (old.pickup != widget.pickup || old.dropoff != widget.dropoff) _fit();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _fit() {
    if (!_ready) return;
    final points = [widget.pickup, widget.dropoff].whereType<LatLng>().toList();
    if (points.length == 2) {
      _controller.fitCamera(
        CameraFit.bounds(
          bounds: LatLngBounds.fromPoints(points),
          padding: widget.fitPadding,
          maxZoom: 16,
        ),
      );
    } else if (points.length == 1) {
      _controller.move(points.first, 15);
    }
  }

  @override
  Widget build(BuildContext context) {
    final pickup = widget.pickup;
    final dropoff = widget.dropoff;
    final driver = widget.driver;
    return FlutterMap(
      mapController: _controller,
      options: MapOptions(
        initialCenter: widget.initialCenter ?? pickup ?? kBhairabCenter,
        initialZoom: widget.initialZoom,
        minZoom: 9,
        maxZoom: 18,
        backgroundColor: CbColors.raised,
        cameraConstraint: CameraConstraint.contain(bounds: kServiceBounds),
        interactionOptions: const InteractionOptions(flags: InteractiveFlag.all & ~InteractiveFlag.rotate),
        onMapReady: () {
          _ready = true;
          _fit();
        },
        onPositionChanged: widget.onCenterChanged == null
            ? null
            : (camera, hasGesture) => widget.onCenterChanged!(camera.center),
      ),
      children: [
        ColorFiltered(
          colorFilter: _mutedTiles,
          child: TileLayer(
            urlTemplate: kOsmTileUrl,
            userAgentPackageName: widget.userAgentPackageName,
            maxNativeZoom: 19,
          ),
        ),
        if (pickup != null && dropoff != null)
          PolylineLayer(
            polylines: [
              Polyline(
                points: [pickup, dropoff],
                color: CbColors.brand,
                strokeWidth: 4,
                pattern: StrokePattern.dashed(segments: const [12, 8]),
              ),
            ],
          ),
        MarkerLayer(
          markers: [
            for (final place in widget.places)
              Marker(
                point: place.point,
                width: 168,
                height: 44,
                // The chip starts at the point and extends to the right.
                alignment: Alignment.centerRight,
                child: _PlaceChip(place: place, onTap: widget.onPlaceTap),
              ),
            if (pickup != null) Marker(point: pickup, width: 24, height: 24, child: const _PickupMark()),
            if (dropoff != null) Marker(point: dropoff, width: 22, height: 22, child: const _DropoffMark()),
            if (driver != null)
              Marker(point: driver, width: 32, height: 32, child: _DriverMark(type: widget.driverVehicleType)),
          ],
        ),
      ],
    );
  }
}

class _PickupMark extends StatelessWidget {
  const _PickupMark();

  @override
  Widget build(BuildContext context) => Center(
        child: Container(
          width: 18,
          height: 18,
          decoration: BoxDecoration(
            color: CbColors.brand,
            shape: BoxShape.circle,
            border: Border.all(color: CbColors.surface, width: 3),
            boxShadow: CbShadow.floating,
          ),
        ),
      );
}

class _DropoffMark extends StatelessWidget {
  const _DropoffMark();

  @override
  Widget build(BuildContext context) => Center(
        child: Container(
          width: 16,
          height: 16,
          decoration: BoxDecoration(
            color: CbColors.ink,
            border: Border.all(color: CbColors.surface, width: 3),
            boxShadow: CbShadow.floating,
          ),
        ),
      );
}

class _DriverMark extends StatelessWidget {
  const _DriverMark({required this.type});

  final String type;

  @override
  Widget build(BuildContext context) => Container(
        decoration: BoxDecoration(
          color: CbColors.vehicle(type),
          shape: BoxShape.circle,
          border: Border.all(color: CbColors.surface, width: 3),
          boxShadow: CbShadow.floating,
        ),
        child: Icon(cbVehicleIcon(type), size: 14, color: CbColors.surface),
      );
}

class _PlaceChip extends StatelessWidget {
  const _PlaceChip({required this.place, this.onTap});

  final CbMapPlace place;
  final ValueChanged<String>? onTap;

  @override
  Widget build(BuildContext context) {
    final chip = Container(
      padding: const EdgeInsets.fromLTRB(6, 4, 8, 4),
      decoration: BoxDecoration(
        color: CbColors.surface,
        borderRadius: BorderRadius.circular(999),
        boxShadow: CbShadow.floating,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(
            width: 8,
            height: 8,
            child: DecoratedBox(decoration: BoxDecoration(color: CbColors.ink3, shape: BoxShape.circle)),
          ),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              place.label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.labelMedium?.copyWith(color: CbColors.ink),
            ),
          ),
        ],
      ),
    );
    return Align(
      alignment: Alignment.centerLeft,
      child: Semantics(
        button: onTap != null,
        label: place.label,
        excludeSemantics: true,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: onTap == null ? null : () => onTap!(place.id),
          child: Padding(padding: const EdgeInsets.symmetric(vertical: 6), child: chip),
        ),
      ),
    );
  }
}
