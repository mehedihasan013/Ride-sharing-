import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/passenger_models.dart';
import '../services/passenger_socket_service.dart';

/// Displays live incoming driver counter-bids sorted by price or ETA during InDrive negotiation.
/// Can be rendered inline on the Ride Booking screen or opened as a modal bottom sheet.
class BiddingBottomSheet extends StatefulWidget {
  final VoidCallback? onBidAccepted;
  final VoidCallback? onCancelSearch;

  /// True inside the fixed-height modal: the bid list fills the free space.
  /// Keep false when placed inside a scroll view (unbounded height).
  final bool expandList;

  const BiddingBottomSheet({
    super.key,
    this.onBidAccepted,
    this.onCancelSearch,
    this.expandList = false,
  });

  /// Helper to present the live bidding feed as a modal bottom sheet.
  static Future<void> show(
    BuildContext context, {
    VoidCallback? onBidAccepted,
    VoidCallback? onCancelSearch,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => FractionallySizedBox(
        heightFactor: 0.72,
        child: Container(
          decoration: const BoxDecoration(
            color: Color(0xFF0B131E),
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.all(16),
          child: BiddingBottomSheet(
            expandList: true,
            onBidAccepted: () {
              Navigator.of(context).pop();
              onBidAccepted?.call();
            },
            onCancelSearch: () {
              Navigator.of(context).pop();
              onCancelSearch?.call();
            },
          ),
        ),
      ),
    );
  }

  @override
  State<BiddingBottomSheet> createState() => _BiddingBottomSheetState();
}

class _BiddingBottomSheetState extends State<BiddingBottomSheet> {
  bool _sortByEta = false;

  Widget _sizedBidList(Widget list) => widget.expandList
      ? Flexible(child: list)
      : ConstrainedBox(
          constraints: const BoxConstraints(maxHeight: 330),
          child: list,
        );

  @override
  Widget build(BuildContext context) {
    final socketService = context.watch<PassengerSocketService>();
    final activeRide = socketService.activeRide;
    final rawBids = socketService.incomingBids;

    final sortedBids = List<DriverBidModel>.from(rawBids);
    if (_sortByEta) {
      sortedBids.sort((a, b) {
        final etaCmp = a.etaMinutes.compareTo(b.etaMinutes);
        if (etaCmp != 0) return etaCmp;
        return a.bidAmount.compareTo(b.bidAmount);
      });
    } else {
      sortedBids.sort((a, b) {
        final priceCmp = a.bidAmount.compareTo(b.bidAmount);
        if (priceCmp != 0) return priceCmp;
        return a.etaMinutes.compareTo(b.etaMinutes);
      });
    }

    final passengerOffer = activeRide?.initialOfferFare ?? 80;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF111C2D),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: const Color(0xFFF59E0B).withOpacity(0.45),
          width: 1.4,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.35),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header Row
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B).withOpacity(0.18),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.gavel_rounded,
                  color: Color(0xFFF59E0B),
                  size: 20,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      sortedBids.isEmpty
                          ? 'ভৈরবের নিকটস্থ চালকদের বিড খোঁজা হচ্ছে...'
                          : 'লাইভ চালকের প্রস্তাবসমূহ (${sortedBids.length}টি বিড)',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15.5,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'আপনার প্রস্তাবিত ভাড়া: ৳$passengerOffer • পছন্দের চালক বেছে নিন',
                      style: const TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              if (widget.onCancelSearch != null)
                TextButton(
                  onPressed: () {
                    socketService.resetRide();
                    widget.onCancelSearch?.call();
                  },
                  child: const Text(
                    'বাতিল',
                    style: TextStyle(
                      color: Color(0xFFF42A41),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
            ],
          ),

          const SizedBox(height: 12),

          // Sort Filter Chips
          Row(
            children: [
              const Text(
                'সাজান:',
                style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
              ),
              const SizedBox(width: 8),
              ChoiceChip(
                label: const Text('সর্বনিম্ন ভাড়া (Price)'),
                selected: !_sortByEta,
                onSelected: (_) => setState(() => _sortByEta = false),
                selectedColor: const Color(0xFF006A4E),
                backgroundColor: const Color(0xFF0B131E),
                labelStyle: TextStyle(
                  color: !_sortByEta ? Colors.white : const Color(0xFF94A3B8),
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(width: 8),
              ChoiceChip(
                label: const Text('দ্রুততম সময় (ETA)'),
                selected: _sortByEta,
                onSelected: (_) => setState(() => _sortByEta = true),
                selectedColor: const Color(0xFF006A4E),
                backgroundColor: const Color(0xFF0B131E),
                labelStyle: TextStyle(
                  color: _sortByEta ? Colors.white : const Color(0xFF94A3B8),
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          if (sortedBids.isEmpty)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 16),
              decoration: BoxDecoration(
                color: const Color(0xFF0B131E),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Column(
                children: [
                  SizedBox(
                    width: 28,
                    height: 28,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      color: Color(0xFFF59E0B),
                    ),
                  ),
                  SizedBox(height: 12),
                  Text(
                    'নিকটস্থ ইজিবাইক, সিএনজি ও বাইক চালকদের কাছে ভয়েস অ্যালার্ট পাঠানো হয়েছে...',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Color(0xFFCBD5E1),
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            )
          else
            _sizedBidList(
              ListView.separated(
                shrinkWrap: true,
                itemCount: sortedBids.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final bid = sortedBids[index];
                  final diff = bid.bidAmount - passengerOffer;
                  final isExactMatch = diff <= 0;

                  return Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0B131E),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: isExactMatch
                            ? const Color(0xFF006A4E)
                            : const Color(0xFF334155),
                        width: 1.3,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Driver Avatar
                            CircleAvatar(
                              radius: 21,
                              backgroundColor:
                                  const Color(0xFF006A4E).withOpacity(0.25),
                              child: const Text(
                                '🧑‍✈️',
                                style: TextStyle(fontSize: 20),
                              ),
                            ),
                            const SizedBox(width: 12),
                            // Driver Details
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Flexible(
                                        child: Text(
                                          bid.driverName,
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 15,
                                            fontWeight: FontWeight.bold,
                                          ),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 6,
                                          vertical: 2,
                                        ),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFF59E0B)
                                              .withOpacity(0.2),
                                          borderRadius:
                                              BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          '${bid.ratingAvg.toStringAsFixed(1)} ★',
                                          style: const TextStyle(
                                            color: Color(0xFFF59E0B),
                                            fontSize: 11.5,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    bid.vehicleModel,
                                    style: const TextStyle(
                                      color: Color(0xFF94A3B8),
                                      fontSize: 12.5,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  // Wrap: the offer badge drops to a new line on narrow cards instead of being cut off
                                  Wrap(
                                    spacing: 10,
                                    runSpacing: 2,
                                    crossAxisAlignment: WrapCrossAlignment.center,
                                    children: [
                                      Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const Icon(
                                            Icons.access_time_filled,
                                            size: 13,
                                            color: Color(0xFF34D399),
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            'পৌঁছাতে সময়: ${bid.etaMinutes} মিনিট',
                                            style: const TextStyle(
                                              color: Color(0xFF34D399),
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ],
                                      ),
                                      Text(
                                        isExactMatch
                                            ? '✓ আপনার প্রস্তাবে রাজি'
                                            : '+৳$diff পাল্টা প্রস্তাব',
                                        style: TextStyle(
                                          color: isExactMatch
                                              ? const Color(0xFF6EE7B7)
                                              : const Color(0xFFF59E0B),
                                          fontSize: 11.5,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            // Bid Amount Pill
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '৳${bid.bidAmount}',
                                  style: const TextStyle(
                                    color: Color(0xFFF59E0B),
                                    fontSize: 22,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                                const Text(
                                  'নগদ ভাড়া',
                                  style: TextStyle(
                                    color: Color(0xFF64748B),
                                    fontSize: 10.5,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        // Accept Bid CTA Button
                        SizedBox(
                          width: double.infinity,
                          height: 42,
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF006A4E),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                            onPressed: () {
                              socketService.acceptBid(bid);
                              widget.onBidAccepted?.call();
                            },
                            icon: const Icon(
                              Icons.check_circle_outline,
                              size: 18,
                            ),
                            label: Text(
                              '✓ গ্রহণ করুন (Accept Bid • ৳${bid.bidAmount})',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 13.5,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}
