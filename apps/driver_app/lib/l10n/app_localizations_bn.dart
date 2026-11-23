// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Bengali Bangla (`bn`).
class AppLocalizationsBn extends AppLocalizations {
  AppLocalizationsBn([String locale = 'bn']) : super(locale);

  @override
  String get appTitle => 'চলো ভৈরব চালক';

  @override
  String get commonCancel => 'বাতিল';

  @override
  String get commonDone => 'ঠিক আছে';

  @override
  String get commonClose => 'বন্ধ করুন';

  @override
  String get commonCash => 'নগদ';

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
  String get commonLower => 'ভাড়া 5 টাকা কমান';

  @override
  String get commonRaise => 'ভাড়া 5 টাকা বাড়ান';

  @override
  String get vehicleEasybike => 'ইজিবাইক';

  @override
  String get vehicleBike => 'বাইক';

  @override
  String get vehicleCng => 'সিএনজি';

  @override
  String get vehicleMicrobus => 'মাইক্রোবাস';

  @override
  String get navHome => 'হোম';

  @override
  String get navWallet => 'ওয়ালেট';

  @override
  String get navAccount => 'অ্যাকাউন্ট';

  @override
  String get homeOffline => 'অফলাইন';

  @override
  String get homeOnline => 'অনলাইন';

  @override
  String get homeConnecting => 'সংযোগ হচ্ছে';

  @override
  String homeLocation(String place) {
    return 'আপনার অবস্থান: $place';
  }

  @override
  String get homeGoOnline => 'অনলাইনে যান';

  @override
  String get homeGoOffline => 'অফলাইনে যান';

  @override
  String homeWaiting(String place) {
    return 'ট্রিপের অপেক্ষায় · $place';
  }

  @override
  String get homeOfflineHint => 'অনলাইনে গেলে আশেপাশের ট্রিপ রিকোয়েস্ট পাবেন।';

  @override
  String get homeDemoRequest => 'ডেমো: একটি টেস্ট রিকোয়েস্ট পাঠান';

  @override
  String get homeMute => 'ভয়েস অ্যালার্ট বন্ধ করুন';

  @override
  String get homeUnmute => 'ভয়েস অ্যালার্ট চালু করুন';

  @override
  String get homeChooseLocation => 'আপনার অবস্থান বেছে নিন';

  @override
  String get lockTitle => 'ব্যালেন্স কম, বিড বন্ধ';

  @override
  String lockBody(String min, String balance) {
    return 'বিড করতে কমপক্ষে $min লাগবে। আপনার আছে $balance।';
  }

  @override
  String lockTopup(String amount) {
    return 'বিকাশে $amount টপ আপ';
  }

  @override
  String get reqNewTrip => 'নতুন ট্রিপ';

  @override
  String get reqReplay => 'আবার শুনুন';

  @override
  String reqPickupAway(String km) {
    return 'পিকআপ · $km কিমি দূরে';
  }

  @override
  String reqDropoffTrip(String km) {
    return 'ড্রপ · $km কিমি ট্রিপ';
  }

  @override
  String get reqPickup => 'পিকআপ';

  @override
  String get reqDropoff => 'ড্রপ';

  @override
  String get reqOffer => 'যাত্রীর অফার';

  @override
  String get reqEta => 'পিকআপে পৌঁছাতে';

  @override
  String reqAccept(String fare) {
    return '$fare-এ গ্রহণ করুন';
  }

  @override
  String get reqCounter => 'অথবা পাল্টা অফার';

  @override
  String get reqOther => 'অন্য পরিমাণ';

  @override
  String get reqIgnore => 'বাদ দিন';

  @override
  String get reqLocked => 'বিড করতে আগে টপ আপ করুন';

  @override
  String get reqError => 'অফার পাঠানো যায়নি। আবার চেষ্টা করুন।';

  @override
  String reqSent(String fare) {
    return 'আপনার $fare অফার পাঠানো হয়েছে';
  }

  @override
  String get reqSentHint => 'যাত্রী আপনাকে বেছে নিলে ট্রিপ শুরু হবে।';

  @override
  String get reqExpired => 'যাত্রী এখনো কাউকে বেছে নেননি';

  @override
  String get reqDemoAccept => 'ডেমো: যাত্রী গ্রহণ করলেন';

  @override
  String get reqYourFare => 'আপনার ভাড়া';

  @override
  String reqSend(String fare) {
    return '$fare পাঠান';
  }

  @override
  String reqSecondsLeft(String s) {
    return '$s সেকেন্ড বাকি';
  }

  @override
  String get tripGoPickup => 'পিকআপে যান';

  @override
  String get tripWaitPassenger => 'যাত্রীর জন্য অপেক্ষা করুন';

  @override
  String get tripDriveDropoff => 'গন্তব্যে যান';

  @override
  String get tripCallPassenger => 'যাত্রীকে কল করুন';

  @override
  String tripCallFailed(String phone) {
    return '$phone নম্বরে কল করুন';
  }

  @override
  String get tripArrived => 'পৌঁছেছি';

  @override
  String get tripStart => 'ট্রিপ শুরু করুন';

  @override
  String tripComplete(String fare) {
    return 'শেষ · $fare নগদ নিন';
  }

  @override
  String tripConfirmTitle(String fare) {
    return '$fare নগদ পেয়েছেন?';
  }

  @override
  String get tripConfirmYes => 'হ্যাঁ, পেয়েছি';

  @override
  String get tripConfirmNo => 'এখনো না';

  @override
  String get sumTitle => 'ট্রিপ শেষ · নগদ নিন';

  @override
  String get sumFare => 'ভাড়া (নগদ)';

  @override
  String get sumCommission => 'কমিশন (8%)';

  @override
  String get sumKeep => 'আপনার আয়';

  @override
  String get sumBalance => 'নতুন ব্যালেন্স';

  @override
  String get walletTitle => 'ওয়ালেট';

  @override
  String get walletBalance => 'ব্যালেন্স';

  @override
  String get walletBiddingOn => 'বিডিং চালু';

  @override
  String get walletBiddingOff => 'বিডিং বন্ধ';

  @override
  String walletMinHint(String min) {
    return 'ট্রিপ ও বিডের জন্য কমপক্ষে $min লাগবে।';
  }

  @override
  String get walletTopup => 'টপ আপ';

  @override
  String walletTopupWith(String method, String amount) {
    return '$method-এ $amount টপ আপ';
  }

  @override
  String get walletCommissionNote =>
      'প্রতি ট্রিপ শেষে ভাড়ার 8% কমিশন কাটা হয়।';

  @override
  String get walletHistory => 'ইতিহাস';

  @override
  String get walletEmpty => 'এখনো কোনো লেনদেন নেই।';

  @override
  String get walletOfflineDemo => 'অফলাইন ডেমো · কোনো টাকা কাটা হয়নি।';

  @override
  String get txBkash => 'বিকাশ টপ আপ';

  @override
  String get txNagad => 'নগদ টপ আপ';

  @override
  String get txCommission => 'কমিশন';

  @override
  String get txBonus => 'বোনাস';

  @override
  String get txOther => 'লেনদেন';

  @override
  String get topupConnecting => 'বিকাশে সংযোগ হচ্ছে…';

  @override
  String get topupMerchant => 'মার্চেন্ট';

  @override
  String get topupAmount => 'পরিমাণ';

  @override
  String get topupInvoice => 'ইনভয়েস';

  @override
  String get topupAccount => 'বিকাশ অ্যাকাউন্ট নম্বর';

  @override
  String topupPay(String amount) {
    return '$amount পে করুন';
  }

  @override
  String get topupSuccess => 'টপ আপ সফল';

  @override
  String get topupTrx => 'ট্রানজেকশন আইডি';

  @override
  String get topupFailed => 'টপ আপ হয়নি। আবার চেষ্টা করুন।';

  @override
  String topupNagadDone(String balance) {
    return 'নগদ টপ আপ সফল · নতুন ব্যালেন্স $balance';
  }

  @override
  String get accountTitle => 'অ্যাকাউন্ট';

  @override
  String get accountDocuments => 'কাগজপত্র';

  @override
  String get accountVoice => 'ভয়েস অ্যালার্ট';

  @override
  String get accountLanguage => 'ভাষা';

  @override
  String get accountDemoTools => 'ডেমো টুলস';

  @override
  String get accountLowBalanceMode => 'কম ব্যালেন্স মোড';

  @override
  String get accountServer => 'সার্ভার';

  @override
  String get accountServerLive => 'সংযুক্ত';

  @override
  String get accountServerOffline => 'অফলাইন';

  @override
  String get kycApproved => 'অনুমোদিত';

  @override
  String get kycPending => 'যাচাই হচ্ছে';

  @override
  String get kycRejected => 'বাতিল';

  @override
  String get voiceOn => 'চালু';

  @override
  String get voiceOff => 'বন্ধ';

  @override
  String get languageBangla => 'বাংলা';

  @override
  String get languageEnglish => 'English';

  @override
  String kycStatus(String status) {
    return 'অবস্থা: $status';
  }

  @override
  String get kycVehicleType => 'গাড়ির ধরন';

  @override
  String get kycEasybikeHint => 'পৌরসভা ও ইউনিয়ন রুট';

  @override
  String get kycCngHint => 'ভৈরব-কুলিয়ারচর-বাজিতপুর রুট';

  @override
  String get kycBikeHint => 'দ্রুত, একজন যাত্রী';

  @override
  String get kycMicrobusHint => 'হাইওয়ে ও রিজার্ভ ট্রিপ';

  @override
  String get kycName => 'পুরো নাম';

  @override
  String get kycPhone => 'মোবাইল নম্বর';

  @override
  String get kycNid => 'জাতীয় পরিচয়পত্র নম্বর';

  @override
  String get kycModel => 'গাড়ির মডেল';

  @override
  String get kycRegistration => 'রেজিস্ট্রেশন / টোকেন নম্বর';

  @override
  String get kycCouncilor => 'ওয়ার্ড কাউন্সিলরের প্রত্যয়নপত্র নম্বর';

  @override
  String get kycBrta => 'বিআরটিএ ড্রাইভিং লাইসেন্স নম্বর';

  @override
  String get kycRequired => 'এটি পূরণ করুন';

  @override
  String get kycPhoneInvalid => 'সঠিক 11 সংখ্যার মোবাইল নম্বর দিন';

  @override
  String get kycNidInvalid => 'কমপক্ষে 10 সংখ্যা দিন';

  @override
  String get kycSubmit => 'জমা দিন';

  @override
  String kycSubmitted(String status) {
    return 'আবেদন জমা হয়েছে · $status';
  }

  @override
  String get voiceSwitch => 'ভয়েস অ্যালার্ট চালু রাখুন';

  @override
  String get voiceExplain =>
      'নতুন ট্রিপ এলে শব্দ ও কম্পন দিয়ে জানানো হয়। কী জানানো হয়েছিল তা নিচে লেখা থাকে।';

  @override
  String get voiceTest => 'টেস্ট করুন';

  @override
  String get voiceTestTrip => 'নতুন ট্রিপ';

  @override
  String get voiceTestConfirmed => 'রাইড কনফার্ম';

  @override
  String get voiceTestLowBalance => 'কম ব্যালেন্স';

  @override
  String get voiceHistory => 'ইতিহাস';

  @override
  String get voiceClear => 'মুছে ফেলুন';

  @override
  String get voiceEmpty => 'এখনো কোনো অ্যালার্ট নেই।';
}
