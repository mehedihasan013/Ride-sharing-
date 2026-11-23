// Renders every passenger panel with worst-case data at small and normal phone sizes, in both
// languages and with large text. Any RenderFlex overflow fails the test.
import 'package:cholo_ui/cholo_ui.dart';
import 'package:cholobhairab_passenger/l10n/app_localizations.dart';
import 'package:cholobhairab_passenger/models/passenger_models.dart';
import 'package:cholobhairab_passenger/screens/auth/phone_screen.dart';
import 'package:cholobhairab_passenger/screens/home/idle_sheet.dart';
import 'package:cholobhairab_passenger/screens/home/offers_sheet.dart';
import 'package:cholobhairab_passenger/screens/home/options_sheet.dart';
import 'package:cholobhairab_passenger/screens/home/receipt_sheet.dart';
import 'package:cholobhairab_passenger/screens/home/safety_sheet.dart';
import 'package:cholobhairab_passenger/screens/home/trip_sheet.dart';
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

// Worst-case data: the longest landmark name, long driver names, big fares.
final _longPlace = BhairabLandmark.defaultLandmarks[1];
final _pickup = BhairabLandmark.defaultLandmarks[4];
const _longDriver = 'মোহাম্মদ আব্দুল্লাহ আল মামুন চৌধুরী';

DriverBidModel _bid(String id, String name, int amount, int eta) => DriverBidModel(
      bidId: id,
      driverId: id,
      driverName: name,
      driverPhone: '01811223301',
      ratingAvg: 4.9,
      vehicleModel: 'টয়োটা এক্স-নোয়াহ এসি মাইক্রোবাস (ঢাকা মেট্রো-চ-১২৩৪৫৬)',
      bidAmount: amount,
      etaMinutes: eta,
      timestamp: 0,
    );

final _bids = [
  _bid('bid_sim_1', _longDriver, 2400, 2),
  _bid('bid_real_2', 'কামাল হোসেন', 2410, 1),
  _bid('bid_sim_3', 'শফিকুল আলম', 2420, 12),
];

final _ride = ActiveRideModel(
  rideId: 'ride_1',
  status: 'ACCEPTED',
  pickupAddress: _pickup.banglaName,
  dropoffAddress: _longPlace.banglaName,
  pickupLat: _pickup.latitude,
  pickupLng: _pickup.longitude,
  dropoffLat: _longPlace.latitude,
  dropoffLng: _longPlace.longitude,
  initialOfferFare: 2400,
  agreedFare: 2400,
  assignedDriver: _bids.first,
  liveTrackingToken: 'track_1',
  vehicleType: 'CAR_MICROBUS',
);

final Map<String, Widget> _panels = {
  'phone': const PhoneScreen(),
  'idle': IdleSheet(
    pickupName: _pickup.banglaName,
    suggestions: [
      for (final p in BhairabLandmark.defaultLandmarks.take(3)) (place: p, km: 123.4, recent: true),
    ],
    onEditPickup: () {},
    onWhereTo: () {},
    onIntercity: () {},
    onSuggestion: (_) {},
  ),
  'options': OptionsSheet(
    pickupName: _pickup.banglaName,
    dropoffName: _longPlace.banglaName,
    distanceKm: 123.4,
    options: [for (final o in VehicleOption.defaultOptions) o.copyWith(suggestedFare: 2400)],
    estimating: true,
    onChangeRoute: () {},
    onRequest: (_, __) {},
  ),
  'offers': OffersSheet(
    offerFare: 2400,
    vehicleType: 'CAR_MICROBUS',
    bids: _bids,
    sortByEta: false,
    onSortChanged: (_) {},
    onAccept: (_) {},
    onDecline: (_) {},
    onCancel: () {},
    onRaise: () {},
  ),
  'trip': TripSheet(
    ride: _ride,
    pickupName: _pickup.banglaName,
    dropoffName: _longPlace.banglaName,
    onCall: () {},
    onShare: () {},
    onSafety: () {},
    onCancel: () {},
    onDemoComplete: () {},
  ),
  'receipt': ReceiptSheet(
    fare: 2400,
    driverName: _longDriver,
    pickupName: _pickup.banglaName,
    dropoffName: _longPlace.banglaName,
    onDone: () {},
  ),
  'safety': SafetySheet(sosActive: true, onSos: () {}, onSafe: () {}, onCall: (_) {}),
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
    for (final entry in _panels.entries) {
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
              home: entry.key == 'phone'
                  ? entry.value
                  : Scaffold(
                      body: SingleChildScrollView(
                        padding: const EdgeInsets.all(CbSpace.gutter),
                        child: entry.value,
                      ),
                    ),
            ),
          ),
        );
        // pump, not pumpAndSettle: progress bars and the SOS pulse never settle.
        await tester.pump();
        expect(tester.takeException(), isNull);
        await tester.pumpWidget(const SizedBox());
      });
    }
  }
}
