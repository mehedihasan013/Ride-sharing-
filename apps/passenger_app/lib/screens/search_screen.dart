import 'package:cholo_ui/cholo_ui.dart';
import 'package:material_ui/material_ui.dart';

import '../l10n/app_localizations.dart';
import '../models/passenger_models.dart';
import '../widgets/labels.dart';
import '../widgets/place_row.dart';
import 'pick_on_map_screen.dart';

/// Pickup + destination search. Pops `(pickup, dropoff)` once both are chosen; they are never
/// the same place.
class SearchScreen extends StatefulWidget {
  const SearchScreen({
    super.key,
    required this.landmarks,
    required this.pickup,
    required this.recents,
    this.dropoff,
    this.editPickup = false,
  });

  final List<BhairabLandmark> landmarks;
  final BhairabLandmark pickup;
  final BhairabLandmark? dropoff;
  final List<BhairabLandmark> recents;

  /// Start with the pickup field focused instead of the destination.
  final bool editPickup;

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  late BhairabLandmark _pickup = widget.pickup;
  late BhairabLandmark? _dropoff = widget.dropoff;
  late bool _editingPickup = widget.editPickup;
  final _pickupController = TextEditingController();
  final _dropoffController = TextEditingController();
  final _pickupFocus = FocusNode();
  final _dropoffFocus = FocusNode();
  String _query = '';
  bool _namesFilled = false;

  @override
  void initState() {
    super.initState();
    _pickupFocus.addListener(() => _onFocus(_pickupFocus, true));
    _dropoffFocus.addListener(() => _onFocus(_dropoffFocus, false));
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Place names depend on the UI language, so fill the fields once the locale is known.
    if (_namesFilled) return;
    _namesFilled = true;
    _pickupController.text = placeName(context, _pickup);
    if (_dropoff != null) _dropoffController.text = placeName(context, _dropoff!);
  }

  @override
  void dispose() {
    _pickupController.dispose();
    _dropoffController.dispose();
    _pickupFocus.dispose();
    _dropoffFocus.dispose();
    super.dispose();
  }

  void _onFocus(FocusNode node, bool isPickup) {
    if (!node.hasFocus) return;
    final controller = isPickup ? _pickupController : _dropoffController;
    controller.selection = TextSelection(baseOffset: 0, extentOffset: controller.text.length);
    setState(() {
      _editingPickup = isPickup;
      _query = '';
    });
  }

  void _choose(BhairabLandmark place) {
    if (_editingPickup) {
      _pickup = place;
      _pickupController.text = placeName(context, place);
      if (_dropoff == null || _dropoff!.id == place.id) {
        _dropoff = null;
        _dropoffController.clear();
        _dropoffFocus.requestFocus();
        setState(() => _query = '');
        return;
      }
    } else {
      _dropoff = place;
    }
    final dropoff = _dropoff;
    if (dropoff != null && dropoff.id != _pickup.id) {
      Navigator.of(context).pop((_pickup, dropoff));
    }
  }

  void _swap() {
    final dropoff = _dropoff;
    if (dropoff == null) return;
    setState(() {
      _dropoff = _pickup;
      _pickup = dropoff;
      _pickupController.text = placeName(context, _pickup);
      _dropoffController.text = placeName(context, _dropoff!);
    });
  }

  Future<void> _chooseOnMap() async {
    final start = _editingPickup ? _pickup : (_dropoff ?? _pickup);
    final picked = await Navigator.of(context).push<BhairabLandmark>(
      MaterialPageRoute(
        builder: (_) => PickOnMapScreen(
          landmarks: widget.landmarks,
          start: LatLng(start.latitude, start.longitude),
          forPickup: _editingPickup,
        ),
      ),
    );
    if (picked != null && mounted) _choose(picked);
  }

  bool _matches(BhairabLandmark p) {
    final q = _query.trim().toLowerCase();
    if (q.isEmpty) return true;
    return p.banglaName.contains(q) || p.englishName.toLowerCase().contains(q);
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final otherId = _editingPickup ? _dropoff?.id : _pickup.id;
    final places = widget.landmarks.where((p) => p.id != otherId && _matches(p)).toList();
    final recents = _query.isEmpty
        ? widget.recents.where((p) => p.id != otherId).toList()
        : const <BhairabLandmark>[];

    double km(BhairabLandmark p) =>
        BhairabLandmark.calculateDistanceKm(_pickup.latitude, _pickup.longitude, p.latitude, p.longitude);

    return Scaffold(
      appBar: AppBar(title: Text(l.searchTitle)),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(CbSpace.gutter, 0, CbSpace.s, CbSpace.s),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    children: [
                      TextField(
                        controller: _pickupController,
                        focusNode: _pickupFocus,
                        autofocus: widget.editPickup,
                        decoration: InputDecoration(
                          hintText: l.searchPickupHint,
                          prefixIcon: const Center(
                            widthFactor: 1,
                            child: StatusDot(color: CbColors.brand, size: 10),
                          ),
                        ),
                        onChanged: (text) => setState(() => _query = text),
                      ),
                      const SizedBox(height: CbSpace.s),
                      TextField(
                        controller: _dropoffController,
                        focusNode: _dropoffFocus,
                        autofocus: !widget.editPickup,
                        decoration: InputDecoration(
                          hintText: l.homeWhereTo,
                          prefixIcon: const Center(
                            widthFactor: 1,
                            child: SizedBox(
                              width: 10,
                              height: 10,
                              child: DecoratedBox(decoration: BoxDecoration(color: CbColors.ink)),
                            ),
                          ),
                        ),
                        onChanged: (text) => setState(() => _query = text),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  tooltip: l.searchSwap,
                  onPressed: _dropoff == null ? null : _swap,
                  icon: const Icon(Icons.swap_vert),
                ),
              ],
            ),
          ),
          const Divider(),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: CbSpace.gutter, vertical: CbSpace.s),
              children: [
                PlaceRow(icon: Icons.map_outlined, title: l.searchOnMap, onTap: _chooseOnMap),
                if (recents.isNotEmpty) ...[
                  CbSectionLabel(l.homeRecent),
                  for (final p in recents)
                    PlaceRow(
                      icon: Icons.history,
                      title: placeName(context, p),
                      trailing: l.commonKm(fmtKm(km(p))),
                      onTap: () => _choose(p),
                    ),
                ],
                CbSectionLabel(l.homePlaces),
                for (final p in places)
                  PlaceRow(
                    icon: Icons.place_outlined,
                    title: placeName(context, p),
                    subtitle: isBangla(context) ? p.descriptionBangla : null,
                    trailing: l.commonKm(fmtKm(km(p))),
                    onTap: () => _choose(p),
                  ),
                if (places.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: CbSpace.l),
                    child: Text(l.searchNoResults(_query.trim()), style: Theme.of(context).textTheme.bodyMedium),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
