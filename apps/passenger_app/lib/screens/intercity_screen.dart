import 'package:cholo_ui/cholo_ui.dart';
import 'package:material_ui/material_ui.dart';

import '../l10n/app_localizations.dart';
import '../models/passenger_models.dart';
import '../widgets/labels.dart';

/// What the intercity screen hands back to Home, which sends the request.
class IntercityBooking {
  const IntercityBooking({required this.pickup, required this.dropoff, required this.fare});

  final BhairabLandmark pickup;
  final BhairabLandmark dropoff;
  final int fare;
}

/// Intercity seat share or whole vehicle to Dhaka, Kishoreganj or Brahmanbaria.
/// shortcut: the backend has no scheduling, so the departure time and seats travel inside the
/// drop-off address; replace when a booking API exists.
class IntercityScreen extends StatefulWidget {
  const IntercityScreen({super.key, required this.landmarks});

  final List<BhairabLandmark> landmarks;

  @override
  State<IntercityScreen> createState() => _IntercityScreenState();
}

class _IntercityScreenState extends State<IntercityScreen> {
  IntercityRouteModel _route = IntercityRouteModel.defaultRoutes.first;
  bool _whole = false;
  int _seats = 1;
  late String _time = _route.departureTime;

  int get _fare => _whole ? _route.fullCarFareBdt : _route.seatFareBdt * _seats;

  BhairabLandmark _origin(IntercityRouteModel route) {
    bool match(BhairabLandmark p) => p.id == route.originLandmarkId;
    return widget.landmarks.where(match).firstOrNull ??
        BhairabLandmark.defaultLandmarks.firstWhere(match, orElse: () => BhairabLandmark.defaultLandmarks.first);
  }

  void _book() {
    final route = _route;
    final seatsBn = _whole ? 'পুরো গাড়ি' : '$_seats সিট';
    final seatsEn = _whole ? 'whole vehicle' : '$_seats seats';
    Navigator.of(context).pop(
      IntercityBooking(
        pickup: _origin(route),
        dropoff: BhairabLandmark(
          id: 'intercity_${route.id}',
          banglaName: '${route.destinationBangla} · $_time · $seatsBn',
          englishName: '${route.destinationEnglish} · $_time · $seatsEn',
          category: 'intercity',
          latitude: route.destinationLat,
          longitude: route.destinationLng,
          descriptionBangla: '',
        ),
        fare: _fare,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    final bangla = isBangla(context);

    return Scaffold(
      appBar: AppBar(title: Text(l.intercityTitle)),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(CbSpace.gutter, 0, CbSpace.gutter, CbSpace.xl),
        children: [
          Text(l.intercitySubtitle, style: text.bodyMedium),
          const SizedBox(height: CbSpace.l),
          for (final route in IntercityRouteModel.defaultRoutes)
            Padding(
              padding: const EdgeInsets.only(bottom: CbSpace.s),
              child: _RouteCard(
                selected: route.id == _route.id,
                title: bangla ? route.destinationBangla : route.destinationEnglish,
                detail: l.intercityFrom(
                  shortPlaceName(context, _origin(route)),
                  bangla ? route.vehicleNameBangla : route.vehicleNameEnglish,
                ),
                prices: l.intercityPrices(fmtMoney(route.seatFareBdt), fmtMoney(route.fullCarFareBdt)),
                onTap: () => setState(() {
                  _route = route;
                  _time = route.departureTime;
                  if (_seats > route.availableSeats) _seats = route.availableSeats;
                }),
              ),
            ),
          const SizedBox(height: CbSpace.s),
          SegmentedButton<bool>(
            showSelectedIcon: false,
            segments: [
              ButtonSegment(value: false, label: Text(l.intercitySeatShare)),
              ButtonSegment(value: true, label: Text(l.intercityWhole)),
            ],
            selected: {_whole},
            onSelectionChanged: (value) => setState(() => _whole = value.first),
          ),
          if (!_whole) ...[
            CbSectionLabel(l.intercitySeats),
            Wrap(
              spacing: CbSpace.s,
              children: [
                for (var n = 1; n <= _route.availableSeats; n++)
                  ChoiceChip(
                    showCheckmark: false,
                    label: Text('$n'),
                    selected: _seats == n,
                    onSelected: (_) => setState(() => _seats = n),
                  ),
              ],
            ),
          ],
          CbSectionLabel(l.intercityDeparture),
          Wrap(
            spacing: CbSpace.s,
            runSpacing: CbSpace.s,
            children: [
              for (final slot in IntercityRouteModel.departureSlots)
                ChoiceChip(
                  showCheckmark: false,
                  label: Text(slot),
                  selected: _time == slot,
                  onSelected: (_) => setState(() => _time = slot),
                ),
            ],
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(CbSpace.gutter),
          child: FilledButton(onPressed: _book, child: Text(l.intercityBook(fmtMoney(_fare)))),
        ),
      ),
    );
  }
}

class _RouteCard extends StatelessWidget {
  const _RouteCard({
    required this.selected,
    required this.title,
    required this.detail,
    required this.prices,
    required this.onTap,
  });

  final bool selected;
  final String title;
  final String detail;
  final String prices;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Semantics(
      selected: selected,
      inMutuallyExclusiveGroup: true,
      button: true,
      child: Material(
        color: selected ? CbColors.brandTint : CbColors.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(CbRadius.control),
          side: BorderSide(color: selected ? CbColors.brand : CbColors.line, width: selected ? 2 : 1),
        ),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(CbRadius.control),
          child: Padding(
            padding: const EdgeInsets.all(CbSpace.m),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: text.titleSmall),
                const SizedBox(height: 2),
                Text(detail, style: text.bodySmall),
                Text(prices, style: text.bodyMedium?.copyWith(color: CbColors.ink)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
