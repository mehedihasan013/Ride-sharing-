import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/passenger_models.dart';
import '../services/passenger_socket_service.dart';

/// Scheduled Intercity Corridor Screen for Bhairab <-> Dhaka / Kishoreganj / Brahmanbaria.
/// Supports toggling between Seat Carpool (`সিট শেয়ারিং - ৳৩০০/সিট`) and
/// Full Vehicle Reserve (`ফুল রিজার্ভ মাইক্রোবাস - ৳২,৪০০`), departure time slots, and seat count selection.
class IntercityCorridorScreen extends StatefulWidget {
  final VoidCallback? onTripDispatched;

  const IntercityCorridorScreen({
    super.key,
    this.onTripDispatched,
  });

  @override
  State<IntercityCorridorScreen> createState() =>
      _IntercityCorridorScreenState();
}

class _IntercityCorridorScreenState extends State<IntercityCorridorScreen> {
  bool _isFullVehicleReserve = false; // false = Seat Carpool, true = Full Reserve
  int _selectedSeats = 1;
  String _selectedTimeSlot = 'সকাল ০৮:৩০';
  IntercityRouteModel _selectedRoute = IntercityRouteModel.defaultRoutes.first;

  final List<String> _timeSlots = const [
    'সকাল ০৮:৩০',
    'সকাল ১০:৩০',
    'দুপুর ১২:১৫',
    'বিকাল ০৪:০০',
    'সন্ধ্যা ০৬:৩০',
    'রাত ০৮:৪৫',
  ];

  void _confirmIntercityBooking(BuildContext context) {
    final socketService = context.read<PassengerSocketService>();
    final int totalFare = _isFullVehicleReserve
        ? _selectedRoute.fullCarFareBdt
        : (_selectedRoute.seatFareBdt * _selectedSeats);

    final pickupLandmark = BhairabLandmark.defaultLandmarks.firstWhere(
      (l) => _selectedRoute.originBangla.contains(l.banglaName.split(' ').first),
      orElse: () => BhairabLandmark.defaultLandmarks[2], // Kachari Bus Stand
    );
    final dropoffLandmark = BhairabLandmark(
      id: 'intercity_${_selectedRoute.id}',
      englishName: _selectedRoute.destinationBangla,
      banglaName: _selectedRoute.destinationBangla,
      category: 'transit_hub',
      latitude: 23.8759,
      longitude: 90.3795,
      descriptionBangla: _selectedRoute.vehicleName,
    );

    socketService.requestRide(
      vehicleType: 'CAR_MICROBUS',
      pickup: pickupLandmark,
      dropoff: dropoffLandmark,
      initialOfferFare: totalFare,
    );

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: const Color(0xFF006A4E),
        content: Text(
          _isFullVehicleReserve
              ? '🚐 ফুল রিজার্ভ বুকিং রিকোয়েস্ট পাঠানো হয়েছে: ${_selectedRoute.destinationBangla} (৳$totalFare)'
              : '🚐 $_selectedSeats সিট কারপুল বুকিং পাঠানো হয়েছে: ${_selectedRoute.destinationBangla} (৳$totalFare)',
        ),
      ),
    );

    widget.onTripDispatched?.call();
  }

  @override
  Widget build(BuildContext context) {
    final int currentRouteTotal = _isFullVehicleReserve
        ? _selectedRoute.fullCarFareBdt
        : (_selectedRoute.seatFareBdt * _selectedSeats);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Banner Header
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF006A4E), Color(0xFF0F3D3E)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(18),
          ),
          child: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text('🚐', style: TextStyle(fontSize: 26)),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'ভৈরব ↔ ঢাকা / কিশোরগঞ্জ / ব্রাহ্মণবাড়িয়া ইন্টারসিটি করিডোর',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16.5,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              SizedBox(height: 6),
              Text(
                'সৈয়দ নজরুল ইসলাম মেঘনা সেতু ও কাচারি মোড় থেকে নির্ধারিত সময়ে এসি মাইক্রোবাস ও কারপুল সার্ভিস।',
                style: TextStyle(color: Colors.white70, fontSize: 12.5),
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Mode Toggle: Seat Carpool vs Full Vehicle Reserve
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: const Color(0xFF111C2D),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFF1E293B)),
          ),
          child: Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _isFullVehicleReserve = false),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      vertical: 12,
                      horizontal: 8,
                    ),
                    decoration: BoxDecoration(
                      color: !_isFullVehicleReserve
                          ? const Color(0xFF006A4E)
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Column(
                      children: [
                        Text(
                          'সিট শেয়ারিং (Carpool)',
                          style: TextStyle(
                            color: !_isFullVehicleReserve
                                ? Colors.white
                                : const Color(0xFF94A3B8),
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'সিট শেয়ারিং - ৳৩০০/সিট',
                          style: TextStyle(
                            color: !_isFullVehicleReserve
                                ? const Color(0xFFA7F3D0)
                                : const Color(0xFF64748B),
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _isFullVehicleReserve = true),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      vertical: 12,
                      horizontal: 8,
                    ),
                    decoration: BoxDecoration(
                      color: _isFullVehicleReserve
                          ? const Color(0xFF006A4E)
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Column(
                      children: [
                        Text(
                          'ফুল রিজার্ভ মাইক্রোবাস',
                          style: TextStyle(
                            color: _isFullVehicleReserve
                                ? Colors.white
                                : const Color(0xFF94A3B8),
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'ফুল রিজার্ভ মাইক্রোবাস - ৳২,৪০০',
                          style: TextStyle(
                            color: _isFullVehicleReserve
                                ? const Color(0xFFA7F3D0)
                                : const Color(0xFF64748B),
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Departure Time Slot Selector
        const Text(
          'যাত্রার সময়সূচী নির্বাচন করুন (Departure Time Slots)',
          style: TextStyle(
            color: Colors.white,
            fontSize: 14.5,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _timeSlots.map((slot) {
            final isSelected = _selectedTimeSlot == slot;
            return ChoiceChip(
              label: Text(slot),
              selected: isSelected,
              onSelected: (_) => setState(() => _selectedTimeSlot = slot),
              selectedColor: const Color(0xFFF59E0B),
              backgroundColor: const Color(0xFF111C2D),
              labelStyle: TextStyle(
                color: isSelected ? Colors.black : const Color(0xFFCBD5E1),
                fontWeight: FontWeight.bold,
                fontSize: 12.5,
              ),
            );
          }).toList(),
        ),

        const SizedBox(height: 18),

        // Seat Count Selector (when in Carpool Mode)
        if (!_isFullVehicleReserve) ...[
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFF111C2D),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFF1E293B)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'সিট সংখ্যা (Seat Count)',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      'প্রতি যাত্রীর জন্য আরামদায়ক এসি সিট',
                      style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                    ),
                  ],
                ),
                Row(
                  children: [
                    IconButton(
                      onPressed: _selectedSeats > 1
                          ? () => setState(() => _selectedSeats--)
                          : null,
                      icon: const Icon(
                        Icons.remove_circle_outline,
                        color: Color(0xFFF59E0B),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0B131E),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '$_selectedSeats সিট',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: _selectedSeats < 4
                          ? () => setState(() => _selectedSeats++)
                          : null,
                      icon: const Icon(
                        Icons.add_circle_outline,
                        color: Color(0xFF34D399),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],

        // Available Intercity Corridors List
        const Text(
          'উপলব্ধ ইন্টারসিটি রুটসমূহ (Select Corridor)',
          style: TextStyle(
            color: Colors.white,
            fontSize: 14.5,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 10),

        ...IntercityRouteModel.defaultRoutes.map((route) {
          final isSelected = _selectedRoute.id == route.id;
          final displayPrice = _isFullVehicleReserve
              ? route.fullCarFareBdt
              : route.seatFareBdt * _selectedSeats;

          return GestureDetector(
            onTap: () {
              setState(() {
                _selectedRoute = route;
                _selectedTimeSlot = route.departureTime;
              });
            },
            child: Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(15),
              decoration: BoxDecoration(
                color: const Color(0xFF111C2D),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isSelected
                      ? const Color(0xFF006A4E)
                      : const Color(0xFF1E293B),
                  width: isSelected ? 2 : 1,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
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
                          color: const Color(0xFF006A4E).withOpacity(0.22),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '⏰ ${route.departureTime}',
                          style: const TextStyle(
                            color: Color(0xFF6EE7B7),
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      Text(
                        '৳$displayPrice',
                        style: const TextStyle(
                          color: Color(0xFFF59E0B),
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      const Icon(
                        Icons.my_location,
                        size: 16,
                        color: Color(0xFF34D399),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          route.originBangla,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13.5,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(
                        Icons.location_on,
                        size: 16,
                        color: Color(0xFFF42A41),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          route.destinationBangla,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '🚐 ${route.vehicleName}',
                        style: const TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 12,
                        ),
                      ),
                      Text(
                        'খালি সিট: ${route.availableSeats}টি',
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
          );
        }),

        const SizedBox(height: 8),

        // Confirm Intercity Booking CTA
        SizedBox(
          height: 52,
          child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF006A4E),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            onPressed: () => _confirmIntercityBooking(context),
            icon: const Icon(Icons.directions_car_filled),
            label: Text(
              _isFullVehicleReserve
                  ? 'ফুল রিজার্ভ বুক করুন • ৳$currentRouteTotal ($_selectedTimeSlot)'
                  : '$_selectedSeats সিট কারপুল বুক করুন • ৳$currentRouteTotal ($_selectedTimeSlot)',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14.5,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
