import 'package:cholo_ui/cholo_ui.dart';
import 'package:material_ui/material_ui.dart';

import '../../l10n/app_localizations.dart';

/// Full-screen trip request (Uber Driver / Careem Captain style): 60-second ring, route,
/// passenger's offer, accept, quick counter-offers, other amount, ignore.
class RequestTakeover extends StatefulWidget {
  const RequestTakeover({
    super.key,
    required this.passengerName,
    required this.pickupName,
    required this.dropoffName,
    required this.offerFare,
    required this.remainingSeconds,
    required this.totalSeconds,
    required this.lockedOut,
    required this.offerSent,
    required this.showError,
    required this.onBid,
    required this.onIgnore,
    required this.onReplay,
    required this.onTopUp,
    this.pickupKm,
    this.tripKm,
    this.sentAmount,
    this.onDemoAccept,
  });

  final String passengerName;
  final String pickupName;
  final String dropoffName;
  final double offerFare;
  final int remainingSeconds;
  final int totalSeconds;
  final double? pickupKm;
  final double? tripKm;

  /// Wallet below the minimum: bidding is disabled with a top-up link.
  final bool lockedOut;
  final bool offerSent;
  final double? sentAmount;
  final bool showError;
  final void Function(double amount, int etaMinutes) onBid;
  final VoidCallback onIgnore;
  final VoidCallback onReplay;
  final VoidCallback onTopUp;

  /// Demo builds only.
  final VoidCallback? onDemoAccept;

  @override
  State<RequestTakeover> createState() => _RequestTakeoverState();
}

class _RequestTakeoverState extends State<RequestTakeover> {
  int _eta = 3;

  Future<void> _otherAmount() async {
    final l = AppLocalizations.of(context);
    final min = widget.offerFare.round();
    var amount = min + 10;
    final send = await showModalBottomSheet<bool>(
      context: context,
      builder: (sheetContext) => StatefulBuilder(
        builder: (sheetContext, setSheet) => SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(CbSpace.gutter, 0, CbSpace.gutter, CbSpace.l),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(l.reqYourFare, style: Theme.of(sheetContext).textTheme.titleLarge),
                const SizedBox(height: CbSpace.l),
                MoneyStepper(
                  value: amount,
                  min: min,
                  onChanged: (v) => setSheet(() => amount = v),
                  decreaseLabel: l.commonLower,
                  increaseLabel: l.commonRaise,
                ),
                const SizedBox(height: CbSpace.l),
                FilledButton(
                  onPressed: () => Navigator.pop(sheetContext, true),
                  child: Text(l.reqSend(fmtMoney(amount))),
                ),
              ],
            ),
          ),
        ),
      ),
    );
    if (send == true) widget.onBid(amount.toDouble(), _eta);
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    final fare = widget.offerFare;
    final canBid = !widget.lockedOut;

    return Material(
      color: CbColors.surface,
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(CbSpace.gutter, CbSpace.l, CbSpace.gutter, CbSpace.xl),
          children: [
            Row(
              children: [
                _CountdownRing(
                  seconds: widget.remainingSeconds,
                  total: widget.totalSeconds,
                  label: l.reqSecondsLeft('${widget.remainingSeconds}'),
                ),
                const SizedBox(width: CbSpace.l),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(l.reqNewTrip, style: text.labelMedium),
                      Text(widget.passengerName, maxLines: 2, overflow: TextOverflow.ellipsis, style: text.titleLarge),
                    ],
                  ),
                ),
                IconButton(tooltip: l.reqReplay, onPressed: widget.onReplay, icon: const Icon(Icons.volume_up_outlined)),
              ],
            ),
            const SizedBox(height: CbSpace.l),
            RouteStops(
              pickupLabel: widget.pickupKm == null ? l.reqPickup : l.reqPickupAway(fmtKm(widget.pickupKm!)),
              pickup: widget.pickupName,
              dropoffLabel: widget.tripKm == null ? l.reqDropoff : l.reqDropoffTrip(fmtKm(widget.tripKm!)),
              dropoff: widget.dropoffName,
            ),
            const SizedBox(height: CbSpace.l),
            Row(
              children: [
                Expanded(child: Text(l.reqOffer, style: text.bodyMedium)),
                Text(fmtMoney(fare), style: cbMoneyStyle(40)),
              ],
            ),
            const SizedBox(height: CbSpace.l),
            if (widget.offerSent) ..._sentState(l, text) else ..._openState(l, text, fare, canBid),
          ],
        ),
      ),
    );
  }

  List<Widget> _sentState(AppLocalizations l, TextTheme text) => [
        Text(l.reqSent(fmtMoney(widget.sentAmount ?? widget.offerFare)), style: text.titleMedium),
        const SizedBox(height: CbSpace.xs),
        Text(widget.remainingSeconds == 0 ? l.reqExpired : l.reqSentHint, style: text.bodyMedium),
        const SizedBox(height: CbSpace.l),
        if (widget.onDemoAccept != null)
          TextButton(onPressed: widget.onDemoAccept, child: Text(l.reqDemoAccept)),
        OutlinedButton(onPressed: widget.onIgnore, child: Text(l.commonClose)),
      ];

  List<Widget> _openState(AppLocalizations l, TextTheme text, double fare, bool canBid) => [
        Text(l.reqEta, style: text.labelMedium),
        const SizedBox(height: CbSpace.s),
        SegmentedButton<int>(
          showSelectedIcon: false,
          segments: [
            for (final m in const [2, 3, 5]) ButtonSegment(value: m, label: Text(l.commonMinutes('$m'))),
          ],
          selected: {_eta},
          onSelectionChanged: (value) => setState(() => _eta = value.first),
        ),
        const SizedBox(height: CbSpace.l),
        if (widget.lockedOut)
          Padding(
            padding: const EdgeInsets.only(bottom: CbSpace.m),
            child: CbBanner(
              tone: CbTone.danger,
              icon: Icons.lock_outline,
              message: l.reqLocked,
              actionLabel: l.lockTopup(fmtMoney(100)),
              onAction: widget.onTopUp,
            ),
          )
        else if (widget.showError)
          Padding(
            padding: const EdgeInsets.only(bottom: CbSpace.m),
            child: Text(l.reqError, style: text.bodyMedium?.copyWith(color: CbColors.danger)),
          ),
        FilledButton(
          onPressed: canBid ? () => widget.onBid(fare, _eta) : null,
          child: Text(l.reqAccept(fmtMoney(fare))),
        ),
        const SizedBox(height: CbSpace.l),
        Text(l.reqCounter, style: text.labelMedium),
        const SizedBox(height: CbSpace.s),
        Row(
          children: [
            for (final (i, extra) in const [10, 20, 30].indexed) ...[
              if (i > 0) const SizedBox(width: CbSpace.s),
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(0, 56),
                    padding: const EdgeInsets.symmetric(horizontal: CbSpace.xs),
                    side: const BorderSide(color: CbColors.warning),
                  ),
                  onPressed: canBid ? () => widget.onBid(fare + extra, _eta) : null,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(fmtMoney(fare + extra), style: cbMoneyStyle(17)),
                      Text('+$extra', style: cbMoneyStyle(13, color: CbColors.warning, weight: FontWeight.w500)),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: CbSpace.s),
        Wrap(
          alignment: WrapAlignment.spaceBetween,
          children: [
            TextButton(onPressed: canBid ? _otherAmount : null, child: Text(l.reqOther)),
            TextButton(
              style: TextButton.styleFrom(foregroundColor: CbColors.ink2),
              onPressed: widget.onIgnore,
              child: Text(l.reqIgnore),
            ),
          ],
        ),
      ];
}

/// 60-second ring: brand colour, warning colour in the last 15 seconds. Updates once a second.
class _CountdownRing extends StatelessWidget {
  const _CountdownRing({required this.seconds, required this.total, required this.label});

  final int seconds;
  final int total;
  final String label;

  @override
  Widget build(BuildContext context) {
    final urgent = seconds <= 15;
    return Semantics(
      label: label,
      excludeSemantics: true,
      child: SizedBox(
        width: 88,
        height: 88,
        child: Stack(
          fit: StackFit.expand,
          children: [
            CircularProgressIndicator(
              value: total == 0 ? 0 : seconds / total,
              strokeWidth: 6,
              backgroundColor: CbColors.line,
              color: urgent ? CbColors.warning : CbColors.brand,
            ),
            Center(child: Text('$seconds', style: cbMoneyStyle(24))),
          ],
        ),
      ),
    );
  }
}
