import 'package:cholo_ui/cholo_ui.dart';
import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../l10n/app_localizations.dart';
import '../../models/driver_models.dart';
import '../../services/bangla_voice_service.dart';
import '../../services/driver_api_service.dart';
import '../../services/driver_socket_service.dart';
import '../../widgets/labels.dart';
import '../wallet/topup_sheet.dart';
import 'status_panels.dart';
import 'trip_panel.dart';
import 'trip_summary_screen.dart';

/// Driver home: map with the driver's position, status and balance pills, and a panel for
/// offline / online / low balance / trip.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.onOpenWallet});

  final VoidCallback onOpenWallet;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  TripStep _step = TripStep.goToPickup;
  String? _stepRideId;
  String? _shownCancelId;

  DriverSocketService get _socket => context.read<DriverSocketService>();

  Future<void> _chooseLocation() async {
    final socket = _socket;
    final picked = await showModalBottomSheet<BhairabLandmark>(
      context: context,
      isScrollControlled: true,
      builder: (sheetContext) {
        final l = AppLocalizations.of(sheetContext);
        return SafeArea(
          child: ListView(
            shrinkWrap: true,
            padding: const EdgeInsets.only(bottom: CbSpace.l),
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: CbSpace.gutter),
                child: Text(l.homeChooseLocation, style: Theme.of(sheetContext).textTheme.titleLarge),
              ),
              for (final place in socket.landmarks)
                ListTile(
                  leading: const Icon(Icons.place_outlined),
                  title: Text(placeName(sheetContext, place)),
                  trailing: place.id == socket.selectedLandmark.id
                      ? const Icon(Icons.check, color: CbColors.brand)
                      : null,
                  onTap: () => Navigator.pop(sheetContext, place),
                ),
            ],
          ),
        );
      },
    );
    if (picked != null) socket.selectBhairabLandmark(picked);
  }

  Future<void> _call(String phone) async {
    final messenger = ScaffoldMessenger.of(context);
    final l = AppLocalizations.of(context);
    var opened = false;
    try {
      opened = await launchUrl(Uri(scheme: 'tel', path: phone));
    } catch (_) {
      opened = false;
    }
    if (!opened) messenger.showSnackBar(SnackBar(content: Text(l.tripCallFailed(phone))));
  }

  Future<void> _next(ActiveDriverTrip trip) async {
    switch (_step) {
      case TripStep.goToPickup:
        setState(() => _step = TripStep.waitForPassenger);
        _socket.markArrived();
      case TripStep.waitForPassenger:
        setState(() => _step = TripStep.driveToDropoff);
        _socket.startTrip();
        // Also share the position so the passenger's map moves.
        _socket.emitUpdateLocation();
      case TripStep.driveToDropoff:
        await _complete(trip);
    }
  }

  Future<void> _complete(ActiveDriverTrip trip) async {
    final l = AppLocalizations.of(context);
    final socket = _socket;
    final navigator = Navigator.of(context);
    final collected = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(l.tripConfirmTitle(fmtMoney(trip.agreedFare))),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext, false), child: Text(l.tripConfirmNo)),
          FilledButton(onPressed: () => Navigator.pop(dialogContext, true), child: Text(l.tripConfirmYes)),
        ],
      ),
    );
    if (collected != true) return;
    final summary = await socket.completeActiveRide();
    if (summary == null) return;
    navigator.push(
      MaterialPageRoute<void>(
        builder: (_) => TripSummaryScreen(summary: summary, newBalance: socket.wallet.currentBalance),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final (online, connected, wallet, profile, trip, landmarks, selected) = context.select<DriverSocketService,
        (bool, bool, DriverWalletModel, DriverProfileModel, ActiveDriverTrip?, List<BhairabLandmark>, BhairabLandmark)>(
      (s) => (s.isOnline, s.isSocketConnected, s.wallet, s.profile, s.activeTrip, s.landmarks, s.selectedLandmark),
    );
    final muted = context.select<BanglaVoiceService, bool>((v) => v.isMuted);
    final cancelledId = context.select<DriverSocketService, String?>((s) => s.lastCancelledRideId);
    if (cancelledId != null && cancelledId != _shownCancelId) {
      _shownCancelId = cancelledId;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l.tripCancelledByPassenger)));
        }
      });
    }

    if (trip != null && trip.rideId != _stepRideId) {
      _stepRideId = trip.rideId;
      _step = TripStep.goToPickup;
    }

    final driverPoint = LatLng(profile.lat, profile.lng);
    final pickupPoint = trip == null ? null : LatLng(trip.pickupLat, trip.pickupLng);
    final dropPoint = trip == null ? null : dropoffPoint(landmarks, trip.dropoffAddress, trip.dropoffLat, trip.dropoffLng);
    final locationName = shortPlaceName(context, selected);

    final (statusLabel, statusColor) = !online
        ? (l.homeOffline, CbColors.ink3)
        : connected
            ? (l.homeOnline, CbColors.brand)
            : (l.homeConnecting, CbColors.warning);

    Widget panel;
    if (trip != null) {
      panel = TripPanel(
        step: _step,
        passengerName: trip.passengerName,
        fare: trip.agreedFare,
        pickupName: addressLabel(context, landmarks, trip.pickupAddress),
        dropoffName: addressLabel(context, landmarks, trip.dropoffAddress),
        onCall: () => _call(trip.passengerPhone),
        onNext: () => _next(trip),
      );
    } else if (!online) {
      panel = OfflinePanel(
        locationName: locationName,
        onChooseLocation: _chooseLocation,
        onGoOnline: () => _socket.toggleOnlineStatus(true),
      );
    } else if (wallet.isLockedOut) {
      panel = LockoutPanel(
        balance: wallet.currentBalance,
        minimum: DriverWalletModel.minimumBidBalanceBdt,
        onTopUp: () => showBkashTopup(context, 100),
        onOpenWallet: widget.onOpenWallet,
        onGoOffline: () => _socket.toggleOnlineStatus(false),
      );
    } else {
      panel = OnlinePanel(
        locationName: locationName,
        onChooseLocation: _chooseLocation,
        onGoOffline: () => _socket.toggleOnlineStatus(false),
        onDemoRequest: kDemoMode ? _socket.simulateIncomingOpportunity : null,
      );
    }

    return Scaffold(
      body: CbMapLayout(
        map: CbMap(
          userAgentPackageName: kAppPackageName,
          initialCenter: driverPoint,
          pickup: pickupPoint,
          dropoff: dropPoint,
          driver: driverPoint,
          driverVehicleType: profile.vehicleType,
          fitPadding: EdgeInsets.fromLTRB(56, 120, 56, MediaQuery.sizeOf(context).height * 0.55),
          places: trip == null
              ? [
                  for (final p in landmarks)
                    if (p.id != selected.id)
                      CbMapPlace(id: p.id, point: LatLng(p.latitude, p.longitude), label: shortPlaceName(context, p)),
                ]
              : const [],
          onPlaceTap: trip == null
              ? (id) => _socket.selectBhairabLandmark(landmarks.firstWhere((p) => p.id == id))
              : null,
        ),
        topStart: StatusPill(label: statusLabel, dotColor: statusColor, floating: true),
        topEnd: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            _BalancePill(balance: wallet.currentBalance, locked: wallet.isLockedOut, onTap: widget.onOpenWallet),
            const SizedBox(width: CbSpace.s),
            CbFloatingButton(
              icon: muted ? Icons.volume_off_outlined : Icons.volume_up_outlined,
              tooltip: muted ? l.homeUnmute : l.homeMute,
              onPressed: context.read<BanglaVoiceService>().toggleMute,
            ),
          ],
        ),
        panel: panel,
      ),
    );
  }
}

class _BalancePill extends StatelessWidget {
  const _BalancePill({required this.balance, required this.locked, required this.onTap});

  final double balance;
  final bool locked;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Semantics(
        button: true,
        child: Material(
          color: CbColors.surface,
          borderRadius: BorderRadius.circular(999),
          elevation: 0,
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(999),
            child: Container(
              height: 44,
              padding: const EdgeInsets.symmetric(horizontal: CbSpace.m),
              decoration: BoxDecoration(borderRadius: BorderRadius.circular(999), boxShadow: CbShadow.floating),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    locked ? Icons.lock_outline : Icons.account_balance_wallet_outlined,
                    size: 18,
                    color: locked ? CbColors.danger : CbColors.ink2,
                  ),
                  const SizedBox(width: 6),
                  Text(fmtMoney(balance), style: cbMoneyStyle(15, color: locked ? CbColors.danger : CbColors.ink)),
                ],
              ),
            ),
          ),
        ),
      );
}
