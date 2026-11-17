import 'package:flutter/material.dart';

void main() {
  runApp(const CholoBhairabPassengerApp());
}

class CholoBhairabPassengerApp extends StatelessWidget {
  const CholoBhairabPassengerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'চলো ভৈরব - যাত্রী',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF006A4E), // Bangladesh Bottle Green
          primary: const Color(0xFF006A4E),
          secondary: const Color(0xFFF42A41), // Bangladesh Red
        ),
        useMaterial3: true,
        fontFamily: 'Hind Siliguri',
      ),
      home: const PassengerHomeScreen(),
    );
  }
}

class PassengerHomeScreen extends StatefulWidget {
  const PassengerHomeScreen({super.key});

  @override
  State<PassengerHomeScreen> createState() => _PassengerHomeScreenState();
}

class _PassengerHomeScreenState extends State<PassengerHomeScreen> {
  String selectedVehicle = 'EASYBIKE';
  int offerFare = 60;
  String pickup = 'ভৈরব বাজার রেলওয়ে জংশন';
  String dropoff = 'সৈয়দ নজরুল ইসলাম সেতু (মেঘনা ব্রিজ)';
  bool isSearching = false;
  List<Map<String, dynamic>> driverBids = [];

  final List<Map<String, String>> vehicles = [
    {'type': 'EASYBIKE', 'name': 'ইজিবাইক (টমটম)', 'icon': '🛺', 'base': '50'},
    {'type': 'BIKE', 'name': 'বাইক', 'icon': '🏍️', 'base': '70'},
    {'type': 'CNG', 'name': 'সিএনজি', 'icon': '🛺', 'base': '90'},
    {'type': 'CAR_MICROBUS', 'name': 'ঢাকা মাইক্রোবাস', 'icon': '🚐', 'base': '300'},
  ];

  void _requestRide() {
    setState(() {
      isSearching = true;
      driverBids.clear();
    });

    // Simulate incoming real-time bids over WebSocket
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          driverBids.add({
            'driverName': 'মোঃ রফিকুল ইসলাম',
            'vehicle': 'ভৈরব ইজিবাইক #১২',
            'rating': '4.9 ★',
            'bid': offerFare,
            'eta': '২ মিনিট',
          });
        });
      }
    });

    Future.delayed(const Duration(seconds: 4), () {
      if (mounted) {
        setState(() {
          driverBids.add({
            'driverName': 'কামাল হোসেন',
            'vehicle': 'ভৈরব ইজিবাইক #৪৫',
            'rating': '4.8 ★',
            'bid': offerFare + 10,
            'eta': '১ মিনিট',
          });
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('চলো ভৈরব (যাত্রী)'),
        backgroundColor: const Color(0xFF006A4E),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.emergency, color: Colors.amberAccent),
            tooltip: 'জরুরী ৯৯৯ ও এসওএস',
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('জরুরী যোগাযোগ: ৯৯৯ এবং আত্মীয়দের সাথে লাইভ ট্র্যাকিং শেয়ার হয়েছে')),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
        ),
      ),
    );
  }
}
