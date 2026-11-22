import 'package:cholo_ui/cholo_ui.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';

Future<void> _loadFonts() async {
  // Root-package test: assets are addressed without the packages/cholo_ui/ prefix,
  // but TextStyle(package: 'cholo_ui') looks fonts up under the prefixed family name.
  for (final family in ['HindSiliguri', 'Geist']) {
    final loader = FontLoader('packages/cholo_ui/$family');
    for (final weight in ['Regular', 'Medium', 'SemiBold']) {
      loader.addFont(rootBundle.load('fonts/$family-$weight.ttf'));
    }
    await loader.load();
  }
}

void main() {
  group('format', () {
    test('money uses ৳, Latin digits, grouping and a real minus', () {
      expect(fmtMoney(58), '৳58');
      expect(fmtMoney(2400), '৳2,400');
      expect(fmtMoney(-7), '−৳7');
      expect(fmtMoney(52.6), '৳53');
    });

    test('countdown and km', () {
      expect(fmtCountdown(27), '0:27');
      expect(fmtCountdown(75), '1:15');
      expect(fmtCountdown(-3), '0:00');
      expect(fmtKm(2.149), '2.1');
    });

    test('Bangladeshi phone numbers', () {
      expect(normalizeBdPhone('+880 1700-000001'), '01700000001');
      expect(normalizeBdPhone('1700000001'), '01700000001');
      expect(normalizeBdPhone('01700000001'), '01700000001');
      expect(isValidBdPhone('01700000001'), isTrue);
      expect(isValidBdPhone('01200000001'), isFalse);
      expect(isValidBdPhone('0170000000'), isFalse);
      expect(fmtBdPhone('01700000001'), '+880 1700-000001');
    });
  });

  group('compatibility spike: material_ui + flutter_map + bn localizations + fonts', () {
    setUpAll(_loadFonts);

    for (final locale in const [Locale('bn'), Locale('en')]) {
      testWidgets('map layout renders at 360x640 without errors (${locale.languageCode})', (tester) async {
        tester.view.physicalSize = const Size(360, 640) * 3;
        tester.view.devicePixelRatio = 3;
        addTearDown(tester.view.reset);

        late String okLabel;
        await tester.pumpWidget(
          MaterialApp(
            locale: locale,
            supportedLocales: const [Locale('bn'), Locale('en')],
            localizationsDelegates: GlobalMaterialLocalizations.delegates,
            theme: cbTheme(bangla: locale.languageCode == 'bn'),
            home: Builder(
              builder: (context) {
                okLabel = MaterialLocalizations.of(context).okButtonLabel;
                return Scaffold(
                  body: CbMapLayout(
                    topStart: CbFloatingButton(icon: Icons.person_outline, tooltip: 'account', onPressed: () {}),
                    topEnd: const StatusPill(label: 'অনলাইন', dotColor: CbColors.brand, floating: true),
                    map: const CbMap(
                      userAgentPackageName: 'com.cholobhairab.test',
                      pickup: kBhairabCenter,
                      dropoff: LatLng(24.0418, 91.0022),
                      driver: LatLng(24.0450, 90.9900),
                      places: [
                        CbMapPlace(id: 'a', point: LatLng(24.0510, 90.9790), label: 'কাচারি বাস স্ট্যান্ড'),
                      ],
                    ),
                    panel: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const RouteStops(
                          pickupLabel: 'পিকআপ',
                          pickup: 'ভৈরব বাজার রেলওয়ে জংশন',
                          dropoffLabel: 'গন্তব্য',
                          dropoff: 'সৈয়দ নজরুল ইসলাম সেতু (মেঘনা ব্রিজ গোলচত্বর) এবং আরও অনেক লম্বা নাম',
                        ),
                        MoneyStepper(
                          value: 2400,
                          min: 20,
                          onChanged: (_) {},
                          decreaseLabel: 'কমান',
                          increaseLabel: 'বাড়ান',
                        ),
                        const CbBanner(
                          tone: CbTone.danger,
                          title: 'ব্যালেন্স কম',
                          message: 'বিড করতে কমপক্ষে ৳50 লাগবে। আপনার আছে ৳35।',
                        ),
                        FilledButton(onPressed: () {}, child: const Text('৳58-এ চালক খুঁজুন')),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        );
        await tester.pump();

        expect(tester.takeException(), isNull);
        expect(find.text('© OpenStreetMap contributors'), findsOneWidget);
        expect(find.text('৳2,400'), findsOneWidget);
        // Material's own strings come from material_ui's Bangla localizations.
        expect(okLabel, locale.languageCode == 'bn' ? isNot('OK') : 'OK');
      });
    }
  });
}
