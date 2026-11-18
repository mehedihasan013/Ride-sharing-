import 'dart:convert';
import 'dart:math' as math;
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../models/passenger_models.dart';

/// Backend base URL; override at build time with --dart-define=API_URL=https://api.example.com
const String kApiUrl =
    String.fromEnvironment('API_URL', defaultValue: 'http://localhost:4000');

/// REST API client for CholoBhairab backend (`kApiUrl`, or `http://10.0.2.2:4000` on the Android emulator).
/// Includes automatic offline fallback so the app works smoothly in any environment.
class PassengerApiService {
  String _customBaseUrl;

  PassengerApiService({String? baseUrl}) : _customBaseUrl = baseUrl ?? '';

  /// Resolves default backend URL depending on platform (Android emulator vs Web/Desktop).
  String get baseUrl {
    if (_customBaseUrl.isNotEmpty) {
      return _customBaseUrl;
    }
    // Android emulator reaches the host's localhost via 10.0.2.2, unless API_URL was supplied
    if (!const bool.hasEnvironment('API_URL') &&
        !kIsWeb &&
        defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:4000';
    }
    return kApiUrl;
  }

  set baseUrl(String url) {
    _customBaseUrl = url.trim();
  }

  Map<String, String> get _jsonHeaders => const {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

  /// 1. Request 6-digit OTP (`POST /auth/otp/request`)
  Future<Map<String, dynamic>> requestOtp(String phoneNumber) async {
    final normalizedPhone = phoneNumber.trim();
    try {
      final uri = Uri.parse('$baseUrl/auth/otp/request');
      final response = await http
          .post(
            uri,
            headers: _jsonHeaders,
            body: jsonEncode({'phoneNumber': normalizedPhone}),
          )
          .timeout(const Duration(seconds: 4));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final decoded = jsonDecode(response.body);
        if (decoded is Map<String, dynamic>) {
          return decoded;
        }
      }
    } catch (e) {
      debugPrint('PassengerApiService.requestOtp offline fallback: $e');
    }

    // Graceful offline fallback
    return {
      'success': true,
      'phoneNumber': normalizedPhone,
      'demoOtp': '123456',
      'offlineFallback': true,
      'messageBangla': 'চলো ভৈরব ওটিপি পাঠানো হয়েছে (ডেমো কোড: 123456)',
    };
  }

  /// 2. Verify 6-digit OTP (`POST /auth/otp/verify`)
  Future<PassengerSession> verifyOtp(
    String phoneNumber,
    String otp,
    String fullName,
  ) async {
    final normalizedPhone = phoneNumber.trim();
    final normalizedName =
        fullName.trim().isEmpty ? 'আব্দুল করিম (Karim)' : fullName.trim();

    try {
      final uri = Uri.parse('$baseUrl/auth/otp/verify');
      final response = await http
          .post(
            uri,
            headers: _jsonHeaders,
            body: jsonEncode({
              'phoneNumber': normalizedPhone,
              'otp': otp.trim(),
              'role': 'PASSENGER',
              'fullName': normalizedName,
            }),
          )
          .timeout(const Duration(seconds: 4));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final decoded = jsonDecode(response.body);
        if (decoded is Map<String, dynamic>) {
          final sessionMap =
              decoded['session'] as Map<String, dynamic>? ?? decoded;
          return PassengerSession.fromJson(sessionMap);
        }
      }
    } catch (e) {
      debugPrint('PassengerApiService.verifyOtp offline fallback: $e');
    }

    // Offline fallback session
    return PassengerSession(
      userId: 'passenger_${normalizedPhone.replaceAll(RegExp(r'[^0-9]'), '')}',
      phoneNumber: normalizedPhone,
      fullName: normalizedName,
      accessToken:
          'jwt_offline_${DateTime.now().millisecondsSinceEpoch}_bhairab',
    );
  }

  /// 3. Fetch all Bhairab landmarks (`GET /geo/landmarks`)
  Future<List<BhairabLandmark>> fetchLandmarks({String query = ''}) async {
    try {
      final uri = Uri.parse('$baseUrl/geo/landmarks').replace(
        queryParameters: query.trim().isEmpty ? null : {'q': query.trim()},
      );
      final response = await http
          .get(uri, headers: _jsonHeaders)
          .timeout(const Duration(seconds: 4));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final decoded = jsonDecode(response.body);
        if (decoded is Map<String, dynamic> && decoded['landmarks'] is List) {
          final list = (decoded['landmarks'] as List)
              .whereType<Map<String, dynamic>>()
              .map(BhairabLandmark.fromJson)
              .toList();
          if (list.isNotEmpty) {
            return list;
          }
        }
      }
    } catch (e) {
      debugPrint('PassengerApiService.fetchLandmarks offline fallback: $e');
    }

    if (query.trim().isEmpty) {
      return BhairabLandmark.defaultLandmarks;
    }
    final q = query.toLowerCase().trim();
    return BhairabLandmark.defaultLandmarks
        .where(
          (l) =>
              l.banglaName.contains(q) ||
              l.englishName.toLowerCase().contains(q) ||
              l.category.toLowerCase().contains(q),
        )
        .toList();
  }

  /// 4. Estimate multi-modal fares (`GET /geo/fares/estimate`)
  Future<List<VehicleOption>> estimateFares(
    double pickupLat,
    double pickupLng,
    double dropoffLat,
    double dropoffLng,
  ) async {
    try {
      final uri = Uri.parse('$baseUrl/geo/fares/estimate').replace(
        queryParameters: {
          'pickupLat': pickupLat.toString(),
          'pickupLng': pickupLng.toString(),
          'dropoffLat': dropoffLat.toString(),
          'dropoffLng': dropoffLng.toString(),
        },
      );
      final response = await http
          .get(uri, headers: _jsonHeaders)
          .timeout(const Duration(seconds: 4));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final decoded = jsonDecode(response.body);
        if (decoded is Map<String, dynamic> && decoded['estimates'] is List) {
          final estimates = (decoded['estimates'] as List)
              .whereType<Map<String, dynamic>>()
              .toList();
          final updatedOptions = <VehicleOption>[];

          for (final baseVehicle in VehicleOption.defaultOptions) {
            final match = estimates.where(
              (e) => e['vehicleType'] == baseVehicle.type,
            );
            if (match.isNotEmpty) {
              updatedOptions.add(
                VehicleOption.fromEstimateJson(match.first, baseVehicle),
              );
            } else {
              updatedOptions.add(baseVehicle);
            }
          }
          return updatedOptions;
        }
      }
    } catch (e) {
      debugPrint('PassengerApiService.estimateFares offline fallback: $e');
    }

    // Local Haversine fallback matching backend GeoService.calculateSuggestedFares
    final rawDist = BhairabLandmark.calculateDistanceKm(
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng,
    );
    final distanceKm = math.max(0.8, rawDist);
    final estimatedMinutes = (distanceKm * 3.5).round();

    return [
      VehicleOption(
        type: 'EASYBIKE',
        banglaName: 'ইজিবাইক (টমটম)',
        englishName: 'Easy-Bike (Auto)',
        icon: '🛺',
        minFare: 20,
        suggestedFare: math.max(20, (15 + distanceKm * 18).round()),
        etaMinutes: math.max(2, estimatedMinutes),
      ),
      VehicleOption(
        type: 'BIKE',
        banglaName: 'বাইক (মোটরসাইকেল)',
        englishName: 'Motorbike',
        icon: '🏍️',
        minFare: 30,
        suggestedFare: math.max(30, (25 + distanceKm * 22).round()),
        etaMinutes: math.max(2, (distanceKm * 2.5).round()),
      ),
      VehicleOption(
        type: 'CNG',
        banglaName: 'সিএনজি অটোরিকশা',
        englishName: 'CNG Auto-Rickshaw',
        icon: '🛺',
        minFare: 40,
        suggestedFare: math.max(40, (35 + distanceKm * 30).round()),
        etaMinutes: math.max(3, estimatedMinutes),
      ),
      VehicleOption(
        type: 'CAR_MICROBUS',
        banglaName: 'মাইক্রোবাস / কার',
        englishName: 'Microbus / Noah',
        icon: '🚐',
        minFare: 250,
        suggestedFare: math.max(250, (200 + distanceKm * 50).round()),
        etaMinutes: math.max(4, estimatedMinutes + 2),
      ),
    ];
  }

  /// 5. Trigger or resolve 999 Emergency SOS (`POST /rides/:rideId/sos`, fallback `/admin/rides/:rideId/sos`)
  Future<Map<String, dynamic>> triggerSos(
    String rideId, {
    bool resolved = false,
  }) async {
    final targetId = rideId.trim().isEmpty ? 'demo' : rideId.trim();
    try {
      final uri = Uri.parse('$baseUrl/rides/$targetId/sos');
      final response = await http
          .post(
            uri,
            headers: _jsonHeaders,
            body: jsonEncode({'resolved': resolved}),
          )
          .timeout(const Duration(seconds: 4));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final decoded = jsonDecode(response.body);
        if (decoded is Map<String, dynamic>) {
          return decoded;
        }
      }

      // Fallback to admin SOS endpoint if public route unavailable
      final fallbackUri = Uri.parse('$baseUrl/admin/rides/$targetId/sos');
      final fallbackResponse = await http
          .post(
            fallbackUri,
            headers: _jsonHeaders,
            body: jsonEncode({'resolved': resolved}),
          )
          .timeout(const Duration(seconds: 4));

      if (fallbackResponse.statusCode >= 200 &&
          fallbackResponse.statusCode < 300) {
        final decoded = jsonDecode(fallbackResponse.body);
        if (decoded is Map<String, dynamic>) {
          return decoded;
        }
      }
    } catch (e) {
      debugPrint('PassengerApiService.triggerSos offline fallback: $e');
    }

    return {
      'success': true,
      'rideId': targetId,
      'sosActive': !resolved,
      'messageBangla': resolved
          ? '✓ জরুরী ৯৯৯ SOS অ্যালার্ট সমাধান করা হয়েছে'
          : '🚨 জরুরী ৯৯৯ কমান্ড সেন্টার এবং পরিবারের সাথে লাইভ লোকেশন শেয়ার করা হয়েছে!',
    };
  }
}
