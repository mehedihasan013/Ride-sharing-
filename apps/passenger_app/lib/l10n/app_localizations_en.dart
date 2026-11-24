// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'Cholo Bhairab';

  @override
  String get commonCancel => 'Cancel';

  @override
  String get commonDone => 'Done';

  @override
  String get commonContinue => 'Continue';

  @override
  String get commonBack => 'Back';

  @override
  String get commonCash => 'Cash';

  @override
  String get commonDemo => 'Demo';

  @override
  String commonKm(String km) {
    return '$km km';
  }

  @override
  String commonMinutes(String min) {
    return '$min min';
  }

  @override
  String get commonServerError =>
      'Can\'t reach the server. Check your internet and try again.';

  @override
  String get vehicleEasybike => 'Easy-bike';

  @override
  String get vehicleBike => 'Bike';

  @override
  String get vehicleCng => 'CNG';

  @override
  String get vehicleMicrobus => 'Microbus';

  @override
  String get phoneTitle => 'Enter your mobile number';

  @override
  String get phoneSubtitle => 'We\'ll text you a 6-digit code.';

  @override
  String get phoneFieldLabel => 'Mobile number';

  @override
  String get phoneInvalid => 'Enter a valid 11-digit mobile number';

  @override
  String get phoneSend => 'Send code';

  @override
  String get phoneDemoSkip => 'Demo: continue without login';

  @override
  String get otpTitle => 'Enter the code';

  @override
  String otpSentTo(String phone) {
    return 'Sent to $phone.';
  }

  @override
  String get otpChangeNumber => 'Change number';

  @override
  String get otpWrong => 'That code is incorrect. Try again.';

  @override
  String otpResendIn(String time) {
    return 'Resend code in $time';
  }

  @override
  String get otpResend => 'Resend code';

  @override
  String get otpVerify => 'Verify';

  @override
  String otpDemoHint(String code) {
    return 'Demo code: $code';
  }

  @override
  String get nameTitle => 'What\'s your name?';

  @override
  String get nameSubtitle => 'Drivers see this when you book.';

  @override
  String get nameField => 'Full name';

  @override
  String get homeAccount => 'Account';

  @override
  String homePickupFrom(String place) {
    return 'Pickup: $place';
  }

  @override
  String get homeWhereTo => 'Where to?';

  @override
  String get homeServiceRide => 'Ride';

  @override
  String get homeServiceRideHint => 'Bike · CNG · Easy-bike';

  @override
  String get homeServiceIntercity => 'Intercity';

  @override
  String get homeServiceIntercityHint => 'Dhaka · Kishoreganj';

  @override
  String get homeRecent => 'Recent';

  @override
  String get homePlaces => 'Places in Bhairab';

  @override
  String get homeOfflineDemo => 'Offline demo';

  @override
  String get homeNoConnection => 'No connection';

  @override
  String get optionsChangeRoute => 'Change route';

  @override
  String optionsTripSummary(String km, String min) {
    return '$km km · about $min min';
  }

  @override
  String get optionsYourOffer => 'Your offer';

  @override
  String optionsOfferHint(String rec, String min) {
    return 'Recommended $rec · Minimum $min · Cash';
  }

  @override
  String optionsFindDrivers(String fare) {
    return 'Find drivers for $fare';
  }

  @override
  String get optionsLower => 'Lower by 5 taka';

  @override
  String get optionsRaise => 'Raise by 5 taka';

  @override
  String get optionsEstimating => 'Calculating fares…';

  @override
  String get offersFinding => 'Finding drivers';

  @override
  String offersYourOffer(String fare, String vehicle) {
    return 'Your offer $fare · $vehicle';
  }

  @override
  String offersRaise(String fare) {
    return 'Raise to $fare';
  }

  @override
  String offersCount(String count) {
    return 'Offers · $count';
  }

  @override
  String get offersSortPrice => 'Lowest';

  @override
  String get offersSortEta => 'Fastest';

  @override
  String get offersEmpty =>
      'Nearby drivers got your request. Offers will appear here.';

  @override
  String offersMinAway(String min) {
    return '$min min away';
  }

  @override
  String get offersMatches => 'Matches your fare';

  @override
  String get offersAccept => 'Accept';

  @override
  String get offersDecline => 'Decline';

  @override
  String get offersUnavailable =>
      'This offer is no longer available. Pick another.';

  @override
  String tripDriverComing(String min) {
    return 'Driver is on the way · $min min';
  }

  @override
  String get tripOnTrip => 'On your trip';

  @override
  String get tripPickup => 'Pickup';

  @override
  String get tripDropoff => 'Drop-off';

  @override
  String get tripCall => 'Call';

  @override
  String get tripShare => 'Share';

  @override
  String get tripSafety => 'Safety';

  @override
  String get tripShareCopied =>
      'Trip details copied. Paste them into WhatsApp or SMS.';

  @override
  String tripShareText(
    String driver,
    String vehicle,
    String phone,
    String pickup,
    String dropoff,
    String link,
  ) {
    return 'Cholo Bhairab trip: $driver, $vehicle, $phone. $pickup to $dropoff. Live tracking: $link';
  }

  @override
  String tripCallFailed(String phone) {
    return 'Call $phone';
  }

  @override
  String get tripDemoComplete => 'Demo: complete trip';

  @override
  String get tripCancel => 'Cancel ride';

  @override
  String get tripCancelTitle => 'Cancel this ride?';

  @override
  String get tripCancelBody => 'Your driver will be told.';

  @override
  String get tripArrived => 'Your driver has arrived';

  @override
  String get tripCancelConfirm => 'Yes, cancel';

  @override
  String get tripKeep => 'Keep ride';

  @override
  String get tripSosActive => 'SOS on · the safety team has been alerted';

  @override
  String get safetyTitle => 'Safety';

  @override
  String get safetySendSos => 'Send SOS';

  @override
  String get safetySosOn => 'SOS is on';

  @override
  String get safetyExplain =>
      'SOS alerts the Cholo Bhairab safety team with your trip and location. In an emergency, call 999.';

  @override
  String get safetyImSafe => 'I\'m safe';

  @override
  String get safetySosSent => 'SOS sent';

  @override
  String get safetySosResolved => 'SOS turned off';

  @override
  String get safetyNumbers => 'Emergency numbers';

  @override
  String get safetyNational => 'National emergency';

  @override
  String get safetyHealth => 'Health hotline';

  @override
  String get receiptTitle => 'Trip complete';

  @override
  String get receiptPayCash => 'Pay your driver in cash';

  @override
  String get receiptDriver => 'Driver';

  @override
  String get receiptRoute => 'Route';

  @override
  String receiptRouteValue(String pickup, String dropoff) {
    return '$pickup to $dropoff';
  }

  @override
  String get searchTitle => 'Plan your ride';

  @override
  String get searchPickupHint => 'Pickup location';

  @override
  String get searchSwap => 'Swap pickup and destination';

  @override
  String get searchOnMap => 'Choose on map';

  @override
  String searchNoResults(String query) {
    return 'No places match \"$query\"';
  }

  @override
  String get pickTitlePickup => 'Set pickup on map';

  @override
  String get pickTitleDropoff => 'Set destination on map';

  @override
  String pickNear(String place) {
    return 'Near $place';
  }

  @override
  String get pickConfirmPickup => 'Pick me up here';

  @override
  String get pickConfirmDropoff => 'Drop me here';

  @override
  String get pickOutside => 'Outside the service area';

  @override
  String get intercityTitle => 'Intercity';

  @override
  String get intercitySubtitle => 'Share a seat or book the whole vehicle.';

  @override
  String intercityFrom(String place, String vehicle) {
    return 'From $place · $vehicle';
  }

  @override
  String intercityPrices(String seat, String whole) {
    return 'Seat $seat · Whole vehicle $whole';
  }

  @override
  String get intercitySeatShare => 'Seat share';

  @override
  String get intercityWhole => 'Whole vehicle';

  @override
  String get intercitySeats => 'Seats';

  @override
  String get intercityDeparture => 'Departure';

  @override
  String intercityBook(String fare) {
    return 'Book · $fare';
  }

  @override
  String get accountTitle => 'Account';

  @override
  String get accountLanguage => 'Language';

  @override
  String get accountLogout => 'Log out';

  @override
  String get accountServer => 'Server';

  @override
  String get accountServerLive => 'Connected';

  @override
  String get languageBangla => 'বাংলা';

  @override
  String get languageEnglish => 'English';
}
