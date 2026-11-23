import 'dart:math' as math;

import 'package:cholo_ui/cholo_ui.dart';
import 'package:material_ui/material_ui.dart';

import '../../l10n/app_localizations.dart';
import '../../models/passenger_models.dart';
import '../../widgets/labels.dart';

/// Home panel after a destination is chosen: vehicle choice, fare offer, "Find drivers".
///
/// Give it a key per route: the passenger's own offer survives new fare estimates and only
/// resets when the vehicle or the route changes.
class OptionsSheet extends StatefulWidget {
  const OptionsSheet({
    super.key,
    required this.pickupName,
    required this.dropoffName,
    required this.distanceKm,
    required this.options,
    required this.estimating,
    required this.onChangeRoute,
    required this.onRequest,
  });

  final String pickupName;
  final String dropoffName;
  final double distanceKm;
  final List<VehicleOption> options;
  final bool estimating;
  final VoidCallback onChangeRoute;
  final void Function(VehicleOption vehicle, int fare) onRequest;

  @override
  State<OptionsSheet> createState() => _OptionsSheetState();
}

class _OptionsSheetState extends State<OptionsSheet> {
  String _type = 'EASYBIKE';
  int? _override;

  VehicleOption get _selected =>
      widget.options.firstWhere((o) => o.type == _type, orElse: () => widget.options.first);

  int get _offer => math.max(_selected.minFare, _override ?? _selected.suggestedFare);

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    final selected = _selected;
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: RouteStops(
                pickupLabel: l.tripPickup,
                pickup: widget.pickupName,
                dropoffLabel: l.tripDropoff,
                dropoff: widget.dropoffName,
                maxLines: 1,
              ),
            ),
            IconButton(
              tooltip: l.optionsChangeRoute,
              onPressed: widget.onChangeRoute,
              icon: const Icon(Icons.edit_outlined),
            ),
          ],
        ),
        const SizedBox(height: CbSpace.s),
        Text(
          l.optionsTripSummary(fmtKm(widget.distanceKm), '${selected.etaMinutes}'),
          style: text.bodySmall,
        ),
        const SizedBox(height: CbSpace.m),
        if (widget.estimating)
          Padding(
            padding: const EdgeInsets.only(bottom: CbSpace.s),
            child: Semantics(
              label: l.optionsEstimating,
              child: const LinearProgressIndicator(minHeight: 2),
            ),
          ),
        for (final option in widget.options)
          Padding(
            padding: const EdgeInsets.only(bottom: CbSpace.s),
            child: _VehicleRow(
              option: option,
              name: vehicleLabel(l, option.type),
              selected: option.type == selected.type,
              onTap: () => setState(() {
                _type = option.type;
                _override = null;
              }),
            ),
          ),
        const SizedBox(height: CbSpace.s),
        Text(l.optionsYourOffer, style: text.labelMedium),
        const SizedBox(height: CbSpace.xs),
        MoneyStepper(
          value: _offer,
          min: selected.minFare,
          onChanged: (value) => setState(() => _override = value),
          decreaseLabel: l.optionsLower,
          increaseLabel: l.optionsRaise,
        ),
        const SizedBox(height: CbSpace.xs),
        Text(
          l.optionsOfferHint(fmtMoney(selected.suggestedFare), fmtMoney(selected.minFare)),
          textAlign: TextAlign.center,
          style: text.bodySmall,
        ),
        const SizedBox(height: CbSpace.l),
        FilledButton(
          onPressed: () => widget.onRequest(selected, _offer),
          child: Text(l.optionsFindDrivers(fmtMoney(_offer))),
        ),
      ],
    );
  }
}

class _VehicleRow extends StatelessWidget {
  const _VehicleRow({required this.option, required this.name, required this.selected, required this.onTap});

  final VehicleOption option;
  final String name;
  final bool selected;
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
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 64),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: CbSpace.m, vertical: CbSpace.s),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: const BoxDecoration(color: CbColors.raised, shape: BoxShape.circle),
                    child: Icon(cbVehicleIcon(option.type), color: CbColors.vehicle(option.type)),
                  ),
                  const SizedBox(width: CbSpace.m),
                  Expanded(
                    child: Text(name, maxLines: 1, overflow: TextOverflow.ellipsis, style: text.titleSmall),
                  ),
                  const SizedBox(width: CbSpace.s),
                  Text(fmtMoney(option.suggestedFare), style: cbMoneyStyle(18)),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
