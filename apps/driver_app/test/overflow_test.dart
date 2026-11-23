// Renders the driver screens that take plain data with worst-case values at small and normal
// phone sizes, in both languages and with large text. Any RenderFlex overflow fails the test.
import 'package:cholo_ui/cholo_ui.dart';
import 'package:cholobhairab_driver/l10n/app_localizations.dart';
import 'package:cholobhairab_driver/models/driver_models.dart';
import 'package:cholobhairab_driver/screens/home/request_takeover.dart';
import 'package:cholobhairab_driver/screens/home/status_panels.dart';
import 'package:cholobhairab_driver/screens/home/trip_panel.dart';
import 'package:cholobhairab_driver/screens/home/trip_summary_screen.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';

Future<void> _loadFonts() async {
  for (final family in ['HindSiliguri', 'Geist']) {
    final loader = FontLoader('packages/cholo_ui/$family');
    for (final weight in ['Regular', 'Medium', 'SemiBold']) {
      loader.addFont(rootBundle.load('packages/cholo_ui/fonts/$family-$weight.ttf'));
    }
    await loader.load();
  }
}

const _longName = 'মোহাম্মদ আব্দুল্লাহ আল মামুন চৌধুরী';
const _longPlace = 'সৈয়দ নজরুল ইসলাম সেতু (মেঘনা ব্রিজ গোলচত্বর)';
const _pickup = 'চণ্ডীবের মোড় (উপজেলা স্বাস্থ্য কমপ্লেক্স)';

RequestTakeover _request({bool sent = false, bool locked = false, bool error = false, int seconds = 42}) =>
    RequestTakeover(
      passengerName: _longName,
      pickupName: _pickup,
      dropoffName: _longPlace,
      offerFare: 2400,
      remainingSeconds: seconds,
      totalSeconds: 60,
      pickupKm: 12.3,
      tripKm: 123.4,
      lockedOut: locked,
      offerSent: sent,
      sentAmount: 2430,
      showError: error,
      onBid: (_, __) {},
      onIgnore: () {},
      onReplay: () {},
      onTopUp: () {},
      onDemoAccept: () {},
    );

final Map<String, Widget> _fullScreens = {
  'request open': _request(),
  'request urgent': _request(seconds: 9),
  'request sent': _request(sent: true),
  'request locked': _request(locked: true),
  'request error': _request(error: true),
  'trip summary': TripSummaryScreen(
    summary: CompletedRideSummary(
      rideId: 'r1',
      cashCollected: 2400,
      commissionDeductedBdt: 192,
      messageBangla: '',
      completedAt: DateTime(2026),
    ),
    newBalance: 12345.67,
  ),
};

final Map<String, Widget> _panels = {
  'offline': OfflinePanel(locationName: _longPlace, onChooseLocation: () {}, onGoOnline: () {}),
  'online': OnlinePanel(
    locationName: _longPlace,
    onChooseLocation: () {},
    onGoOffline: () {},
    onDemoRequest: () {},
  ),
  'lockout': LockoutPanel(
    balance: 35,
    minimum: 50,
    onTopUp: () {},
    onOpenWallet: () {},
    onGoOffline: () {},
  ),
  for (final step in TripStep.values)
    'trip ${step.name}': TripPanel(
      step: step,
      passengerName: _longName,
      fare: 2400,
      pickupName: _pickup,
      dropoffName: _longPlace,
      onCall: () {},
      onNext: () {},
    ),
};

void main() {
  setUpAll(_loadFonts);

  const cases = [
    (Size(360, 640), Locale('bn'), 1.0),
    (Size(360, 640), Locale('en'), 1.0),
    (Size(411, 891), Locale('bn'), 1.0),
    (Size(411, 891), Locale('en'), 1.0),
    (Size(360, 640), Locale('bn'), 1.3),
  ];

  for (final (size, locale, scale) in cases) {
    final all = {
      ..._fullScreens,
      for (final e in _panels.entries)
        e.key: Scaffold(
          body: SingleChildScrollView(padding: const EdgeInsets.all(CbSpace.gutter), child: e.value),
        ),
    };
    for (final entry in all.entries) {
      testWidgets('${entry.key} fits ${size.width.toInt()}x${size.height.toInt()} ${locale.languageCode} x$scale',
          (tester) async {
        tester.view.physicalSize = size * 3;
        tester.view.devicePixelRatio = 3;
        addTearDown(tester.view.reset);

        await tester.pumpWidget(
          MediaQuery(
            data: MediaQueryData(size: size, textScaler: TextScaler.linear(scale)),
            child: MaterialApp(
              locale: locale,
              supportedLocales: AppLocalizations.supportedLocales,
              localizationsDelegates: const [AppLocalizations.delegate, ...GlobalMaterialLocalizations.delegates],
              theme: cbTheme(bangla: locale.languageCode == 'bn'),
              home: entry.value,
            ),
          ),
        );
        await tester.pump();
        final error = tester.takeException();
        expect(error, isNull, reason: error is FlutterError ? error.toStringDeep() : '$error');
        await tester.pumpWidget(const SizedBox());
      });
    }
  }
}
