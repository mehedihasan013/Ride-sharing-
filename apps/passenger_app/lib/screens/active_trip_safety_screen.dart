import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../services/passenger_socket_service.dart';

/// Displays the Active Trip live GPS telemetry, assigned driver details,
/// shareable WhatsApp live tracking URL (`/rides/track/:token`), and
/// prominent 999 Emergency & SOS Alert controls.
class ActiveTripSafetyScreen extends StatelessWidget {
  final bool showSafetyAndProfileFocus;

  const ActiveTripSafetyScreen({
    super.key,
    this.showSafetyAndProfileFocus = false,
  });

  Future<void> _copyWhatsAppTrackingLink(
    BuildContext context,
    String baseUrl,
    String token,
  ) async {
    final shareUrl = '$baseUrl/rides/track/$token';
    final shareMessage =
        'চলো ভৈরব (CholoBhairab) লাইভ ট্রিপ ট্র্যাকিং লিংক: $shareUrl';
    await Clipboard.setData(ClipboardData(text: shareMessage));
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: const Color(0xFF006A4E),
        content: Text('✓ WhatsApp ট্র্যাকিং লিংক কপি হয়েছে: $shareUrl'),
      ),
    );
  }

  Future<void> _triggerSosAlert(
    BuildContext context,
    PassengerSocketService socketService, {
    bool resolved = false,
  }) async {
    final res = await socketService.triggerEmergencySos(resolved: resolved);
    if (!context.mounted) return;
    final msg = (res['messageBangla'] ??
            '🚨 জরুরী ৯৯৯ কমান্ড সেন্টারে SOS অ্যালার্ট পাঠানো হয়েছে!')
        .toString();

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor:
            resolved ? const Color(0xFF006A4E) : const Color(0xFFF42A41),
        content: Text(msg),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final socketService = context.watch<PassengerSocketService>();
    final activeRide = socketService.activeRide;
    final assignedDriver = activeRide?.assignedDriver;
    final session = socketService.session;
    final trackingToken =
        activeRide?.liveTrackingToken ?? 'track_bhairab_live_01';
    final trackingPath = '/rides/track/$trackingToken';
    final isSosActive = activeRide?.isSosActive ?? false;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Passenger Profile & Safety Status Header (especially prominent in Safety/Profile tab)
        if (showSafetyAndProfileFocus) ...[
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF111C2D),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFF1E293B)),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 26,
                  backgroundColor: const Color(0xFF006A4E).withOpacity(0.25),
                  child: const Icon(
                    Icons.verified_user,
                    color: Color(0xFF34D399),
                    size: 28,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        session.fullName,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16.5,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        '🇧🇩 মোবাইল: ${session.phoneNumber} • ভেরিফাইড যাত্রী',
                        style: const TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 12.5,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'জরুরি প্রয়োজনে সরাসরি জাতীয় জরুরি সেবা ৯৯৯ ও চলো ভৈরব কমান্ড সেন্টারে সংযুক্ত।',
                        style: TextStyle(
                          color: Color(0xFF6EE7B7),
                          fontSize: 11.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],

        // Prominent 999 & SOS Emergency Card
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: isSosActive
                  ? const [Color(0xFF991B1B), Color(0xFF450A0A)]
                  : const [Color(0xFF2A1219), Color(0xFF111C2D)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: const Color(0xFFF42A41).withOpacity(0.65),
              width: 1.5,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF42A41).withOpacity(0.2),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.emergency_share,
                      color: Color(0xFFF42A41),
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isSosActive
                              ? '🚨 জরুরী SOS অ্যালার্ট সক্রিয় রয়েছে!'
                              : 'জাতীয় জরুরী সেবা ৯৯৯ ও নিরাপত্তা কেন্দ্র',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'এক ট্যাপে ভৈরব থানা কমান্ড সেন্টার ও পরিবারের কাছে লাইভ GPS লোকেশন পাঠান',
                          style: TextStyle(
                            color: Color(0xFFFCA5A5),
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              SizedBox(
                height: 48,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFF42A41),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  onPressed: () => _triggerSosAlert(
                    context,
                    socketService,
                    resolved: false,
                  ),
                  icon: const Icon(Icons.warning_amber_rounded, size: 22),
                  label: const Text(
                    '🚨 জরুরী ৯৯৯ ও SOS অ্যালার্ট',
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 15,
                    ),
                  ),
                ),
              ),
              if (isSosActive) ...[
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white54),
                  ),
                  onPressed: () => _triggerSosAlert(
                    context,
                    socketService,
                    resolved: true,
                  ),
                  icon: const Icon(Icons.check_circle_outline, size: 18),
                  label: const Text('✓ আমি নিরাপদ আছি (SOS সমাধান করুন)'),
                ),
              ],
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Shareable WhatsApp Live Tracking Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF111C2D),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFF1E293B)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Row(
                children: [
                  Icon(Icons.share_location, color: Color(0xFF34D399)),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'পরিবারের সাথে লাইভ ট্রিপ ট্র্যাকিং শেয়ার',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFF0B131E),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFF334155)),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.link,
                      color: Color(0xFFF59E0B),
                      size: 18,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        trackingPath,
                        style: const TextStyle(
                          color: Color(0xFF6EE7B7),
                          fontFamily: 'monospace',
                          fontSize: 12.5,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                height: 44,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF006A4E),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  onPressed: () => _copyWhatsAppTrackingLink(
                    context,
                    socketService.apiService.baseUrl,
                    trackingToken,
                  ),
                  icon: const Icon(Icons.copy_all_rounded, size: 18),
                  label: const Text(
                    '🔗 WhatsApp লাইভ ট্র্যাকিং লিংক কপি করুন',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13.5,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Assigned Driver & Live Telemetry Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF111C2D),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: assignedDriver != null
                  ? const Color(0xFF006A4E)
                  : const Color(0xFF1E293B),
              width: 1.4,
            ),
          ),
          child: activeRide == null
              ? const Column(
                  children: [
                    Icon(
                      Icons.directions_car_outlined,
                      color: Color(0xFF64748B),
                      size: 38,
                    ),
                    SizedBox(height: 10),
                    Text(
                      'বর্তমানে কোনো সক্রিয় ট্রিপ নেই',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'প্রথম ট্যাব (ট্রিপ বুকিং) থেকে পিকআপ ও গন্তব্য নির্বাচন করে রাইড রিকোয়েস্ট পাঠান।',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 12.5,
                      ),
                    ),
                  ],
                )
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFF006A4E).withOpacity(0.25),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'স্ট্যাটাস: ${activeRide.status}',
                            style: const TextStyle(
                              color: Color(0xFF6EE7B7),
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        Text(
                          'ভাড়া: ৳${activeRide.agreedFare ?? activeRide.initialOfferFare} (নগদ)',
                          style: const TextStyle(
                            color: Color(0xFFF59E0B),
                            fontWeight: FontWeight.w900,
                            fontSize: 17,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    if (assignedDriver != null) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0B131E),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            const CircleAvatar(
                              radius: 22,
                              backgroundColor: Color(0xFF006A4E),
                              child: Text(
                                '🛺',
                                style: TextStyle(fontSize: 20),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'চালক: ${assignedDriver.driverName} (${assignedDriver.ratingAvg} ★)',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14.5,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    assignedDriver.vehicleModel,
                                    style: const TextStyle(
                                      color: Color(0xFF94A3B8),
                                      fontSize: 12.5,
                                    ),
                                  ),
                                  Text(
                                    '📞 ${assignedDriver.driverPhone}',
                                    style: const TextStyle(
                                      color: Color(0xFF34D399),
                                      fontSize: 12.5,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],

                    // Route Summary
                    Row(
                      children: [
                        const Icon(
                          Icons.trip_origin,
                          color: Color(0xFF34D399),
                          size: 16,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'পিকআপ: ${activeRide.pickupAddress}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(
                          Icons.flag_circle,
                          color: Color(0xFFF42A41),
                          size: 16,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'গন্তব্য: ${activeRide.dropoffAddress}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // Live GPS Coordinate Telemetry Box
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0B131E),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFF1E293B)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Row(
                            children: [
                              Icon(
                                Icons.gps_fixed,
                                color: Color(0xFF34D399),
                                size: 16,
                              ),
                              SizedBox(width: 6),
                              Text(
                                'লাইভ GPS টেলিমেট্রি:',
                                style: TextStyle(
                                  color: Color(0xFF94A3B8),
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                          Text(
                            '${(activeRide.driverLat ?? activeRide.pickupLat).toStringAsFixed(4)}° N, '
                            '${(activeRide.driverLng ?? activeRide.pickupLng).toStringAsFixed(4)}° E',
                            style: const TextStyle(
                              color: Color(0xFF6EE7B7),
                              fontFamily: 'monospace',
                              fontWeight: FontWeight.bold,
                              fontSize: 12.5,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Action row to simulate completion or start new ride
                    if (activeRide.status != 'COMPLETED')
                      OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFFF59E0B),
                          side: const BorderSide(color: Color(0xFFF59E0B)),
                        ),
                        onPressed: socketService.completeActiveRideDemo,
                        icon: const Icon(Icons.payments_outlined, size: 18),
                        label: Text(
                          '💰 গন্তব্যে পৌঁছে নগদ ৳${activeRide.agreedFare ?? activeRide.initialOfferFare} পরিশোধ সম্পন্ন করুন',
                        ),
                      )
                    else
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF006A4E),
                          foregroundColor: Colors.white,
                        ),
                        onPressed: socketService.resetRide,
                        icon: const Icon(Icons.add_road),
                        label: const Text('নতুন ট্রিপ বুক করুন (New Ride)'),
                      ),
                  ],
                ),
        ),
      ],
    );
  }
}
