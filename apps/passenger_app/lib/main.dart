import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'screens/otp_login_screen.dart';
import 'screens/passenger_home_screen.dart';
import 'services/passenger_api_service.dart';
import 'services/passenger_socket_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const CholoBhairabPassengerApp());
}

/// Root widget for the CholoBhairab (চলো ভৈরব) Passenger Application.
/// Wires `MultiProvider` for `PassengerApiService` and `PassengerSocketService`,
/// applies the Bangladesh Emerald (`#006A4E`) & Deep Command Slate (`#0B131E`) theme,
/// and launches into the OTP Login & Home flow.
class CholoBhairabPassengerApp extends StatelessWidget {
  const CholoBhairabPassengerApp({super.key});

  @override
  Widget build(BuildContext context) {
    final apiService = PassengerApiService();

    return MultiProvider(
      providers: [
        Provider<PassengerApiService>.value(value: apiService),
        ChangeNotifierProvider<PassengerSocketService>(
          create: (_) => PassengerSocketService(apiService: apiService),
        ),
      ],
      child: MaterialApp(
        title: 'চলো ভৈরব (CholoBhairab) — যাত্রী অ্যাপ',
        debugShowCheckedModeBanner: false,
        themeMode: ThemeMode.dark,
        theme: ThemeData(
          useMaterial3: true,
          brightness: Brightness.dark,
          scaffoldBackgroundColor: const Color(0xFF0B131E),
          colorScheme: ColorScheme.fromSeed(
            brightness: Brightness.dark,
            seedColor: const Color(0xFF006A4E),
            primary: const Color(0xFF006A4E),
            secondary: const Color(0xFFF59E0B),
            error: const Color(0xFFF42A41),
            surface: const Color(0xFF111C2D),
          ),
          textTheme: GoogleFonts.hindSiliguriTextTheme(
            ThemeData.dark().textTheme,
          ),
        ),
        initialRoute: '/login',
        routes: {
          '/login': (_) => const OtpLoginScreen(),
          '/home': (_) => const PassengerHomeScreen(),
        },
      ),
    );
  }
}
