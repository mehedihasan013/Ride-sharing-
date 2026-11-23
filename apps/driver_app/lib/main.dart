import 'package:cholo_ui/cholo_ui.dart';
import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import 'app_prefs.dart';
import 'l10n/app_localizations.dart';
import 'screens/account/account_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/home/request_takeover.dart';
import 'screens/wallet/topup_sheet.dart';
import 'screens/wallet/wallet_screen.dart';
import 'services/bangla_voice_service.dart';
import 'services/driver_api_service.dart';
import 'services/driver_socket_service.dart';
import 'widgets/labels.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await AppPrefs.load();
  // Created once: a rebuild (e.g. a language switch) must never open a second socket.
  final voice = BanglaVoiceService();
  final socket = DriverSocketService(apiService: DriverApiService(), voiceService: voice);
  runApp(DriverApp(prefs: prefs, voice: voice, socket: socket));
}

/// Root of the Cholo Bhairab driver app.
class DriverApp extends StatelessWidget {
  const DriverApp({super.key, required this.prefs, required this.voice, required this.socket});

  final AppPrefs prefs;
  final BanglaVoiceService voice;
  final DriverSocketService socket;

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<AppPrefs>.value(value: prefs),
        ChangeNotifierProvider<BanglaVoiceService>.value(value: voice),
        ChangeNotifierProvider<DriverSocketService>.value(value: socket),
      ],
      child: Builder(
        builder: (context) {
          final locale = context.select<AppPrefs, Locale>((p) => p.locale);
          return MaterialApp(
            debugShowCheckedModeBanner: false,
            onGenerateTitle: (context) => AppLocalizations.of(context).appTitle,
            locale: locale,
            supportedLocales: AppLocalizations.supportedLocales,
            localizationsDelegates: const [
              AppLocalizations.delegate,
              ...GlobalMaterialLocalizations.delegates,
            ],
            theme: cbTheme(bangla: locale.languageCode == 'bn'),
            themeMode: ThemeMode.light,
            home: const DriverShell(),
          );
        },
      ),
    );
  }
}

/// Three tabs kept alive in an IndexedStack, plus the full-screen trip request on top.
class DriverShell extends StatefulWidget {
  const DriverShell({super.key});

  @override
  State<DriverShell> createState() => _DriverShellState();
}

class _DriverShellState extends State<DriverShell> {
  int _index = 0;
  String? _seenTripId;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final hasOpportunity = context.select<DriverSocketService, bool>((s) => s.currentOpportunity != null);
    final tripId = context.select<DriverSocketService, String?>((s) => s.activeTrip?.rideId);

    // A new trip always brings the driver to the map.
    if (tripId != null && tripId != _seenTripId) {
      _seenTripId = tripId;
      _index = 0;
    }

    return Stack(
      children: [
        Scaffold(
          body: IndexedStack(
            index: _index,
            children: [
              HomeScreen(onOpenWallet: () => setState(() => _index = 1)),
              const WalletScreen(),
              const AccountScreen(),
            ],
          ),
          bottomNavigationBar: NavigationBar(
            selectedIndex: _index,
            onDestinationSelected: (i) => setState(() => _index = i),
            destinations: [
              NavigationDestination(
                icon: const Icon(Icons.map_outlined),
                selectedIcon: const Icon(Icons.map),
                label: l.navHome,
              ),
              NavigationDestination(
                icon: const Icon(Icons.account_balance_wallet_outlined),
                selectedIcon: const Icon(Icons.account_balance_wallet),
                label: l.navWallet,
              ),
              NavigationDestination(
                icon: const Icon(Icons.person_outline),
                selectedIcon: const Icon(Icons.person),
                label: l.navAccount,
              ),
            ],
          ),
        ),
        if (hasOpportunity && tripId == null) const Positioned.fill(child: _RequestOverlay()),
      ],
    );
  }
}

/// Feeds the request screen from the socket service (rebuilds every countdown second).
class _RequestOverlay extends StatelessWidget {
  const _RequestOverlay();

  @override
  Widget build(BuildContext context) {
    final socket = context.watch<DriverSocketService>();
    final opp = socket.currentOpportunity;
    if (opp == null) return const SizedBox.shrink();
    final profile = socket.profile;
    final pickup = LatLng(opp.pickupLat, opp.pickupLng);
    final drop = dropoffPoint(socket.landmarks, opp.dropoffAddress, opp.dropoffLat, opp.dropoffLng);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) socket.dismissOpportunity();
      },
      child: RequestTakeover(
        passengerName: opp.passengerName,
        pickupName: addressLabel(context, socket.landmarks, opp.pickupAddress),
        dropoffName: addressLabel(context, socket.landmarks, opp.dropoffAddress),
        offerFare: opp.initialOfferFare,
        remainingSeconds: socket.opportunityRemainingSeconds,
        totalSeconds: opp.expiresInSeconds,
        pickupKm: cbDistanceKm(LatLng(profile.lat, profile.lng), pickup),
        tripKm: drop == null ? null : cbDistanceKm(pickup, drop),
        lockedOut: socket.wallet.isLockedOut,
        offerSent: socket.hasSubmittedBid,
        sentAmount: socket.lastSubmittedBidAmount,
        showError: socket.lastErrorBangla != null,
        onBid: (amount, eta) => socket.submitBid(bidAmount: amount, etaMinutes: eta),
        onIgnore: socket.dismissOpportunity,
        onReplay: () => context.read<BanglaVoiceService>().replay(opp.audioPromptBangla),
        onTopUp: () => showBkashTopup(context, 100),
        onDemoAccept: kDemoMode ? socket.simulatePassengerAcceptsBid : null,
      ),
    );
  }
}
