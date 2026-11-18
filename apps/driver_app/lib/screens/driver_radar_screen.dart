import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/driver_models.dart';
import '../services/bangla_voice_service.dart';
import '../services/driver_socket_service.dart';

class DriverRadarScreen extends StatefulWidget {
  final VoidCallback? onOpenWalletTab;

  const DriverRadarScreen({super.key, this.onOpenWalletTab});

  @override
  State<DriverRadarScreen> createState() => _DriverRadarScreenState();
}

class _DriverRadarScreenState extends State<DriverRadarScreen> {
  double _customBidIncrement = 10.0;
  int _selectedEtaMinutes = 3;

  Future<void> _showEarningsSummaryDialog(
    BuildContext context,
    CompletedRideSummary summary,
    double remainingBalance,
  ) async {
    final netEarnings = summary.cashCollected - summary.commissionDeductedBdt;
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF006A4E).withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.check_circle,
                color: Color(0xFF006A4E),
                size: 28,
              ),
            ),
            const SizedBox(width: 10),
            const Expanded(
              child: Text(
                'ট্রিপ সম্পন্ন ও নগদ হিসাব',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFF006A4E).withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: const Color(0xFF006A4E).withOpacity(0.3),
                ),
              ),
              child: Column(
                children: [
                  const Text(
                    'যাত্রীর কাছ থেকে নগদ গ্রহণ করুন',
                    style: TextStyle(fontSize: 13, color: Colors.black87),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '৳${summary.cashCollected.toStringAsFixed(0)}',
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF006A4E),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            _buildSummaryRow(
              'মোট নির্ধারিত ভাড়া (Cash)',
              '৳${summary.cashCollected.toStringAsFixed(0)}',
              isBold: true,
            ),
            const Divider(height: 16),
            _buildSummaryRow(
              'চলো ভৈরব প্ল্যাটফর্ম কমিশন (৮%)',
              '-৳${summary.commissionDeductedBdt.toStringAsFixed(0)}',
              valueColor: const Color(0xFFF42A41),
            ),
            const Divider(height: 16),
            _buildSummaryRow(
              'আপনার নিট আয় (Net Driver Take)',
              '৳${netEarnings.toStringAsFixed(0)}',
              valueColor: const Color(0xFF006A4E),
              isBold: true,
            ),
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'হালনাগাদ প্রিপেইড ওয়ালেট ব্যালেন্স: ৳${remainingBalance.toStringAsFixed(2)}',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        actions: [
          FilledButton.icon(
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFF006A4E),
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.of(ctx).pop(),
            icon: const Icon(Icons.done_all),
            label: const Text('ধন্যবাদ, পরবর্তী ট্রিপে যান'),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(
    String label,
    String value, {
    Color? valueColor,
    bool isBold = false,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 15,
            fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
            color: valueColor ?? Colors.black87,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final socketService = context.watch<DriverSocketService>();
    final voiceService = context.watch<BanglaVoiceService>();
    final profile = socketService.profile;
    final wallet = socketService.wallet;
    final opportunity = socketService.currentOpportunity;
    final activeTrip = socketService.activeTrip;

    return RefreshIndicator(
      onRefresh: () async {
        await socketService.refreshWallet();
        await socketService.refreshLandmarks();
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // 1. Online / Offline Master Switch & Socket Status Card
          _buildMasterOnlineCard(socketService, profile, wallet),
          const SizedBox(height: 12),

          // 2. Low-balance Lockout Alert Banner (< 50 BDT)
          if (wallet.isLockedOut) ...[
            _buildLowBalanceLockoutBanner(context, socketService),
            const SizedBox(height: 12),
          ],

          // 3. Active Voice Waveform Banner (when speaking)
          if (voiceService.isSpeaking &&
              voiceService.activePromptBangla != null) ...[
            _buildSpeakingBanner(voiceService),
            const SizedBox(height: 12),
          ],

          // 4. Current Bhairab Station / Hub Position Selector + Live GPS Ping
          _buildBhairabHubSelectorCard(context, socketService, profile),
          const SizedBox(height: 14),

          // 5. Active Trip & Cash Collection Panel (when driver:bid_won arrives)
          if (activeTrip != null)
            _buildActiveTripPanel(context, socketService, activeTrip)
          // 6. Incoming Ride Opportunity & InDrive Counter-Bidding Card
          else if (opportunity != null && socketService.isOnline)
            _buildIncomingOpportunityCard(
              context,
              socketService,
              voiceService,
              opportunity,
            )
          else
            _buildWaitingForRideCard(socketService),
        ],
      ),
    );
  }

  Widget _buildMasterOnlineCard(
    DriverSocketService socketService,
    DriverProfileModel profile,
    DriverWalletModel wallet,
  ) {
    final isOnline = socketService.isOnline;
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: isOnline
              ? const Color(0xFF006A4E).withOpacity(0.4)
              : Colors.grey.shade300,
          width: 1.5,
        ),
      ),
      color: isOnline ? const Color(0xFFEFFAF5) : Colors.grey.shade100,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isOnline ? '🟢 আপনি অনলাইন আছেন' : '⚪ অফলাইন',
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                          color: isOnline
                              ? const Color(0xFF006A4E)
                              : Colors.grey.shade800,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        socketService.statusBannerBangla,
                        style: TextStyle(
                          fontSize: 12.5,
                          color: Colors.grey.shade800,
                        ),
                      ),
                    ],
                  ),
                ),
                Switch(
                  value: isOnline,
                  activeColor: const Color(0xFF006A4E),
                  onChanged: socketService.toggleOnlineStatus,
                ),
              ],
            ),
            const Divider(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                Chip(
                  visualDensity: VisualDensity.compact,
                  avatar: Icon(
                    socketService.isSocketConnected
                        ? Icons.wifi_tethering
                        : Icons.phonelink_setup,
                    size: 16,
                    color: socketService.isSocketConnected
                        ? const Color(0xFF006A4E)
                        : Colors.orange.shade800,
                  ),
                  label: Text(
                    socketService.isSocketConnected
                        ? 'লাইভ সার্ভার সংযুক্ত (${socketService.serverUrl})'
                        : 'সিমুলেশন রেডি (${socketService.serverUrl})',
                    style: const TextStyle(fontSize: 11.5),
                  ),
                ),
                Chip(
                  visualDensity: VisualDensity.compact,
                  avatar: const Icon(
                    Icons.electric_rickshaw,
                    size: 16,
                    color: Color(0xFF006A4E),
                  ),
                  label: Text(
                    '${profile.driverName} • ${profile.vehicleTypeBangla}',
                    style: const TextStyle(fontSize: 11.5),
                  ),
                ),
                ActionChip(
                  visualDensity: VisualDensity.compact,
                  backgroundColor: wallet.isLockedOut
                      ? const Color(0xFFF42A41).withOpacity(0.12)
                      : const Color(0xFF006A4E).withOpacity(0.12),
                  avatar: Icon(
                    wallet.isLockedOut ? Icons.lock : Icons.account_balance_wallet,
                    size: 15,
                    color: wallet.isLockedOut
                        ? const Color(0xFFF42A41)
                        : const Color(0xFF006A4E),
                  ),
                  label: Text(
                    'ব্যালেন্স: ৳${wallet.currentBalance.toStringAsFixed(0)} (টেস্ট মোড পরিবর্তন)',
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.bold,
                      color: wallet.isLockedOut
                          ? const Color(0xFFF42A41)
                          : const Color(0xFF006A4E),
                    ),
                  ),
                  onPressed: () {
                    socketService.toggleLowBalanceDemoMode();
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLowBalanceLockoutBanner(
    BuildContext context,
    DriverSocketService socketService,
  ) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFEECEE),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFF42A41), width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.lock_clock, color: Color(0xFFF42A41), size: 22),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  '🔒 আপনার ব্যালেন্স ৫০ টাকার নিচে! বিড করতে বিকাশ রিচার্জ করুন',
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 14,
                    color: Color(0xFFB91C1C),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'বর্তমান ব্যালেন্স: ৳${socketService.wallet.currentBalance.toStringAsFixed(0)}। নতুন রাইডে বিড বা পাল্টা ভাড়া পাঠাতে ন্যূনতম ৳৫০ ব্যালেন্স থাকতে হবে।',
            style: const TextStyle(fontSize: 12.5, color: Colors.black87),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFE2136E),
                  foregroundColor: Colors.white,
                ),
                onPressed: () async {
                  await socketService.topupWallet(
                    amountBdt: 100,
                    method: 'BKASH',
                  );
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text(
                          '✓ বিকাশ +৳১০০ রিচার্জ সফল! বিডিং আনলক হয়েছে।',
                        ),
                        backgroundColor: Color(0xFF006A4E),
                      ),
                    );
                  }
                },
                icon: const Icon(Icons.bolt, size: 18),
                label: const Text('১-ট্যাপ বিকাশ +৳১০০ রিচার্জ'),
              ),
              const SizedBox(width: 8),
              if (widget.onOpenWalletTab != null)
                TextButton(
                  onPressed: widget.onOpenWalletTab,
                  child: const Text('ওয়ালেট ট্যাবে যান →'),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSpeakingBanner(BanglaVoiceService voiceService) {
    final bars = voiceService.currentWaveformHeights;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF0B131E),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Icon(Icons.volume_up, color: Color(0xFFF59E0B), size: 22),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              voiceService.activePromptBangla ?? '',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(width: 8),
           Row(
            mainAxisSize: MainAxisSize.min,
            children: bars
                .map(
                  (h) => Container(
                    width: 3.5,
                    height: 22 * h,
                    margin: const EdgeInsets.symmetric(horizontal: 1.5),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildBhairabHubSelectorCard(
    BuildContext context,
    DriverSocketService socketService,
    DriverProfileModel profile,
  ) {
    final landmarks = socketService.landmarks;
    final selected = socketService.selectedLandmark;

    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.location_on, color: Color(0xFF006A4E), size: 20),
                    SizedBox(width: 6),
                    Text(
                      'ভৈরব স্ট্যান্ড / বর্তমান অবস্থান (GPS Hub)',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    visualDensity: VisualDensity.compact,
                    foregroundColor: const Color(0xFF006A4E),
                  ),
                  onPressed: () {
                    socketService.emitUpdateLocation();
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        duration: const Duration(seconds: 2),
                        content: Text(
                          '📍 লাইভ জিপিএস পিং পাঠানো হয়েছে (${profile.lat.toStringAsFixed(4)}, ${profile.lng.toStringAsFixed(4)})',
                        ),
                      ),
                    );
                  },
                  icon: const Icon(Icons.my_location, size: 15),
                  label: Text('লাইভ GPS পিং (#${socketService.gpsPingCount})'),
                ),
              ],
            ),
            const SizedBox(height: 10),
            DropdownButtonFormField<String>(
              value: landmarks.any((l) => l.id == selected.id)
                  ? selected.id
                  : landmarks.first.id,
              decoration: InputDecoration(
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 10,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                filled: true,
                fillColor: Colors.grey.shade50,
              ),
              items: landmarks
                  .map(
                    (l) => DropdownMenuItem<String>(
                      value: l.id,
                      child: Text(
                        '${l.banglaName} • ${l.englishName}',
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 13),
                      ),
                    ),
                  )
                  .toList(),
              onChanged: (val) {
                if (val == null) return;
                final found = landmarks.firstWhere(
                  (l) => l.id == val,
                  orElse: () => landmarks.first,
                );
                socketService.selectBhairabLandmark(found);
              },
            ),
            const SizedBox(height: 6),
            Text(
              'স্থানাঙ্ক: ${profile.lat.toStringAsFixed(4)}° N, ${profile.lng.toStringAsFixed(4)}° E • ${selected.descriptionBangla}',
              style: TextStyle(fontSize: 11.5, color: Colors.grey.shade700),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildIncomingOpportunityCard(
    BuildContext context,
    DriverSocketService socketService,
    BanglaVoiceService voiceService,
    IncomingRideOpportunity opp,
  ) {
    final baseOffer = opp.initialOfferFare;
    final customFare = baseOffer + _customBidIncrement;
    final remaining = socketService.opportunityRemainingSeconds;

    return Card(
      elevation: 3,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: const BorderSide(color: Color(0xFF006A4E), width: 2),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header row: badge + countdown timer
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFF006A4E),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.notifications_active,
                        color: Colors.white,
                        size: 15,
                      ),
                      SizedBox(width: 5),
                      Text(
                        'নতুন ট্রিপ অফার (InDrive বিডিং)',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: remaining <= 15
                        ? const Color(0xFFFEECEE)
                        : const Color(0xFFFFFBEB),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: remaining <= 15
                          ? const Color(0xFFF42A41)
                          : const Color(0xFFF59E0B),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.timer_outlined,
                        size: 15,
                        color: remaining <= 15
                            ? const Color(0xFFF42A41)
                            : const Color(0xFFD97706),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '$remaining সেকেন্ড বাকি',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                          color: remaining <= 15
                              ? const Color(0xFFF42A41)
                              : const Color(0xFFD97706),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Passenger & Offered Fare Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      CircleAvatar(
                        backgroundColor:
                            const Color(0xFF006A4E).withOpacity(0.12),
                        child: const Icon(
                          Icons.person,
                          color: Color(0xFF006A4E),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              opp.passengerName,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 15.5,
                              ),
                            ),
                            const Text(
                              'নগদ পেমেন্ট (Cash Ride • ভৈরব)',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.black54,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFF006A4E).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      const Text(
                        'যাত্রীর প্রস্তাবিত ভাড়া',
                        style: TextStyle(fontSize: 11, color: Colors.black54),
                      ),
                      Text(
                        '৳${baseOffer.toStringAsFixed(0)}',
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF006A4E),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Pickup -> Dropoff Route Box
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(
                        Icons.trip_origin,
                        size: 16,
                        color: Color(0xFF006A4E),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'পিকআপ: ${opp.pickupAddress}',
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 13.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const Padding(
                    padding: EdgeInsets.only(left: 7),
                    child: SizedBox(
                      height: 12,
                      child: VerticalDivider(thickness: 1.5, width: 2),
                    ),
                  ),
                  Row(
                    children: [
                      const Icon(
                        Icons.flag,
                        size: 16,
                        color: Color(0xFFF42A41),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'গন্তব্য: ${opp.dropoffAddress}',
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 13.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),

            // Bangla Voice Replay Button & Mute Toggle
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF0B131E),
                      side: const BorderSide(color: Color(0xFF006A4E)),
                    ),
                    onPressed: () {
                      voiceService.replay(opp.audioPromptBangla);
                    },
                    icon: const Icon(Icons.volume_up, color: Color(0xFF006A4E)),
                    label: const Text(
                      '🔊 বাংলা ভয়েস শুনুন',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filledTonal(
                  tooltip: voiceService.isMuted ? 'আনমিউট করুন' : 'মিউট করুন',
                  onPressed: voiceService.toggleMute,
                  icon: Icon(
                    voiceService.isMuted ? Icons.volume_off : Icons.graphic_eq,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // ETA Selector (২ মিনিট, ৩ মিনিট, ৫ মিনিট)
            Row(
              children: [
                const Text(
                  'পৌঁছানোর সময় (ETA):',
                  style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600),
                ),
                const SizedBox(width: 8),
                ...[2, 3, 5].map((eta) {
                  final isSelected = _selectedEtaMinutes == eta;
                  final labelBangla = eta == 2
                      ? '২ মিনিট'
                      : eta == 3
                          ? '৩ মিনিট'
                          : '৫ মিনিট';
                  return Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: ChoiceChip(
                      label: Text(
                        labelBangla,
                        style: const TextStyle(fontSize: 12),
                      ),
                      selected: isSelected,
                      selectedColor:
                          const Color(0xFF006A4E).withOpacity(0.18),
                      onSelected: (_) {
                        setState(() => _selectedEtaMinutes = eta);
                      },
                    ),
                  );
                }),
              ],
            ),
            const SizedBox(height: 12),

            // 1-Tap Accept Passenger Offer Button
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF006A4E),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 13),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                onPressed: () {
                  socketService.submitBid(
                    bidAmount: baseOffer,
                    etaMinutes: _selectedEtaMinutes,
                  );
                },
                icon: const Icon(Icons.check_circle_outline),
                label: Text(
                  '✓ প্রস্তাবিত ভাড়ায় গ্রহণ করুন (Accept ৳${baseOffer.toStringAsFixed(0)})',
                  style: const TextStyle(
                    fontSize: 14.5,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 14),

            // Counter-Bidding Section (+৳১০, +৳২০, +৳৩০)
            const Text(
              'অথবা পাল্টা ভাড়া প্রস্তাব করুন (InDrive Counter-Bid):',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                _buildQuickCounterBidButton(
                  socketService: socketService,
                  baseFare: baseOffer,
                  increment: 10,
                  labelBangla: '+৳১০',
                ),
                const SizedBox(width: 8),
                _buildQuickCounterBidButton(
                  socketService: socketService,
                  baseFare: baseOffer,
                  increment: 20,
                  labelBangla: '+৳২০',
                ),
                const SizedBox(width: 8),
                _buildQuickCounterBidButton(
                  socketService: socketService,
                  baseFare: baseOffer,
                  increment: 30,
                  labelBangla: '+৳৩০',
                ),
              ],
            ),
            const SizedBox(height: 10),

            // Custom Fare Slider + Submit Custom Bid
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFBEB),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: const Color(0xFFF59E0B).withOpacity(0.5),
                ),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'কাস্টম পাল্টা ভাড়া: ৳${customFare.toStringAsFixed(0)}',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13.5,
                        ),
                      ),
                      FilledButton.tonal(
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFFF59E0B),
                          foregroundColor: Colors.black,
                          visualDensity: VisualDensity.compact,
                        ),
                        onPressed: () {
                          socketService.submitBid(
                            bidAmount: customFare,
                            etaMinutes: _selectedEtaMinutes,
                          );
                        },
                        child: Text(
                          '৳${customFare.toStringAsFixed(0)} বিড পাঠান',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  Slider(
                    value: _customBidIncrement,
                    min: 5,
                    max: 80,
                    divisions: 15,
                    activeColor: const Color(0xFFF59E0B),
                    label: '+৳${_customBidIncrement.toStringAsFixed(0)}',
                    onChanged: (val) {
                      setState(() => _customBidIncrement = val);
                    },
                  ),
                ],
              ),
            ),

            // If a bid was submitted, show status & simulate win button
            if (socketService.hasSubmittedBid) ...[
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFFAF5),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF006A4E)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '✓ আপনার বিড (৳${(socketService.lastSubmittedBidAmount ?? baseOffer).toStringAsFixed(0)}, ETA: ${socketService.lastSubmittedEtaMinutes ?? _selectedEtaMinutes} মিনিট) যাত্রীর কাছে পাঠানো হয়েছে!',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF006A4E),
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 8),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: socketService.simulatePassengerAcceptsBid,
                        icon: const Icon(Icons.play_circle_fill, size: 18),
                        label: const Text(
                          'যাত্রী আপনার বিড গ্রহণ করেছে (Simulate Bid Won)',
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildQuickCounterBidButton({
    required DriverSocketService socketService,
    required double baseFare,
    required double increment,
    required String labelBangla,
  }) {
    final totalFare = baseFare + increment;
    return Expanded(
      child: OutlinedButton(
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 10),
          side: const BorderSide(color: Color(0xFFF59E0B), width: 1.5),
          backgroundColor: const Color(0xFFFFFBEB),
          foregroundColor: Colors.black87,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
        onPressed: () {
          setState(() => _customBidIncrement = increment);
          socketService.submitBid(
            bidAmount: totalFare,
            etaMinutes: _selectedEtaMinutes,
          );
        },
        child: Column(
          children: [
            Text(
              labelBangla,
              style: const TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 14,
                color: Color(0xFFB45309),
              ),
            ),
            Text(
              '৳${totalFare.toStringAsFixed(0)}',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActiveTripPanel(
    BuildContext context,
    DriverSocketService socketService,
    ActiveDriverTrip trip,
  ) {
    final expectedCommission =
        (trip.agreedFare * DriverWalletModel.platformCommissionRate)
            .roundToDouble();

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: const BorderSide(color: Color(0xFF006A4E), width: 2),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF006A4E),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Icon(Icons.verified, color: Colors.white, size: 24),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      trip.messageBangla,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14.5,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'যাত্রী: ${trip.passengerName}',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(
                          Icons.phone_in_talk,
                          size: 16,
                          color: Color(0xFF006A4E),
                        ),
                        const SizedBox(width: 5),
                        Text(
                          trip.passengerPhone,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF006A4E),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text(
                      'চূড়ান্ত নির্ধারিত ভাড়া',
                      style: TextStyle(fontSize: 11.5, color: Colors.black54),
                    ),
                    Text(
                      '৳${trip.agreedFare.toStringAsFixed(0)}',
                      style: const TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF006A4E),
                      ),
                    ),
                    Text(
                      '৮% কমিশন: ৳${expectedCommission.toStringAsFixed(0)}',
                      style: const TextStyle(
                        fontSize: 11,
                        color: Color(0xFFF42A41),
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const Divider(height: 22),
            Row(
              children: [
                const Icon(
                  Icons.my_location,
                  size: 17,
                  color: Color(0xFF006A4E),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'পিকআপ: ${trip.pickupAddress}',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.place, size: 17, color: Color(0xFFF42A41)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'গন্তব্য: ${trip.dropoffAddress}',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () {
                  socketService.emitUpdateLocation();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      duration: Duration(seconds: 2),
                      content: Text(
                        '📍 যাত্রীর ম্যাপে লাইভ জিপিএস অবস্থান পাঠানো হয়েছে!',
                      ),
                    ),
                  );
                },
                icon: const Icon(Icons.navigation),
                label: const Text(
                  '📍 যাত্রীর কাছে লাইভ জিপিএস স্ট্রিম করুন (Stream GPS)',
                ),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF006A4E),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                onPressed: () async {
                  final summary = await socketService.completeActiveRide();
                  if (summary != null && context.mounted) {
                    await _showEarningsSummaryDialog(
                      context,
                      summary,
                      socketService.wallet.currentBalance,
                    );
                  }
                },
                icon: const Icon(Icons.payments),
                label: const Text(
                  '💰 ট্রিপ সম্পন্ন ও নগদ ভাড়া গ্রহণ (Complete Ride & Collect Cash)',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWaitingForRideCard(DriverSocketService socketService) {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const Icon(
              Icons.radar,
              size: 48,
              color: Color(0xFF006A4E),
            ),
            const SizedBox(height: 10),
            Text(
              socketService.isOnline
                  ? 'ভৈরব রাডার সক্রিয় — নতুন ট্রিপ রিকোয়েস্টের অপেক্ষায়...'
                  : 'আপনি অফলাইন আছেন — ট্রিপ পেতে অনলাইন সুইচ চালু করুন',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 15,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'যাত্রী রাইড রিকোয়েস্ট পাঠালে স্বয়ংক্রিয়ভাবে বাংলা ভয়েস অ্যালার্ট বেজে উঠবে।',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12.5, color: Colors.black54),
            ),
            const SizedBox(height: 14),
            FilledButton.tonalIcon(
              onPressed: () {
                if (!socketService.isOnline) {
                  socketService.toggleOnlineStatus(true);
                }
                socketService.simulateIncomingOpportunity(speakAloud: true);
              },
              icon: const Icon(Icons.record_voice_over),
              label: const Text(
                'ডেমো ট্রিপ অফার ও বাংলা ভয়েস টেস্ট করুন (৳80)',
              ),
            ),
          ],
        ),
      ),
    );
  }
}
