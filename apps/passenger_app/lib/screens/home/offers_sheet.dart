import 'package:cholo_ui/cholo_ui.dart';
import 'package:material_ui/material_ui.dart';

import '../../l10n/app_localizations.dart';
import '../../models/passenger_models.dart';
import '../../widgets/labels.dart';

/// Home panel while drivers respond: the passenger's offer, then driver offers to accept or decline.
class OffersSheet extends StatelessWidget {
  const OffersSheet({
    super.key,
    required this.offerFare,
    required this.vehicleType,
    required this.bids,
    required this.sortByEta,
    required this.onSortChanged,
    required this.onAccept,
    required this.onDecline,
    required this.onCancel,
    required this.onRaise,
  });

  final int offerFare;
  final String vehicleType;

  /// Lowest price first (as provided by the socket service).
  final List<DriverBidModel> bids;
  final bool sortByEta;
  final ValueChanged<bool> onSortChanged;
  final ValueChanged<DriverBidModel> onAccept;
  final ValueChanged<DriverBidModel> onDecline;
  final VoidCallback onCancel;
  final VoidCallback onRaise;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    final sorted = [...bids];
    if (sortByEta) {
      sorted.sort((a, b) {
        final eta = a.etaMinutes.compareTo(b.etaMinutes);
        return eta != 0 ? eta : a.bidAmount.compareTo(b.bidAmount);
      });
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(child: Text(l.offersFinding, style: text.titleLarge)),
            TextButton(onPressed: onCancel, child: Text(l.commonCancel)),
          ],
        ),
        Text(l.offersYourOffer(fmtMoney(offerFare), vehicleLabel(l, vehicleType)), style: text.bodyMedium),
        const SizedBox(height: CbSpace.m),
        Align(
          alignment: AlignmentDirectional.centerStart,
          child: OutlinedButton(
            onPressed: onRaise,
            child: Text(l.offersRaise(fmtMoney(offerFare + 5))),
          ),
        ),
        if (!reduceMotion) ...[
          const SizedBox(height: CbSpace.m),
          const LinearProgressIndicator(minHeight: 2),
        ],
        const SizedBox(height: CbSpace.l),
        if (sorted.isEmpty)
          Text(l.offersEmpty, style: text.bodyMedium)
        else ...[
          // Wrap: the sort switch drops below the count on narrow phones or large text.
          Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: CbSpace.s,
            runSpacing: CbSpace.s,
            children: [
              Text(l.offersCount('${sorted.length}'), style: text.titleSmall),
              if (sorted.length >= 2)
                SegmentedButton<bool>(
                  showSelectedIcon: false,
                  segments: [
                    ButtonSegment(value: false, label: Text(l.offersSortPrice)),
                    ButtonSegment(value: true, label: Text(l.offersSortEta)),
                  ],
                  selected: {sortByEta},
                  onSelectionChanged: (value) => onSortChanged(value.first),
                ),
            ],
          ),
          const SizedBox(height: CbSpace.s),
          for (final bid in sorted)
            Padding(
              padding: const EdgeInsets.only(bottom: CbSpace.s),
              child: OfferCard(
                bid: bid,
                offerFare: offerFare,
                onAccept: () => onAccept(bid),
                onDecline: () => onDecline(bid),
              ),
            ),
        ],
      ],
    );
  }
}

/// One driver's offer.
class OfferCard extends StatelessWidget {
  const OfferCard({
    super.key,
    required this.bid,
    required this.offerFare,
    required this.onAccept,
    required this.onDecline,
  });

  final DriverBidModel bid;
  final int offerFare;
  final VoidCallback onAccept;
  final VoidCallback onDecline;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    final diff = bid.bidAmount - offerFare;
    return Container(
      padding: const EdgeInsets.all(CbSpace.m),
      decoration: BoxDecoration(
        color: CbColors.surface,
        borderRadius: BorderRadius.circular(CbRadius.control),
        border: Border.all(color: CbColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CbAvatar(name: bid.driverName, size: 40),
              const SizedBox(width: CbSpace.m),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            bid.driverName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: text.titleSmall,
                          ),
                        ),
                        const SizedBox(width: CbSpace.xs),
                        const Icon(Icons.star_rounded, size: 16, color: CbColors.warning),
                        Text(bid.ratingAvg.toStringAsFixed(1), style: text.labelMedium),
                        if (bid.isSimulated) ...[
                          const SizedBox(width: CbSpace.s),
                          _DemoTag(label: l.commonDemo),
                        ],
                      ],
                    ),
                    Text(
                      '${bid.vehicleModel} · ${l.offersMinAway('${bid.etaMinutes}')}',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: text.bodySmall,
                    ),
                    if (diff <= 0)
                      Text(l.offersMatches, style: text.labelMedium?.copyWith(color: CbColors.brand)),
                  ],
                ),
              ),
              const SizedBox(width: CbSpace.s),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(fmtMoney(bid.bidAmount), style: cbMoneyStyle(20)),
                  if (diff > 0) Text('+${fmtMoney(diff)}', style: cbMoneyStyle(13, color: CbColors.warning)),
                ],
              ),
            ],
          ),
          const SizedBox(height: CbSpace.s),
          Row(
            children: [
              TextButton(
                style: TextButton.styleFrom(foregroundColor: CbColors.ink2),
                onPressed: onDecline,
                child: Text(l.offersDecline),
              ),
              const SizedBox(width: CbSpace.s),
              Expanded(
                child: FilledButton(
                  style: FilledButton.styleFrom(minimumSize: const Size(0, 48)),
                  onPressed: onAccept,
                  child: Text(l.offersAccept),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _DemoTag extends StatelessWidget {
  const _DemoTag({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
        decoration: BoxDecoration(color: CbColors.raised, borderRadius: BorderRadius.circular(999)),
        child: Text(label, style: Theme.of(context).textTheme.labelSmall),
      );
}
