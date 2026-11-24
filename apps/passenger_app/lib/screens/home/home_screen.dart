import 'dart:async';

import 'package:cholo_ui/cholo_ui.dart';
import 'package:flutter/services.dart';
import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../app_prefs.dart';
import '../../l10n/app_localizations.dart';
import '../../models/passenger_models.dart';
import '../../services/passenger_api_service.dart';
import '../../services/passenger_socket_service.dart';
import '../../widgets/labels.dart';
import '../account_screen.dart';
import '../intercity_screen.dart';
import '../search_screen.dart';
import 'idle_sheet.dart';
import 'offers_sheet.dart';
import 'options_sheet.dart';
import 'receipt_sheet.dart';
import 'safety_sheet.dart';
import 'trip_sheet.dart';

/// The one passenger home: a full map with a bottom panel that follows the ride state
/// (idle, ride options, offers, trip, receipt).
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late final PassengerSocketService _socket = context.read<PassengerSocketService>();
  late final PassengerApiService _api = context.read<PassengerApiService>();

  List<BhairabLandmark> _landmarks = BhairabLandmark.defaultLandmarks;
  BhairabLandmark _pickup = BhairabLandmark.defaultLandmarks.first;
  BhairabLandmark? _dropoff;
  List<VehicleOption> _options = VehicleOption.defaultOptions;
  bool _estimating = false;
  int _estimateSeq = 0;
  bool _sortByEta = false;
  String? _shownError;

  @override
  void initState() {
    super.initState();
    _socket.addListener(_onSocketChanged);
    _loadLandmarks();
  }

  @override
  void dispose() {
    _socket.removeListener(_onSocketChanged);
    super.dispose();
  }

  Future<void> _loadLandmarks() async {
    final list = await _api.fetchLandmarks();
    if (!mounted || list.isEmpty) return;
    setState(() {
      _landmarks = list;
      _pickup = list.firstWhere((l) => l.id == _pickup.id, orElse: () => list.first);
    });
  }

  /// Server errors (e.g. an offer that is gone) become one friendly snackbar.
  void _onSocketChanged() {
    final error = _socket.errorMessage;
    if (error == null) {
      _shownError = null;
      return;
    }
    if (error == _shownError || !mounted) return;
    _shownError = error;
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(AppLocalizations.of(context).offersUnavailable)));
    scheduleMicrotask(_socket.clearError);
  }

  void _setRoute({required BhairabLandmark pickup, BhairabLandmark? dropoff}) {
    setState(() {
      _pickup = pickup;
      _dropoff = dropoff;
    });
    if (dropoff != null) {
      context.read<AppPrefs>().addRecentPlace(dropoff);
      _estimate();
    }
  }

  Future<void> _estimate() async {
    final dropoff = _dropoff;
    if (dropoff == null) return;
    final seq = ++_estimateSeq;
    setState(() => _estimating = true);
    final options = await _api.estimateFares(
      _pickup.latitude,
      _pickup.longitude,
      dropoff.latitude,
      dropoff.longitude,
    );
    if (!mounted || seq != _estimateSeq) return;
    setState(() {
      _options = options;
      _estimating = false;
    });
  }

  Future<void> _openSearch({bool editPickup = false}) async {
    final result = await Navigator.of(context).push<(BhairabLandmark, BhairabLandmark)>(
      MaterialPageRoute(
        builder: (_) => SearchScreen(
          landmarks: _landmarks,
          pickup: _pickup,
          dropoff: _dropoff,
          recents: context.read<AppPrefs>().recentPlaces,
          editPickup: editPickup,
        ),
      ),
    );
    if (result != null) _setRoute(pickup: result.$1, dropoff: result.$2);
  }

  Future<void> _openIntercity() async {
    final booking = await Navigator.of(context).push<IntercityBooking>(
      MaterialPageRoute(builder: (_) => IntercityScreen(landmarks: _landmarks)),
    );
    if (booking == null) return;
    setState(() {
      _pickup = booking.pickup;
      _dropoff = booking.dropoff;
    });
    _socket.requestRide(
      vehicleType: 'CAR_MICROBUS',
      pickup: booking.pickup,
      dropoff: booking.dropoff,
      initialOfferFare: booking.fare,
    );
  }

  void _request(VehicleOption vehicle, int fare) {
    final dropoff = _dropoff;
    if (dropoff == null) return;
    _socket.requestRide(
      vehicleType: vehicle.type,
      pickup: _pickup,
      dropoff: dropoff,
      initialOfferFare: fare,
    );
  }

  /// The backend has no "update offer" event, so raising = a fresh request at +৳5.
  void _raise(ActiveRideModel ride) {
    final dropoff = _dropoff;
    if (dropoff == null) return;
    _socket.resetRide();
    _socket.requestRide(
      vehicleType: ride.vehicleType,
      pickup: _pickup,
      dropoff: dropoff,
      initialOfferFare: ride.initialOfferFare + 5,
    );
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

  void _share(ActiveRideModel ride, String pickupName, String dropoffName) {
    final l = AppLocalizations.of(context);
    final driver = ride.assignedDriver;
    final message = l.tripShareText(
      driver?.driverName ?? '',
      driver?.vehicleModel ?? '',
      driver?.driverPhone ?? '',
      pickupName,
      dropoffName,
      '${_api.baseUrl}/rides/live/${ride.liveTrackingToken}',
    );
    Clipboard.setData(ClipboardData(text: message));
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l.tripShareCopied)));
  }

  void _openSafety() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (sheetContext) => Selector<PassengerSocketService, bool>(
        selector: (_, s) => s.activeRide?.isSosActive ?? false,
        builder: (_, sosActive, __) => SafetySheet(
          sosActive: sosActive,
          onCall: _call,
          onSos: () => _setSos(active: true),
          onSafe: () => _setSos(active: false),
        ),
      ),
    );
  }

  Future<void> _setSos({required bool active}) async {
    final messenger = ScaffoldMessenger.of(context);
    final l = AppLocalizations.of(context);
    await _socket.triggerEmergencySos(resolved: !active);
    messenger.showSnackBar(SnackBar(content: Text(active ? l.safetySosSent : l.safetySosResolved)));
  }

  Future<void> _confirmCancelTrip() async {
    final l = AppLocalizations.of(context);
    final cancel = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(l.tripCancelTitle),
        content: Text(l.tripCancelBody),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext, false), child: Text(l.tripKeep)),
          TextButton(
            style: TextButton.styleFrom(foregroundColor: CbColors.danger),
            onPressed: () => Navigator.pop(dialogContext, true),
            child: Text(l.tripCancelConfirm),
          ),
        ],
      ),
    );
    if (cancel == true) _socket.cancelRide();
  }

  void _finishTrip() {
    _socket.resetRide();
    setState(() => _dropoff = null);
  }

  List<PlaceSuggestion> _suggestions() {
    double km(BhairabLandmark p) =>
        BhairabLandmark.calculateDistanceKm(_pickup.latitude, _pickup.longitude, p.latitude, p.longitude);
    final recents = context
        .read<AppPrefs>()
        .recentPlaces
        .where((p) => p.id != _pickup.id)
        .map((p) => (place: p, km: km(p), recent: true))
        .toList();
    final nearest = _landmarks
        .where((p) => p.id != _pickup.id && recents.every((r) => r.place.id != p.id))
        .map((p) => (place: p, km: km(p), recent: false))
        .toList()
      ..sort((a, b) => a.km.compareTo(b.km));
    return [...recents, ...nearest].take(3).toList();
  }

  /// Ride addresses are stored in Bangla; show the landmark's own name when we still have it.
  String _rideName(BuildContext context, BhairabLandmark? place, String fallback) =>
      place != null && place.banglaName == fallback ? placeName(context, place) : fallback;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final ride = context.select<PassengerSocketService, ActiveRideModel?>((s) => s.activeRide);
    final connected = context.select<PassengerSocketService, bool>((s) => s.isConnected);
    final size = MediaQuery.sizeOf(context);

    final pickupPoint = ride != null ? LatLng(ride.pickupLat, ride.pickupLng) : LatLng(_pickup.latitude, _pickup.longitude);
    final LatLng? dropoffPoint = ride != null
        ? LatLng(ride.dropoffLat, ride.dropoffLng)
        : (_dropoff == null ? null : LatLng(_dropoff!.latitude, _dropoff!.longitude));
    final LatLng? driverPoint = ride?.assignedDriver != null && ride?.driverLat != null && ride?.driverLng != null
        ? LatLng(ride!.driverLat!, ride.driverLng!)
        : null;
    final idle = ride == null && _dropoff == null;

    return PopScope(
      canPop: idle,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop && ride == null && _dropoff != null) setState(() => _dropoff = null);
      },
      child: Scaffold(
        body: CbMapLayout(
          map: CbMap(
            userAgentPackageName: kAppPackageName,
            pickup: pickupPoint,
            dropoff: dropoffPoint,
            driver: driverPoint,
            driverVehicleType: ride?.vehicleType ?? 'EASYBIKE',
            fitPadding: EdgeInsets.fromLTRB(56, 120, 56, size.height * 0.58),
            places: idle
                ? [
                    for (final p in _landmarks)
                      if (p.id != _pickup.id)
                        CbMapPlace(
                          id: p.id,
                          point: LatLng(p.latitude, p.longitude),
                          label: shortPlaceName(context, p),
                        ),
                  ]
                : const [],
            onPlaceTap: idle
                ? (id) => _setRoute(pickup: _pickup, dropoff: _landmarks.firstWhere((p) => p.id == id))
                : null,
          ),
          topStart: ride == null && _dropoff != null
              ? CbFloatingButton(
                  icon: Icons.arrow_back,
                  tooltip: l.commonBack,
                  onPressed: () => setState(() => _dropoff = null),
                )
              : CbFloatingButton(
                  icon: Icons.person_outline,
                  tooltip: l.homeAccount,
                  onPressed: () => Navigator.of(context)
                      .push(MaterialPageRoute<void>(builder: (_) => const AccountScreen())),
                ),
          topEnd: connected
              ? null
              : StatusPill(
                  label: kDemoMode ? l.homeOfflineDemo : l.homeNoConnection,
                  dotColor: CbColors.warning,
                  floating: true,
                ),
          overlay: ride?.isSosActive == true
              ? CbBanner(tone: CbTone.danger, icon: Icons.sos, message: l.tripSosActive)
              : null,
          panel: _panel(context, ride),
        ),
      ),
    );
  }

  Widget _panel(BuildContext context, ActiveRideModel? ride) {
    if (ride == null) {
      final dropoff = _dropoff;
      if (dropoff == null) {
        return IdleSheet(
          pickupName: placeName(context, _pickup),
          suggestions: _suggestions(),
          onEditPickup: () => _openSearch(editPickup: true),
          onWhereTo: _openSearch,
          onIntercity: _openIntercity,
          onSuggestion: (place) => _setRoute(pickup: _pickup, dropoff: place),
        );
      }
      return OptionsSheet(
        key: ValueKey('${_pickup.id}>${dropoff.id}'),
        pickupName: placeName(context, _pickup),
        dropoffName: placeName(context, dropoff),
        distanceKm: BhairabLandmark.calculateDistanceKm(
          _pickup.latitude,
          _pickup.longitude,
          dropoff.latitude,
          dropoff.longitude,
        ),
        options: _options,
        estimating: _estimating,
        onChangeRoute: _openSearch,
        onRequest: _request,
      );
    }

    final pickupName = _rideName(context, _pickup, ride.pickupAddress);
    final dropoffName = _rideName(context, _dropoff, ride.dropoffAddress);
    switch (ride.status) {
      case 'SEARCHING':
      case 'BIDDING':
        return Selector<PassengerSocketService, List<DriverBidModel>>(
          selector: (_, s) => s.incomingBids,
          builder: (_, bids, __) => OffersSheet(
            offerFare: ride.initialOfferFare,
            vehicleType: ride.vehicleType,
            bids: bids,
            sortByEta: _sortByEta,
            onSortChanged: (value) => setState(() => _sortByEta = value),
            onAccept: _socket.acceptBid,
            onDecline: (bid) => _socket.declineBid(bid.bidId),
            onCancel: _socket.cancelRide,
            onRaise: () => _raise(ride),
          ),
        );
      case 'COMPLETED':
        return ReceiptSheet(
          fare: context.read<PassengerSocketService>().lastCompletedFareBdt ??
              ride.agreedFare ??
              ride.initialOfferFare,
          driverName: ride.assignedDriver?.driverName,
          pickupName: pickupName,
          dropoffName: dropoffName,
          onDone: _finishTrip,
        );
      default:
        return TripSheet(
          ride: ride,
          pickupName: pickupName,
          dropoffName: dropoffName,
          onCall: () => _call(ride.assignedDriver?.driverPhone ?? ''),
          onShare: () => _share(ride, pickupName, dropoffName),
          onSafety: _openSafety,
          onCancel: _confirmCancelTrip,
          onDemoComplete: kDemoMode ? _socket.completeActiveRideDemo : null,
        );
    }
  }
}
