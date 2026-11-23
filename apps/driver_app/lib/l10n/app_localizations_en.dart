// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'Cholo Bhairab Driver';

  @override
  String get commonCancel => 'Cancel';

  @override
  String get commonDone => 'Done';

  @override
  String get commonClose => 'Close';

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
  String get commonLower => 'Lower by 5 taka';

  @override
  String get commonRaise => 'Raise by 5 taka';

  @override
  String get vehicleEasybike => 'Easy-bike';

  @override
  String get vehicleBike => 'Bike';

  @override
  String get vehicleCng => 'CNG';

  @override
  String get vehicleMicrobus => 'Microbus';

  @override
  String get navHome => 'Home';

  @override
  String get navWallet => 'Wallet';

  @override
  String get navAccount => 'Account';

  @override
  String get homeOffline => 'Offline';

  @override
  String get homeOnline => 'Online';

  @override
  String get homeConnecting => 'Connecting';

  @override
  String homeLocation(String place) {
    return 'Your location: $place';
  }

  @override
  String get homeGoOnline => 'Go online';

  @override
  String get homeGoOffline => 'Go offline';

  @override
  String homeWaiting(String place) {
    return 'Waiting for trips · $place';
  }

  @override
  String get homeOfflineHint => 'Go online to get trip requests nearby.';

  @override
  String get homeDemoRequest => 'Demo: send a test request';

  @override
  String get homeMute => 'Mute voice alerts';

  @override
  String get homeUnmute => 'Turn on voice alerts';

  @override
  String get homeChooseLocation => 'Choose your location';

  @override
  String get lockTitle => 'Low balance, bidding off';

  @override
  String lockBody(String min, String balance) {
    return 'You need at least $min to bid. You have $balance.';
  }

  @override
  String lockTopup(String amount) {
    return 'Top up $amount with bKash';
  }

  @override
  String get reqNewTrip => 'New trip';

  @override
  String get reqReplay => 'Play again';

  @override
  String reqPickupAway(String km) {
    return 'Pickup · $km km away';
  }

  @override
  String reqDropoffTrip(String km) {
    return 'Drop-off · $km km trip';
  }

  @override
  String get reqPickup => 'Pickup';

  @override
  String get reqDropoff => 'Drop-off';

  @override
  String get reqOffer => 'Passenger\'s offer';

  @override
  String get reqEta => 'Time to pickup';

  @override
  String reqAccept(String fare) {
    return 'Accept for $fare';
  }

  @override
  String get reqCounter => 'Or counter-offer';

  @override
  String get reqOther => 'Other amount';

  @override
  String get reqIgnore => 'Ignore';

  @override
  String get reqLocked => 'Top up first to bid';

  @override
  String get reqError => 'Couldn\'t send your offer. Try again.';

  @override
  String reqSent(String fare) {
    return 'Your offer of $fare was sent';
  }

  @override
  String get reqSentHint => 'The trip starts if the passenger picks you.';

  @override
  String get reqExpired => 'The passenger hasn\'t picked yet';

  @override
  String get reqDemoAccept => 'Demo: passenger accepts';

  @override
  String get reqYourFare => 'Your fare';

  @override
  String reqSend(String fare) {
    return 'Send $fare';
  }

  @override
  String reqSecondsLeft(String s) {
    return '$s seconds left';
  }

  @override
  String get tripGoPickup => 'Go to pickup';

  @override
  String get tripWaitPassenger => 'Wait for the passenger';

  @override
  String get tripDriveDropoff => 'Drive to drop-off';

  @override
  String get tripCallPassenger => 'Call passenger';

  @override
  String tripCallFailed(String phone) {
    return 'Call $phone';
  }

  @override
  String get tripArrived => 'I\'ve arrived';

  @override
  String get tripStart => 'Start trip';

  @override
  String tripComplete(String fare) {
    return 'Complete · collect $fare';
  }

  @override
  String tripConfirmTitle(String fare) {
    return 'Collected $fare in cash?';
  }

  @override
  String get tripConfirmYes => 'Yes, collected';

  @override
  String get tripConfirmNo => 'Not yet';

  @override
  String get sumTitle => 'Trip complete · collect cash';

  @override
  String get sumFare => 'Fare (cash)';

  @override
  String get sumCommission => 'Commission (8%)';

  @override
  String get sumKeep => 'You keep';

  @override
  String get sumBalance => 'New balance';

  @override
  String get walletTitle => 'Wallet';

  @override
  String get walletBalance => 'Balance';

  @override
  String get walletBiddingOn => 'Bidding on';

  @override
  String get walletBiddingOff => 'Bidding off';

  @override
  String walletMinHint(String min) {
    return 'You need at least $min to get trips and bid.';
  }

  @override
  String get walletTopup => 'Top up';

  @override
  String walletTopupWith(String method, String amount) {
    return 'Top up $amount · $method';
  }

  @override
  String get walletCommissionNote =>
      '8% of each fare is deducted after the trip.';

  @override
  String get walletHistory => 'History';

  @override
  String get walletEmpty => 'No transactions yet.';

  @override
  String get walletOfflineDemo => 'Offline demo · nothing was charged.';

  @override
  String get txBkash => 'bKash top-up';

  @override
  String get txNagad => 'Nagad top-up';

  @override
  String get txCommission => 'Commission';

  @override
  String get txBonus => 'Bonus';

  @override
  String get txOther => 'Transaction';

  @override
  String get topupConnecting => 'Connecting to bKash…';

  @override
  String get topupMerchant => 'Merchant';

  @override
  String get topupAmount => 'Amount';

  @override
  String get topupInvoice => 'Invoice';

  @override
  String get topupAccount => 'bKash account number';

  @override
  String topupPay(String amount) {
    return 'Pay $amount';
  }

  @override
  String get topupSuccess => 'Top-up successful';

  @override
  String get topupTrx => 'Transaction ID';

  @override
  String get topupFailed => 'Top-up didn\'t go through. Try again.';

  @override
  String topupNagadDone(String balance) {
    return 'Nagad top-up done · new balance $balance';
  }

  @override
  String get accountTitle => 'Account';

  @override
  String get accountDocuments => 'Documents';

  @override
  String get accountVoice => 'Voice alerts';

  @override
  String get accountLanguage => 'Language';

  @override
  String get accountDemoTools => 'Demo tools';

  @override
  String get accountLowBalanceMode => 'Low-balance mode';

  @override
  String get accountServer => 'Server';

  @override
  String get accountServerLive => 'Connected';

  @override
  String get accountServerOffline => 'Offline';

  @override
  String get kycApproved => 'Approved';

  @override
  String get kycPending => 'Under review';

  @override
  String get kycRejected => 'Rejected';

  @override
  String get voiceOn => 'On';

  @override
  String get voiceOff => 'Off';

  @override
  String get languageBangla => 'বাংলা';

  @override
  String get languageEnglish => 'English';

  @override
  String kycStatus(String status) {
    return 'Status: $status';
  }

  @override
  String get kycVehicleType => 'Vehicle type';

  @override
  String get kycEasybikeHint => 'Municipality and union routes';

  @override
  String get kycCngHint => 'Bhairab–Kuliarchar–Bajitpur route';

  @override
  String get kycBikeHint => 'Fast, one rider';

  @override
  String get kycMicrobusHint => 'Highway and reserved trips';

  @override
  String get kycName => 'Full name';

  @override
  String get kycPhone => 'Mobile number';

  @override
  String get kycNid => 'National ID number';

  @override
  String get kycModel => 'Vehicle model';

  @override
  String get kycRegistration => 'Registration / token number';

  @override
  String get kycCouncilor => 'Ward councillor\'s certificate number';

  @override
  String get kycBrta => 'BRTA driving licence number';

  @override
  String get kycRequired => 'Fill this in';

  @override
  String get kycPhoneInvalid => 'Enter a valid 11-digit mobile number';

  @override
  String get kycNidInvalid => 'Enter at least 10 digits';

  @override
  String get kycSubmit => 'Submit';

  @override
  String kycSubmitted(String status) {
    return 'Application sent · $status';
  }

  @override
  String get voiceSwitch => 'Voice alerts on';

  @override
  String get voiceExplain =>
      'New trips play an alert sound and vibrate. What was announced is listed below.';

  @override
  String get voiceTest => 'Test';

  @override
  String get voiceTestTrip => 'New trip';

  @override
  String get voiceTestConfirmed => 'Ride confirmed';

  @override
  String get voiceTestLowBalance => 'Low balance';

  @override
  String get voiceHistory => 'History';

  @override
  String get voiceClear => 'Clear';

  @override
  String get voiceEmpty => 'No alerts yet.';
}
