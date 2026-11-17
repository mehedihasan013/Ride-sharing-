import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/passenger_models.dart';
import '../services/passenger_socket_service.dart';
import 'active_trip_safety_screen.dart';
import 'bidding_bottom_sheet.dart';
import 'intercity_corridor_screen.dart';

/// Main 4-tab home screen for the CholoBhairab Passenger Application.
/// Tabs:
/// 0. `ট্রিপ বুকিং • Ride`
/// 1. `ঢাকা ইন্টারসিটি • Intercity`
/// 2. `লাইভ ট্র্যাকিং • Active Trip`
/// 3. `প্রোফাইল ও নিরাপত্তা • Safety`
class PassengerHomeScreen extends StatefulWidget {
  const PassengerHomeScreen({super.key});

  @override
  State<PassengerHomeScreen> createState() => _PassengerHomeScreenState();
}

class _PassengerHomeScreenState extends State<PassengerHomeScreen> {
  int _selectedTabIndex = 0;

  List<BhairabLandmark> _landmarks = BhairabLandmark.defaultLandmarks;
  late BhairabLandmark _pickupLandmark;
  late BhairabLandmark _dropoffLandmark;

  List<VehicleOption> _vehicles = VehicleOption.defaultOptions;
  String _selectedVehicleType = 'EASYBIKE';
  int _offerFareBdt = 50;
  bool _isEstimatingFare = false;
  bool _selectingPickupOnMap = false;

  @override
  void initState() {
    super.initState();
    _pickupLandmark = _landmarks[0]; // ভৈরব বাজার রেলওয়ে জংশন
    _dropoffLandmark = _landmarks[1]; // সৈয়দ নজরুল ইসলাম সেতু (মেঘনা ব্রিজ গোলচত্বর)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadLandmarksAndEstimates();
    });
  }

  Future<void> _loadLandmarksAndEstimates() async {
    final socketService = context.read<PassengerSocketService>();
    final fetched = await socketService.apiService.fetchLandmarks();
    if (!mounted) return;
    if (fetched.length >= 2) {
      setState(() {
        _landmarks = fetched;
        _pickupLandmark = fetched.firstWhere(
          (l) => l.id == _pickupLandmark.id,
          orElse: () => fetched[0],
        );
        _dropoffLandmark = fetched.firstWhere(
          (l) => l.id == _dropoffLandmark.id,
          orElse: () => fetched[1],
        );
      });
    }
    await _recalculateFareEstimates();
  }

  Future<void> _recalculateFareEstimates() async {
    setState(() {
      _isEstimatingFare = true;
    });
    final socketService = context.read<PassengerSocketService>();
    final estimated = await socketService.apiService.estimateFares(
      _pickupLandmark.latitude,
      _pickupLandmark.longitude,
      _dropoffLandmark.latitude,
      _dropoffLandmark.longitude,
    );
    if (!mounted) return;

    final currentVehicle = estimated.firstWhere(
      (v) => v.type == _selectedVehicleType,
      orElse: () => estimated.first,
    );

    setState(() {
      _vehicles = estimated;
      _offerFareBdt = currentVehicle.suggestedFare;
      _isEstimatingFare = false;
    });
  }

  VehicleOption get _selectedVehicle {
    return _vehicles.firstWhere(
      (v) => v.type == _selectedVehicleType,
      orElse: () => _vehicles.first,
    );
  }

  double get _currentDistanceKm {
    return BhairabLandmark.calculateDistanceKm(
      _pickupLandmark.latitude,
      _pickupLandmark.longitude,
      _dropoffLandmark.latitude,
      _dropoffLandmark.longitude,
    );
  }

  void _adjustFare(int deltaBdt) {
    final minAllowed = _selectedVehicle.minFare;
    setState(() {
      _offerFareBdt = math.max(minAllowed, _offerFareBdt + deltaBdt);
    });
  }

  void _swapLandmarks() {
    setState(() {
      final temp = _pickupLandmark;
      _pickupLandmark = _dropoffLandmark;
      _dropoffLandmark = temp;
    });
    _recalculateFareEstimates();
  }

  void _showLandmarkSelectorSheet({required bool isPickup}) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: const Color(0xFF111C2D),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isPickup
                      ? '📍 পিকআপ স্থান নির্বাচন করুন (Pickup Landmark)'
                      : '🏁 গন্তব্য স্থান নির্বাচন করুন (Dropoff Landmark)',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Flexible(
                  child: ListView.separated(
                    shrinkWrap: true,
                    itemCount: _landmarks.length,
                    separatorBuilder: (_, __) =>
                        const Divider(color: Color(0xFF1E293B), height: 1),
                    itemBuilder: (_, idx) {
                      final landmark = _landmarks[idx];
                      final isSelected = isPickup
                          ? landmark.id == _pickupLandmark.id
                          : landmark.id == _dropoffLandmark.id;

                      return ListTile(
                        contentPadding:
                            const EdgeInsets.symmetric(horizontal: 8),
                        leading: CircleAvatar(
                          backgroundColor: isSelected
                              ? const Color(0xFF006A4E)
                              : const Color(0xFF0B131E),
                          child: Icon(
                            isPickup ? Icons.my_location : Icons.location_on,
                            color: isSelected
                                ? Colors.white
                                : const Color(0xFF34D399),
                            size: 18,
                          ),
                        ),
                        title: Text(
                          landmark.banglaName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                        subtitle: Text(
                          '${landmark.englishName} • ${landmark.descriptionBangla}',
                          style: const TextStyle(
                            color: Color(0xFF94A3B8),
                            fontSize: 11.5,
                          ),
                        ),
                        trailing: isSelected
                            ? const Icon(
                                Icons.check_circle,
                                color: Color(0xFF34D399),
                              )
                            : null,
                        onTap: () {
                          Navigator.of(ctx).pop();
                          setState(() {
                            if (isPickup) {
                              _pickupLandmark = landmark;
                            } else {
                              _dropoffLandmark = landmark;
                            }
                          });
                          _recalculateFareEstimates();
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _handleRequestRide() {
    final socketService = context.read<PassengerSocketService>();
    socketService.requestRide(
      vehicleType: _selectedVehicleType,
      pickup: _pickupLandmark,
      dropoff: _dropoffLandmark,
      initialOfferFare: _offerFareBdt,
    );

    BiddingBottomSheet.show(
      context,
      onBidAccepted: () {
        if (!mounted) return;
        setState(() {
          _selectedTabIndex = 2; // Jump to Active Trip tab on acceptance
        });
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final socketService = context.watch<PassengerSocketService>();
    final activeRide = socketService.activeRide;
    final incomingBids = socketService.incomingBids;

    return Scaffold(
      backgroundColor: const Color(0xFF0B131E),
      appBar: AppBar(
        backgroundColor: const Color(0xFF006A4E),
        foregroundColor: Colors.white,
        elevation: 0,
        title: Row(
          children: [
            const Text('🛺 ', style: TextStyle(fontSize: 20)),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'চলো ভৈরব • CholoBhairab',
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 16.5,
                    ),
                  ),
                  Text(
                    'যাত্রী: ${socketService.session.fullName} • ${socketService.isConnected ? "লাইভ সংযুক্ত" : "ডেমো সিমুলেটর"}',
                    style: const TextStyle(
                      fontSize: 11,
                      color: Color(0xFFD1FAE5),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          if (incomingBids.isNotEmpty &&
              (activeRide?.status == 'SEARCHING' ||
                  activeRide?.status == 'BIDDING'))
            Padding(
              padding: const EdgeInsets.only(right: 4),
              child: TextButton.icon(
                style: TextButton.styleFrom(
                  backgroundColor: const Color(0xFFF59E0B),
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                ),
                onPressed: () {
                  BiddingBottomSheet.show(
                    context,
                    onBidAccepted: () {
                      setState(() => _selectedTabIndex = 2);
                    },
                  );
                },
                icon: const Icon(Icons.gavel, size: 15),
                label: Text(
                  '${incomingBids.length} বিড',
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 12,
                  ),
                ),
              ),
            ),
          IconButton(
            tooltip: 'জরুরী ৯৯৯ ও SOS অ্যালার্ট',
            icon: const Icon(Icons.emergency, color: Color(0xFFFDE047)),
            onPressed: () async {
              final res = await socketService.triggerEmergencySos();
              if (!context.mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  backgroundColor: const Color(0xFFF42A41),
                  content: Text(
                    (res['messageBangla'] ??
                            '🚨 জরুরী ৯৯৯ এবং পরিবারের সাথে লাইভ লোকেশন শেয়ার হয়েছে!')
                        .toString(),
                  ),
                ),
              );
              setState(() => _selectedTabIndex = 2);
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Live Status Banner if active
          if (socketService.statusBannerBangla != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              color: const Color(0xFF064E3B),
              child: Row(
                children: [
                  const Icon(
                    Icons.notifications_active,
                    color: Color(0xFF34D399),
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      socketService.statusBannerBangla!,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12.5,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  InkWell(
                    onTap: socketService.clearBanners,
                    child: const Icon(
                      Icons.close,
                      color: Colors.white70,
                      size: 16,
                    ),
                  ),
                ],
              ),
            ),

          Expanded(
            child: IndexedStack(
              index: _selectedTabIndex,
              children: [
                _buildRideBookingTab(context, socketService),
                IntercityCorridorScreen(
                  onTripDispatched: () {
                    BiddingBottomSheet.show(
                      context,
                      onBidAccepted: () {
                        setState(() => _selectedTabIndex = 2);
                      },
                    );
                  },
                ),
                const ActiveTripSafetyScreen(showSafetyAndProfileFocus: false),
                const ActiveTripSafetyScreen(showSafetyAndProfileFocus: true),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: NavigationBarTheme(
        data: NavigationBarThemeData(
          backgroundColor: const Color(0xFF111C2D),
          indicatorColor: const Color(0xFF006A4E),
          labelTextStyle: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return const TextStyle(
                color: Color(0xFF6EE7B7),
                fontSize: 11,
                fontWeight: FontWeight.bold,
              );
            }
            return const TextStyle(
              color: Color(0xFF94A3B8),
              fontSize: 11,
            );
          }),
        ),
        child: NavigationBar(
          selectedIndex: _selectedTabIndex,
          onDestinationSelected: (idx) =>
              setState(() => _selectedTabIndex = idx),
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.electric_rickshaw_outlined,
                  color: Color(0xFF94A3B8)),
              selectedIcon:
                  Icon(Icons.electric_rickshaw, color: Colors.white),
              label: 'ট্রিপ বুকিং • Ride',
            ),
            NavigationDestination(
              icon: Icon(Icons.airport_shuttle_outlined,
                  color: Color(0xFF94A3B8)),
              selectedIcon: Icon(Icons.airport_shuttle, color: Colors.white),
              label: 'ঢাকা ইন্টারসিটি • Intercity',
            ),
            NavigationDestination(
              icon: Icon(Icons.radar_outlined, color: Color(0xFF94A3B8)),
              selectedIcon: Icon(Icons.radar, color: Colors.white),
              label: 'লাইভ ট্র্যাকিং • Active Trip',
            ),
            NavigationDestination(
              icon: Icon(Icons.shield_outlined, color: Color(0xFF94A3B8)),
              selectedIcon: Icon(Icons.shield, color: Colors.white),
              label: 'প্রোফাইল ও নিরাপত্তা • Safety',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRideBookingTab(
    BuildContext context,
    PassengerSocketService socketService,
  ) {
    final activeRide = socketService.activeRide;
    final isBiddingOrSearching = activeRide != null &&
        (activeRide.status == 'SEARCHING' || activeRide.status == 'BIDDING');

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // 1. Interactive Bhairab Radar Map Card
        _buildInteractiveBhairabMapCard(socketService),

        const SizedBox(height: 16),

        // 2. Pickup & Dropoff Bhairab Landmark Selector Card
        Container(
          padding: const EdgeInsets.all(15),
          decoration: BoxDecoration(
            color: const Color(0xFF111C2D),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFF1E293B)),
          ),
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      children: [
                        // Pickup Selector Row
                        InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () =>
                              _showLandmarkSelectorSheet(isPickup: true),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 10,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFF0B131E),
                              borderRadius: BorderRadius.circular(12),
                              border:
                                  Border.all(color: const Color(0xFF006A4E)),
                            ),
                            child: Row(
                              children: [
                                const Icon(
                                  Icons.my_location,
                                  color: Color(0xFF34D399),
                                  size: 18,
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'পিকআপ স্থান (Pickup Landmark)',
                                        style: TextStyle(
                                          color: Color(0xFF94A3B8),
                                          fontSize: 11,
                                        ),
                                      ),
                                      Text(
                                        _pickupLandmark.banglaName,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 13.5,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const Icon(
                                  Icons.keyboard_arrow_down,
                                  color: Color(0xFF94A3B8),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        // Dropoff Selector Row
                        InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () =>
                              _showLandmarkSelectorSheet(isPickup: false),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 10,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFF0B131E),
                              borderRadius: BorderRadius.circular(12),
                              border:
                                  Border.all(color: const Color(0xFFF42A41)),
                            ),
                            child: Row(
                              children: [
                                const Icon(
                                  Icons.location_on,
                                  color: Color(0xFFF42A41),
                                  size: 18,
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'গন্তব্য স্থান (Dropoff Landmark)',
                                        style: TextStyle(
                                          color: Color(0xFF94A3B8),
                                          fontSize: 11,
                                        ),
                                      ),
                                      Text(
                                        _dropoffLandmark.banglaName,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 13.5,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const Icon(
                                  Icons.keyboard_arrow_down,
                                  color: Color(0xFF94A3B8),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Swap Button
                  IconButton(
                    tooltip: 'পিকআপ ও গন্তব্য অদলবদল করুন',
                    style: IconButton.styleFrom(
                      backgroundColor: const Color(0xFF0B131E),
                      side: const BorderSide(color: Color(0xFF334155)),
                    ),
                    onPressed: _swapLandmarks,
                    icon: const Icon(
                      Icons.swap_vert,
                      color: Color(0xFFF59E0B),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              // Distance & ETA Telemetry Bar
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '📏 দূরত্ব: ${_currentDistanceKm.toStringAsFixed(2)} কিমি (Haversine)',
                    style: const TextStyle(
                      color: Color(0xFF6EE7B7),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    _isEstimatingFare
                        ? 'ভাড়া হিসাব হচ্ছে...'
                        : '⏱ সম্ভাব্য সময়: ~${_selectedVehicle.etaMinutes} মিনিট',
                    style: const TextStyle(
                      color: Color(0xFFF59E0B),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // 3. 4 Multi-Modal Vehicle Cards
        const Text(
          'যানবাহন নির্বাচন করুন (Multi-Modal Fleet)',
          style: TextStyle(
            color: Colors.white,
            fontSize: 14.5,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 10),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _vehicles.length,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 2.15,
          ),
          itemBuilder: (context, index) {
            final vehicle = _vehicles[index];
            final isSelected = vehicle.type == _selectedVehicleType;

            return GestureDetector(
              onTap: () {
                setState(() {
                  _selectedVehicleType = vehicle.type;
                  _offerFareBdt = vehicle.suggestedFare;
                });
              },
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected
                      ? const Color(0xFF006A4E).withOpacity(0.28)
                      : const Color(0xFF111C2D),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isSelected
                        ? const Color(0xFF34D399)
                        : const Color(0xFF1E293B),
                    width: isSelected ? 1.8 : 1,
                  ),
                ),
                child: Row(
                  children: [
                    Text(
                      vehicle.icon,
                      style: const TextStyle(fontSize: 26),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            vehicle.banglaName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 12.5,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'প্রস্তাবিত ৳${vehicle.suggestedFare} • ${vehicle.etaMinutes} মি.',
                            style: const TextStyle(
                              color: Color(0xFFF59E0B),
                              fontSize: 11.5,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),

        const SizedBox(height: 16),

        // 4. InDrive Fare Negotiation Stepper + Primary Request CTA
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
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'আপনার প্রস্তাবিত ভাড়া (InDrive Fare Offer)',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                  Text(
                    'সর্বনিম্ন: ৳${_selectedVehicle.minFare}',
                    style: const TextStyle(
                      color: Color(0xFF94A3B8),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // -৳5 Stepper Button
                  SizedBox(
                    height: 46,
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFFF59E0B),
                        side: const BorderSide(
                          color: Color(0xFFF59E0B),
                          width: 1.4,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      onPressed: () => _adjustFare(-5),
                      child: const Text(
                        '-৳5',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 18),
                  // Center Offer Fare Display
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 26,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0B131E),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFF006A4E)),
                    ),
                    child: Column(
                      children: [
                        Text(
                          '৳$_offerFareBdt',
                          style: const TextStyle(
                            color: Color(0xFF34D399),
                            fontSize: 28,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        const Text(
                          'নগদ পরিশোধ (Cash Only)',
                          style: TextStyle(
                            color: Color(0xFF94A3B8),
                            fontSize: 10.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 18),
                  // +৳5 Stepper Button
                  SizedBox(
                    height: 46,
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF34D399),
                        side: const BorderSide(
                          color: Color(0xFF34D399),
                          width: 1.4,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      onPressed: () => _adjustFare(5),
                      child: const Text(
                        '+৳5',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              // Primary Request Ride CTA Button
              SizedBox(
                height: 52,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF006A4E),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  onPressed: _handleRequestRide,
                  child: const Text(
                    '⚡ রাইড রিকোয়েস্ট পাঠান (Request Ride)',
                    style: TextStyle(
                      fontSize: 15.5,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),

        // 5. Inline Live Bidding Sheet when a ride request is currently searching/bidding
        if (isBiddingOrSearching) ...[
          const SizedBox(height: 16),
          BiddingBottomSheet(
            onBidAccepted: () {
              setState(() => _selectedTabIndex = 2);
            },
          ),
        ],
      ],
    );
  }

  /// Interactive Bhairab Radar Map Card with custom `CustomPainter` and tappable landmark pins
  Widget _buildInteractiveBhairabMapCard(PassengerSocketService socketService) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF111C2D),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.map_outlined, color: Color(0xFF34D399), size: 18),
                    SizedBox(width: 6),
                    Text(
                      'ভৈরব লাইভ রাডার ম্যাপ (Meghna Corridor)',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 13.5,
                      ),
                    ),
                  ],
                ),
                InkWell(
                  onTap: () => setState(
                    () => _selectingPickupOnMap = !_selectingPickupOnMap,
                  ),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0B131E),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFF334155)),
                    ),
                    child: Text(
                      _selectingPickupOnMap
                          ? 'পিন ট্যাপ: 📍 পিকআপ'
                          : 'পিন ট্যাপ: 🏁 গন্তব্য',
                      style: const TextStyle(
                        color: Color(0xFFF59E0B),
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(
            height: 215,
            child: ClipRRect(
              borderRadius:
                  const BorderRadius.vertical(bottom: Radius.circular(18)),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final width = constraints.maxWidth;
                  final height = constraints.maxHeight;

                  Offset coordToOffset(double lat, double lng) {
                    // Bhairab bounding box: lat [24.038 .. 24.079], lng [90.960 .. 91.007]
                    const minLat = 24.037;
                    const maxLat = 24.080;
                    const minLng = 90.960;
                    const maxLng = 91.008;

                    final xNorm =
                        ((lng - minLng) / (maxLng - minLng)).clamp(0.08, 0.92);
                    final yNorm =
                        (1.0 - (lat - minLat) / (maxLat - minLat))
                            .clamp(0.12, 0.88);
                    return Offset(xNorm * width, yNorm * height);
                  }

                  final pickupPos = coordToOffset(
                    _pickupLandmark.latitude,
                    _pickupLandmark.longitude,
                  );
                  final dropoffPos = coordToOffset(
                    _dropoffLandmark.latitude,
                    _dropoffLandmark.longitude,
                  );

                  final activeRide = socketService.activeRide;
                  final Offset? liveDriverPos = (activeRide?.driverLat != null &&
                          activeRide?.driverLng != null)
                      ? coordToOffset(
                          activeRide!.driverLat!,
                          activeRide.driverLng!,
                        )
                      : null;

                  return Stack(
                    children: [
                      // CustomPainter Radar & Meghna River Background
                      Positioned.fill(
                        child: CustomPaint(
                          painter: _BhairabRadarMapPainter(
                            pickupOffset: pickupPos,
                            dropoffOffset: dropoffPos,
                            liveDriverOffset: liveDriverPos,
                          ),
                        ),
                      ),

                      // Interactive Landmark Pins for all 6 Bhairab hubs
                      ..._landmarks.map((landmark) {
                        final pos = coordToOffset(
                          landmark.latitude,
                          landmark.longitude,
                        );
                        final isPickup = landmark.id == _pickupLandmark.id;
                        final isDropoff = landmark.id == _dropoffLandmark.id;

                        return Positioned(
                          left: (pos.dx - 48).clamp(4.0, width - 100),
                          top: (pos.dy - 18).clamp(4.0, height - 38),
                          child: GestureDetector(
                            onTap: () {
                              setState(() {
                                if (_selectingPickupOnMap) {
                                  _pickupLandmark = landmark;
                                } else {
                                  _dropoffLandmark = landmark;
                                }
                              });
                              _recalculateFareEstimates();
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 7,
                                vertical: 3.5,
                              ),
                              decoration: BoxDecoration(
                                color: isPickup
                                    ? const Color(0xFF006A4E)
                                    : isDropoff
                                        ? const Color(0xFFF42A41)
                                        : const Color(0xFF0B131E)
                                            .withOpacity(0.88),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: isPickup
                                      ? const Color(0xFF34D399)
                                      : isDropoff
                                          ? const Color(0xFFFCA5A5)
                                          : const Color(0xFF334155),
                                  width: isPickup || isDropoff ? 1.5 : 1,
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    isPickup
                                        ? Icons.my_location
                                        : isDropoff
                                            ? Icons.flag
                                            : Icons.place,
                                    size: 11,
                                    color: Colors.white,
                                  ),
                                  const SizedBox(width: 3),
                                  ConstrainedBox(
                                    constraints:
                                        const BoxConstraints(maxWidth: 82),
                                    child: Text(
                                      landmark.banglaName.split(' ').take(2).join(' '),
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      }),

                      // Live Animated Driver Marker if active
                      if (liveDriverPos != null)
                        Positioned(
                          left: (liveDriverPos.dx - 16).clamp(4.0, width - 36),
                          top: (liveDriverPos.dy - 16).clamp(4.0, height - 36),
                          child: Container(
                            padding: const EdgeInsets.all(5),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF59E0B),
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color:
                                      const Color(0xFFF59E0B).withOpacity(0.6),
                                  blurRadius: 10,
                                ),
                              ],
                            ),
                            child: const Text(
                              '🛺',
                              style: TextStyle(fontSize: 13),
                            ),
                          ),
                        ),
                    ],
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// CustomPainter drawing the Bhairab Radar grid, Meghna River channel,
/// Syed Nazrul Islam Bridge corridor, and Pickup -> Dropoff route line.
class _BhairabRadarMapPainter extends CustomPainter {
  final Offset pickupOffset;
  final Offset dropoffOffset;
  final Offset? liveDriverOffset;

  const _BhairabRadarMapPainter({
    required this.pickupOffset,
    required this.dropoffOffset,
    this.liveDriverOffset,
  });

  @override
  void paint(Canvas canvas, Size size) {
    // 1. Deep radar slate background
    final bgPaint = Paint()..color = const Color(0xFF08101A);
    canvas.drawRect(Offset.zero & size, bgPaint);

    // 2. Subtle radar grid lines & concentric rings
    final gridPaint = Paint()
      ..color = const Color(0xFF1E293B).withOpacity(0.55)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;

    final center = Offset(size.width * 0.5, size.height * 0.5);
    for (final r in [40.0, 85.0, 135.0]) {
      canvas.drawCircle(center, r, gridPaint);
    }

    // 3. Meghna River channel along the eastern / southeastern edge
    final riverPath = Path()
      ..moveTo(size.width * 0.72, 0)
      ..quadraticBezierTo(
        size.width * 0.64,
        size.height * 0.52,
        size.width * 0.85,
        size.height,
      )
      ..lineTo(size.width, size.height)
      ..lineTo(size.width, 0)
      ..close();

    final riverPaint = Paint()
      ..color = const Color(0xFF0284C7).withOpacity(0.22)
      ..style = PaintingStyle.fill;
    canvas.drawPath(riverPath, riverPaint);

    // 4. Route line connecting Pickup & Dropoff
    final routePaint = Paint()
      ..color = const Color(0xFF34D399)
      ..strokeWidth = 2.6
      ..style = PaintingStyle.stroke;

    canvas.drawLine(pickupOffset, dropoffOffset, routePaint);

    // 5. Endpoint glow circles
    canvas.drawCircle(
      pickupOffset,
      6,
      Paint()..color = const Color(0xFF34D399).withOpacity(0.4),
    );
    canvas.drawCircle(
      dropoffOffset,
      6,
      Paint()..color = const Color(0xFFF42A41).withOpacity(0.4),
    );
  }

  @override
  bool shouldRepaint(covariant _BhairabRadarMapPainter oldDelegate) {
    return oldDelegate.pickupOffset != pickupOffset ||
        oldDelegate.dropoffOffset != dropoffOffset ||
        oldDelegate.liveDriverOffset != liveDriverOffset;
  }
}
