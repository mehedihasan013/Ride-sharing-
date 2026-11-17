import 'package:flutter/material.dart';

void main() {
  runApp(const CholoBhairabDriverApp());
}

class CholoBhairabDriverApp extends StatelessWidget {
  const CholoBhairabDriverApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'চলো ভৈরব - চালক',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF006A4E),
          primary: const Color(0xFF006A4E),
          secondary: const Color(0xFFF42A41),
        ),
        useMaterial3: true,
      ),
      home: const DriverDashboardScreen(),
    );
  }
}

class DriverDashboardScreen extends StatefulWidget {
  const DriverDashboardScreen({super.key});

  @override
  State<DriverDashboardScreen> createState() => _DriverDashboardScreenState();
}

class _DriverDashboardScreenState extends State<DriverDashboardScreen> {
  bool isOnline = true;
  double walletBalance = 193.0;
  String vehicleType = 'ইজিবাইক (টমটম)';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('চলো ভৈরব (চালক ড্যাশবোর্ড)'),
        backgroundColor: const Color(0xFF006A4E),
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            // Online Switch
            Card(
              color: isOnline ? Colors.green.shade50 : Colors.grey.shade100,
              child: SwitchListTile(
                title: Text(
                  isOnline ? '🟢 আপনি অনলাইন আছেন' : '⚪ আপনি অফলাইন আছেন',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                subtitle: Text(isOnline ? 'নতুন ট্রিপের অফার আসছে...' : 'অনলাইনে যেতে সুইচ চালু করুন'),
                value: isOnline,
                onChanged: (val) {
                  setState(() => isOnline = val);
                },
              ),
            ),
            const SizedBox(height: 12),
            // Wallet Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('ওয়ালেট ব্যালেন্স', style: TextStyle(color: Colors.grey)),
                        Text(
                          '৳ ${walletBalance.toStringAsFixed(0)}',
                          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF006A4E)),
                        ),
                        const Text('৮% কমিশন স্বয়ংক্রিয়ভাবে কর্তন হয়', style: TextStyle(fontSize: 11)),
                      ],
                    ),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE2136E), foregroundColor: Colors.white),
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('বিকাশ রিচার্জ গেটওয়ে খোলা হচ্ছে...')),
                        );
                      },
                      child: const Text('বিকাশ রিচার্জ'),
                    )
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
