import 'dart:convert';
import 'dart:io';

import 'package:cholobhairab_passenger/services/passenger_api_service.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

PassengerApiService _api(MockClientHandler handler) =>
    PassengerApiService(baseUrl: 'http://test', client: MockClient(handler));

/// JSON reply with Bangla text; like the real backend it declares UTF-8.
http.Response _json(String body, int status) =>
    http.Response(body, status, headers: {'content-type': 'application/json; charset=utf-8'});

void main() {
  group('verifyOtp', () {
    test('a code the server rejects never signs in', () async {
      final api = _api((_) async => _json('{"message":"ভুল ওটিপি কোড।"}', 400));
      expect(await api.verifyOtp('01700000001', '000000'), isNull);
    });

    test('keeps the real JWT the backend sends as "token"', () async {
      final api = _api((request) async {
        expect(jsonDecode(request.body), containsPair('role', 'PASSENGER'));
        return _json(
          jsonEncode({
            'success': true,
            'session': {
              'id': 'user_1',
              'phoneNumber': '01700000001',
              'fullName': 'আব্দুল করিম',
              'role': 'PASSENGER',
              'token': 'real.jwt.token',
            },
          }),
          200,
        );
      });
      final session = await api.verifyOtp('01700000001', '123456');
      expect(session?.accessToken, 'real.jwt.token');
      expect(session?.userId, 'user_1');
      expect(session?.needsName, isFalse);
    });

    test('unreachable server gives an offline demo session in demo mode', () async {
      final api = _api((_) async => throw const SocketException('offline'));
      final session = await api.verifyOtp('01700000001', '123456');
      expect(session, isNotNull);
      expect(session!.needsName, isTrue, reason: 'offline sessions ask for a name');
    });
  });
}
