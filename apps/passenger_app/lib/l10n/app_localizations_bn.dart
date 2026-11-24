// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Bengali Bangla (`bn`).
class AppLocalizationsBn extends AppLocalizations {
  AppLocalizationsBn([String locale = 'bn']) : super(locale);

  @override
  String get appTitle => 'চলো ভৈরব';

  @override
  String get commonCancel => 'বাতিল';

  @override
  String get commonDone => 'ঠিক আছে';

  @override
  String get commonContinue => 'চালিয়ে যান';

  @override
  String get commonBack => 'ফিরে যান';

  @override
  String get commonCash => 'নগদে';

  @override
  String get commonDemo => 'ডেমো';

  @override
  String commonKm(String km) {
    return '$km কিমি';
  }

  @override
  String commonMinutes(String min) {
    return '$min মিনিট';
  }

  @override
  String get commonServerError =>
      'সার্ভারে পৌঁছানো যাচ্ছে না। ইন্টারনেট দেখে আবার চেষ্টা করুন।';

  @override
  String get vehicleEasybike => 'ইজিবাইক';

  @override
  String get vehicleBike => 'বাইক';

  @override
  String get vehicleCng => 'সিএনজি';

  @override
  String get vehicleMicrobus => 'মাইক্রোবাস';

  @override
  String get phoneTitle => 'আপনার মোবাইল নম্বর দিন';

  @override
  String get phoneSubtitle => '6 সংখ্যার একটি কোড এসএমএস করে পাঠানো হবে।';

  @override
  String get phoneFieldLabel => 'মোবাইল নম্বর';

  @override
  String get phoneInvalid => 'সঠিক 11 সংখ্যার মোবাইল নম্বর দিন';

  @override
  String get phoneSend => 'কোড পাঠান';

  @override
  String get phoneDemoSkip => 'ডেমো: লগইন ছাড়া চালিয়ে যান';

  @override
  String get otpTitle => 'কোডটি লিখুন';

  @override
  String otpSentTo(String phone) {
    return '$phone-এ পাঠানো হয়েছে।';
  }

  @override
  String get otpChangeNumber => 'নম্বর বদলান';

  @override
  String get otpWrong => 'কোডটি ভুল। আবার চেষ্টা করুন।';

  @override
  String otpResendIn(String time) {
    return 'আবার পাঠান $time';
  }

  @override
  String get otpResend => 'আবার পাঠান';

  @override
  String get otpVerify => 'যাচাই করুন';

  @override
  String otpDemoHint(String code) {
    return 'ডেমো কোড: $code';
  }

  @override
  String get nameTitle => 'আপনার নাম কী?';

  @override
  String get nameSubtitle => 'বুক করলে চালক এই নামটি দেখবেন।';

  @override
  String get nameField => 'পুরো নাম';

  @override
  String get homeAccount => 'অ্যাকাউন্ট';

  @override
  String homePickupFrom(String place) {
    return 'পিকআপ: $place';
  }

  @override
  String get homeWhereTo => 'কোথায় যাবেন?';

  @override
  String get homeServiceRide => 'রাইড';

  @override
  String get homeServiceRideHint => 'বাইক · সিএনজি · ইজিবাইক';

  @override
  String get homeServiceIntercity => 'ইন্টারসিটি';

  @override
  String get homeServiceIntercityHint => 'ঢাকা · কিশোরগঞ্জ';

  @override
  String get homeRecent => 'সাম্প্রতিক';

  @override
  String get homePlaces => 'ভৈরবের জায়গা';

  @override
  String get homeOfflineDemo => 'অফলাইন ডেমো';

  @override
  String get homeNoConnection => 'সংযোগ নেই';

  @override
  String get optionsChangeRoute => 'রুট বদলান';

  @override
  String optionsTripSummary(String km, String min) {
    return '$km কিমি · প্রায় $min মিনিট';
  }

  @override
  String get optionsYourOffer => 'আপনার ভাড়া';

  @override
  String optionsOfferHint(String rec, String min) {
    return 'প্রস্তাবিত $rec · সর্বনিম্ন $min · নগদে';
  }

  @override
  String optionsFindDrivers(String fare) {
    return '$fare-এ চালক খুঁজুন';
  }

  @override
  String get optionsLower => 'ভাড়া 5 টাকা কমান';

  @override
  String get optionsRaise => 'ভাড়া 5 টাকা বাড়ান';

  @override
  String get optionsEstimating => 'ভাড়া হিসাব হচ্ছে…';

  @override
  String get offersFinding => 'চালক খোঁজা হচ্ছে';

  @override
  String offersYourOffer(String fare, String vehicle) {
    return 'আপনার অফার $fare · $vehicle';
  }

  @override
  String offersRaise(String fare) {
    return '$fare-এ বাড়ান';
  }

  @override
  String offersCount(String count) {
    return 'অফার · $count';
  }

  @override
  String get offersSortPrice => 'কম দাম';

  @override
  String get offersSortEta => 'দ্রুত';

  @override
  String get offersEmpty =>
      'আশেপাশের চালকরা আপনার অনুরোধ পেয়েছেন। অফার এলে এখানে দেখাবে।';

  @override
  String offersMinAway(String min) {
    return '$min মিনিট দূরে';
  }

  @override
  String get offersMatches => 'আপনার ভাড়ায় রাজি';

  @override
  String get offersAccept => 'গ্রহণ করুন';

  @override
  String get offersDecline => 'বাদ দিন';

  @override
  String get offersUnavailable => 'এই অফারটি আর নেই। অন্য একটি বেছে নিন।';

  @override
  String tripDriverComing(String min) {
    return 'চালক আসছেন · $min মিনিট';
  }

  @override
  String get tripOnTrip => 'আপনি যাত্রায় আছেন';

  @override
  String get tripPickup => 'পিকআপ';

  @override
  String get tripDropoff => 'গন্তব্য';

  @override
  String get tripCall => 'কল';

  @override
  String get tripShare => 'শেয়ার';

  @override
  String get tripSafety => 'নিরাপত্তা';

  @override
  String get tripShareCopied =>
      'ট্রিপের তথ্য কপি হয়েছে। হোয়াটসঅ্যাপ বা এসএমএসে পাঠান।';

  @override
  String tripShareText(
    String driver,
    String vehicle,
    String phone,
    String pickup,
    String dropoff,
    String link,
  ) {
    return 'চলো ভৈরব ট্রিপ: $driver, $vehicle, $phone। $pickup থেকে $dropoff। লাইভ ট্র্যাকিং: $link';
  }

  @override
  String tripCallFailed(String phone) {
    return '$phone নম্বরে কল করুন';
  }

  @override
  String get tripDemoComplete => 'ডেমো: ট্রিপ শেষ করুন';

  @override
  String get tripCancel => 'রাইড বাতিল';

  @override
  String get tripCancelTitle => 'রাইড বাতিল করবেন?';

  @override
  String get tripCancelBody => 'চালককে জানিয়ে দেওয়া হবে।';

  @override
  String get tripArrived => 'চালক পৌঁছেছেন';

  @override
  String get tripCancelConfirm => 'হ্যাঁ, বাতিল করুন';

  @override
  String get tripKeep => 'রাইড রাখুন';

  @override
  String get tripSosActive => 'SOS চালু · নিরাপত্তা টিমকে জানানো হয়েছে';

  @override
  String get safetyTitle => 'নিরাপত্তা';

  @override
  String get safetySendSos => 'SOS পাঠান';

  @override
  String get safetySosOn => 'SOS চালু আছে';

  @override
  String get safetyExplain =>
      'SOS চাপলে চলো ভৈরব নিরাপত্তা টিম আপনার ট্রিপ ও অবস্থান দেখতে পাবে। বিপদে 999-এ কল করুন।';

  @override
  String get safetyImSafe => 'আমি নিরাপদ আছি';

  @override
  String get safetySosSent => 'SOS পাঠানো হয়েছে';

  @override
  String get safetySosResolved => 'SOS বন্ধ করা হয়েছে';

  @override
  String get safetyNumbers => 'জরুরি নম্বর';

  @override
  String get safetyNational => 'জাতীয় জরুরি সেবা';

  @override
  String get safetyHealth => 'স্বাস্থ্য বাতায়ন';

  @override
  String get receiptTitle => 'ট্রিপ শেষ';

  @override
  String get receiptPayCash => 'চালককে নগদে দিন';

  @override
  String get receiptDriver => 'চালক';

  @override
  String get receiptRoute => 'রুট';

  @override
  String receiptRouteValue(String pickup, String dropoff) {
    return '$pickup থেকে $dropoff';
  }

  @override
  String get searchTitle => 'রাইডের পরিকল্পনা';

  @override
  String get searchPickupHint => 'পিকআপ কোথায়?';

  @override
  String get searchSwap => 'পিকআপ ও গন্তব্য অদলবদল';

  @override
  String get searchOnMap => 'ম্যাপে বেছে নিন';

  @override
  String searchNoResults(String query) {
    return '\"$query\" নামে কোনো জায়গা পাওয়া যায়নি';
  }

  @override
  String get pickTitlePickup => 'পিকআপের জায়গা বেছে নিন';

  @override
  String get pickTitleDropoff => 'গন্তব্য বেছে নিন';

  @override
  String pickNear(String place) {
    return '$place-এর কাছে';
  }

  @override
  String get pickConfirmPickup => 'এখান থেকে নিন';

  @override
  String get pickConfirmDropoff => 'এখানে নামাবেন';

  @override
  String get pickOutside => 'এই জায়গা সেবা এলাকার বাইরে';

  @override
  String get intercityTitle => 'ইন্টারসিটি';

  @override
  String get intercitySubtitle => 'সিট শেয়ার করুন বা পুরো গাড়ি নিন।';

  @override
  String intercityFrom(String place, String vehicle) {
    return '$place থেকে · $vehicle';
  }

  @override
  String intercityPrices(String seat, String whole) {
    return 'সিট $seat · পুরো গাড়ি $whole';
  }

  @override
  String get intercitySeatShare => 'সিট শেয়ার';

  @override
  String get intercityWhole => 'পুরো গাড়ি';

  @override
  String get intercitySeats => 'সিট';

  @override
  String get intercityDeparture => 'ছাড়ার সময়';

  @override
  String intercityBook(String fare) {
    return 'বুক করুন · $fare';
  }

  @override
  String get accountTitle => 'অ্যাকাউন্ট';

  @override
  String get accountLanguage => 'ভাষা';

  @override
  String get accountLogout => 'লগ আউট';

  @override
  String get accountServer => 'সার্ভার';

  @override
  String get accountServerLive => 'সংযুক্ত';

  @override
  String get languageBangla => 'বাংলা';

  @override
  String get languageEnglish => 'English';
}
