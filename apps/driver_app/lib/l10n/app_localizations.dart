import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_bn.dart';
import 'app_localizations_en.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('bn'),
    Locale('en'),
  ];

  /// No description provided for @appTitle.
  ///
  /// In bn, this message translates to:
  /// **'চলো ভৈরব চালক'**
  String get appTitle;

  /// No description provided for @commonCancel.
  ///
  /// In bn, this message translates to:
  /// **'বাতিল'**
  String get commonCancel;

  /// No description provided for @commonDone.
  ///
  /// In bn, this message translates to:
  /// **'ঠিক আছে'**
  String get commonDone;

  /// No description provided for @commonClose.
  ///
  /// In bn, this message translates to:
  /// **'বন্ধ করুন'**
  String get commonClose;

  /// No description provided for @commonCash.
  ///
  /// In bn, this message translates to:
  /// **'নগদ'**
  String get commonCash;

  /// No description provided for @commonDemo.
  ///
  /// In bn, this message translates to:
  /// **'ডেমো'**
  String get commonDemo;

  /// No description provided for @commonKm.
  ///
  /// In bn, this message translates to:
  /// **'{km} কিমি'**
  String commonKm(String km);

  /// No description provided for @commonMinutes.
  ///
  /// In bn, this message translates to:
  /// **'{min} মিনিট'**
  String commonMinutes(String min);

  /// No description provided for @commonServerError.
  ///
  /// In bn, this message translates to:
  /// **'সার্ভারে পৌঁছানো যাচ্ছে না। ইন্টারনেট দেখে আবার চেষ্টা করুন।'**
  String get commonServerError;

  /// No description provided for @commonLower.
  ///
  /// In bn, this message translates to:
  /// **'ভাড়া 5 টাকা কমান'**
  String get commonLower;

  /// No description provided for @commonRaise.
  ///
  /// In bn, this message translates to:
  /// **'ভাড়া 5 টাকা বাড়ান'**
  String get commonRaise;

  /// No description provided for @vehicleEasybike.
  ///
  /// In bn, this message translates to:
  /// **'ইজিবাইক'**
  String get vehicleEasybike;

  /// No description provided for @vehicleBike.
  ///
  /// In bn, this message translates to:
  /// **'বাইক'**
  String get vehicleBike;

  /// No description provided for @vehicleCng.
  ///
  /// In bn, this message translates to:
  /// **'সিএনজি'**
  String get vehicleCng;

  /// No description provided for @vehicleMicrobus.
  ///
  /// In bn, this message translates to:
  /// **'মাইক্রোবাস'**
  String get vehicleMicrobus;

  /// No description provided for @navHome.
  ///
  /// In bn, this message translates to:
  /// **'হোম'**
  String get navHome;

  /// No description provided for @navWallet.
  ///
  /// In bn, this message translates to:
  /// **'ওয়ালেট'**
  String get navWallet;

  /// No description provided for @navAccount.
  ///
  /// In bn, this message translates to:
  /// **'অ্যাকাউন্ট'**
  String get navAccount;

  /// No description provided for @homeOffline.
  ///
  /// In bn, this message translates to:
  /// **'অফলাইন'**
  String get homeOffline;

  /// No description provided for @homeOnline.
  ///
  /// In bn, this message translates to:
  /// **'অনলাইন'**
  String get homeOnline;

  /// No description provided for @homeConnecting.
  ///
  /// In bn, this message translates to:
  /// **'সংযোগ হচ্ছে'**
  String get homeConnecting;

  /// No description provided for @homeLocation.
  ///
  /// In bn, this message translates to:
  /// **'আপনার অবস্থান: {place}'**
  String homeLocation(String place);

  /// No description provided for @homeGoOnline.
  ///
  /// In bn, this message translates to:
  /// **'অনলাইনে যান'**
  String get homeGoOnline;

  /// No description provided for @homeGoOffline.
  ///
  /// In bn, this message translates to:
  /// **'অফলাইনে যান'**
  String get homeGoOffline;

  /// No description provided for @homeWaiting.
  ///
  /// In bn, this message translates to:
  /// **'ট্রিপের অপেক্ষায় · {place}'**
  String homeWaiting(String place);

  /// No description provided for @homeOfflineHint.
  ///
  /// In bn, this message translates to:
  /// **'অনলাইনে গেলে আশেপাশের ট্রিপ রিকোয়েস্ট পাবেন।'**
  String get homeOfflineHint;

  /// No description provided for @homeDemoRequest.
  ///
  /// In bn, this message translates to:
  /// **'ডেমো: একটি টেস্ট রিকোয়েস্ট পাঠান'**
  String get homeDemoRequest;

  /// No description provided for @homeMute.
  ///
  /// In bn, this message translates to:
  /// **'ভয়েস অ্যালার্ট বন্ধ করুন'**
  String get homeMute;

  /// No description provided for @homeUnmute.
  ///
  /// In bn, this message translates to:
  /// **'ভয়েস অ্যালার্ট চালু করুন'**
  String get homeUnmute;

  /// No description provided for @homeChooseLocation.
  ///
  /// In bn, this message translates to:
  /// **'আপনার অবস্থান বেছে নিন'**
  String get homeChooseLocation;

  /// No description provided for @lockTitle.
  ///
  /// In bn, this message translates to:
  /// **'ব্যালেন্স কম, বিড বন্ধ'**
  String get lockTitle;

  /// No description provided for @lockBody.
  ///
  /// In bn, this message translates to:
  /// **'বিড করতে কমপক্ষে {min} লাগবে। আপনার আছে {balance}।'**
  String lockBody(String min, String balance);

  /// No description provided for @lockTopup.
  ///
  /// In bn, this message translates to:
  /// **'বিকাশে {amount} টপ আপ'**
  String lockTopup(String amount);

  /// No description provided for @reqNewTrip.
  ///
  /// In bn, this message translates to:
  /// **'নতুন ট্রিপ'**
  String get reqNewTrip;

  /// No description provided for @reqReplay.
  ///
  /// In bn, this message translates to:
  /// **'আবার শুনুন'**
  String get reqReplay;

  /// No description provided for @reqPickupAway.
  ///
  /// In bn, this message translates to:
  /// **'পিকআপ · {km} কিমি দূরে'**
  String reqPickupAway(String km);

  /// No description provided for @reqDropoffTrip.
  ///
  /// In bn, this message translates to:
  /// **'ড্রপ · {km} কিমি ট্রিপ'**
  String reqDropoffTrip(String km);

  /// No description provided for @reqPickup.
  ///
  /// In bn, this message translates to:
  /// **'পিকআপ'**
  String get reqPickup;

  /// No description provided for @reqDropoff.
  ///
  /// In bn, this message translates to:
  /// **'ড্রপ'**
  String get reqDropoff;

  /// No description provided for @reqOffer.
  ///
  /// In bn, this message translates to:
  /// **'যাত্রীর অফার'**
  String get reqOffer;

  /// No description provided for @reqEta.
  ///
  /// In bn, this message translates to:
  /// **'পিকআপে পৌঁছাতে'**
  String get reqEta;

  /// No description provided for @reqAccept.
  ///
  /// In bn, this message translates to:
  /// **'{fare}-এ গ্রহণ করুন'**
  String reqAccept(String fare);

  /// No description provided for @reqCounter.
  ///
  /// In bn, this message translates to:
  /// **'অথবা পাল্টা অফার'**
  String get reqCounter;

  /// No description provided for @reqOther.
  ///
  /// In bn, this message translates to:
  /// **'অন্য পরিমাণ'**
  String get reqOther;

  /// No description provided for @reqIgnore.
  ///
  /// In bn, this message translates to:
  /// **'বাদ দিন'**
  String get reqIgnore;

  /// No description provided for @reqLocked.
  ///
  /// In bn, this message translates to:
  /// **'বিড করতে আগে টপ আপ করুন'**
  String get reqLocked;

  /// No description provided for @reqError.
  ///
  /// In bn, this message translates to:
  /// **'অফার পাঠানো যায়নি। আবার চেষ্টা করুন।'**
  String get reqError;

  /// No description provided for @reqSent.
  ///
  /// In bn, this message translates to:
  /// **'আপনার {fare} অফার পাঠানো হয়েছে'**
  String reqSent(String fare);

  /// No description provided for @reqSentHint.
  ///
  /// In bn, this message translates to:
  /// **'যাত্রী আপনাকে বেছে নিলে ট্রিপ শুরু হবে।'**
  String get reqSentHint;

  /// No description provided for @reqExpired.
  ///
  /// In bn, this message translates to:
  /// **'যাত্রী এখনো কাউকে বেছে নেননি'**
  String get reqExpired;

  /// No description provided for @reqDemoAccept.
  ///
  /// In bn, this message translates to:
  /// **'ডেমো: যাত্রী গ্রহণ করলেন'**
  String get reqDemoAccept;

  /// No description provided for @reqYourFare.
  ///
  /// In bn, this message translates to:
  /// **'আপনার ভাড়া'**
  String get reqYourFare;

  /// No description provided for @reqSend.
  ///
  /// In bn, this message translates to:
  /// **'{fare} পাঠান'**
  String reqSend(String fare);

  /// No description provided for @reqSecondsLeft.
  ///
  /// In bn, this message translates to:
  /// **'{s} সেকেন্ড বাকি'**
  String reqSecondsLeft(String s);

  /// No description provided for @tripGoPickup.
  ///
  /// In bn, this message translates to:
  /// **'পিকআপে যান'**
  String get tripGoPickup;

  /// No description provided for @tripWaitPassenger.
  ///
  /// In bn, this message translates to:
  /// **'যাত্রীর জন্য অপেক্ষা করুন'**
  String get tripWaitPassenger;

  /// No description provided for @tripDriveDropoff.
  ///
  /// In bn, this message translates to:
  /// **'গন্তব্যে যান'**
  String get tripDriveDropoff;

  /// No description provided for @tripCallPassenger.
  ///
  /// In bn, this message translates to:
  /// **'যাত্রীকে কল করুন'**
  String get tripCallPassenger;

  /// No description provided for @tripCallFailed.
  ///
  /// In bn, this message translates to:
  /// **'{phone} নম্বরে কল করুন'**
  String tripCallFailed(String phone);

  /// No description provided for @tripArrived.
  ///
  /// In bn, this message translates to:
  /// **'পৌঁছেছি'**
  String get tripArrived;

  /// No description provided for @tripStart.
  ///
  /// In bn, this message translates to:
  /// **'ট্রিপ শুরু করুন'**
  String get tripStart;

  /// No description provided for @tripComplete.
  ///
  /// In bn, this message translates to:
  /// **'শেষ · {fare} নগদ নিন'**
  String tripComplete(String fare);

  /// No description provided for @tripConfirmTitle.
  ///
  /// In bn, this message translates to:
  /// **'{fare} নগদ পেয়েছেন?'**
  String tripConfirmTitle(String fare);

  /// No description provided for @tripConfirmYes.
  ///
  /// In bn, this message translates to:
  /// **'হ্যাঁ, পেয়েছি'**
  String get tripConfirmYes;

  /// No description provided for @tripConfirmNo.
  ///
  /// In bn, this message translates to:
  /// **'এখনো না'**
  String get tripConfirmNo;

  /// No description provided for @sumTitle.
  ///
  /// In bn, this message translates to:
  /// **'ট্রিপ শেষ · নগদ নিন'**
  String get sumTitle;

  /// No description provided for @sumFare.
  ///
  /// In bn, this message translates to:
  /// **'ভাড়া (নগদ)'**
  String get sumFare;

  /// No description provided for @sumCommission.
  ///
  /// In bn, this message translates to:
  /// **'কমিশন (8%)'**
  String get sumCommission;

  /// No description provided for @sumKeep.
  ///
  /// In bn, this message translates to:
  /// **'আপনার আয়'**
  String get sumKeep;

  /// No description provided for @sumBalance.
  ///
  /// In bn, this message translates to:
  /// **'নতুন ব্যালেন্স'**
  String get sumBalance;

  /// No description provided for @walletTitle.
  ///
  /// In bn, this message translates to:
  /// **'ওয়ালেট'**
  String get walletTitle;

  /// No description provided for @walletBalance.
  ///
  /// In bn, this message translates to:
  /// **'ব্যালেন্স'**
  String get walletBalance;

  /// No description provided for @walletBiddingOn.
  ///
  /// In bn, this message translates to:
  /// **'বিডিং চালু'**
  String get walletBiddingOn;

  /// No description provided for @walletBiddingOff.
  ///
  /// In bn, this message translates to:
  /// **'বিডিং বন্ধ'**
  String get walletBiddingOff;

  /// No description provided for @walletMinHint.
  ///
  /// In bn, this message translates to:
  /// **'ট্রিপ ও বিডের জন্য কমপক্ষে {min} লাগবে।'**
  String walletMinHint(String min);

  /// No description provided for @walletTopup.
  ///
  /// In bn, this message translates to:
  /// **'টপ আপ'**
  String get walletTopup;

  /// No description provided for @walletTopupWith.
  ///
  /// In bn, this message translates to:
  /// **'{method}-এ {amount} টপ আপ'**
  String walletTopupWith(String method, String amount);

  /// No description provided for @walletCommissionNote.
  ///
  /// In bn, this message translates to:
  /// **'প্রতি ট্রিপ শেষে ভাড়ার 8% কমিশন কাটা হয়।'**
  String get walletCommissionNote;

  /// No description provided for @walletHistory.
  ///
  /// In bn, this message translates to:
  /// **'ইতিহাস'**
  String get walletHistory;

  /// No description provided for @walletEmpty.
  ///
  /// In bn, this message translates to:
  /// **'এখনো কোনো লেনদেন নেই।'**
  String get walletEmpty;

  /// No description provided for @walletOfflineDemo.
  ///
  /// In bn, this message translates to:
  /// **'অফলাইন ডেমো · কোনো টাকা কাটা হয়নি।'**
  String get walletOfflineDemo;

  /// No description provided for @txBkash.
  ///
  /// In bn, this message translates to:
  /// **'বিকাশ টপ আপ'**
  String get txBkash;

  /// No description provided for @txNagad.
  ///
  /// In bn, this message translates to:
  /// **'নগদ টপ আপ'**
  String get txNagad;

  /// No description provided for @txCommission.
  ///
  /// In bn, this message translates to:
  /// **'কমিশন'**
  String get txCommission;

  /// No description provided for @txBonus.
  ///
  /// In bn, this message translates to:
  /// **'বোনাস'**
  String get txBonus;

  /// No description provided for @txOther.
  ///
  /// In bn, this message translates to:
  /// **'লেনদেন'**
  String get txOther;

  /// No description provided for @topupConnecting.
  ///
  /// In bn, this message translates to:
  /// **'বিকাশে সংযোগ হচ্ছে…'**
  String get topupConnecting;

  /// No description provided for @topupMerchant.
  ///
  /// In bn, this message translates to:
  /// **'মার্চেন্ট'**
  String get topupMerchant;

  /// No description provided for @topupAmount.
  ///
  /// In bn, this message translates to:
  /// **'পরিমাণ'**
  String get topupAmount;

  /// No description provided for @topupInvoice.
  ///
  /// In bn, this message translates to:
  /// **'ইনভয়েস'**
  String get topupInvoice;

  /// No description provided for @topupAccount.
  ///
  /// In bn, this message translates to:
  /// **'বিকাশ অ্যাকাউন্ট নম্বর'**
  String get topupAccount;

  /// No description provided for @topupPay.
  ///
  /// In bn, this message translates to:
  /// **'{amount} পে করুন'**
  String topupPay(String amount);

  /// No description provided for @topupSuccess.
  ///
  /// In bn, this message translates to:
  /// **'টপ আপ সফল'**
  String get topupSuccess;

  /// No description provided for @topupTrx.
  ///
  /// In bn, this message translates to:
  /// **'ট্রানজেকশন আইডি'**
  String get topupTrx;

  /// No description provided for @topupFailed.
  ///
  /// In bn, this message translates to:
  /// **'টপ আপ হয়নি। আবার চেষ্টা করুন।'**
  String get topupFailed;

  /// No description provided for @topupNagadDone.
  ///
  /// In bn, this message translates to:
  /// **'নগদ টপ আপ সফল · নতুন ব্যালেন্স {balance}'**
  String topupNagadDone(String balance);

  /// No description provided for @accountTitle.
  ///
  /// In bn, this message translates to:
  /// **'অ্যাকাউন্ট'**
  String get accountTitle;

  /// No description provided for @accountDocuments.
  ///
  /// In bn, this message translates to:
  /// **'কাগজপত্র'**
  String get accountDocuments;

  /// No description provided for @accountVoice.
  ///
  /// In bn, this message translates to:
  /// **'ভয়েস অ্যালার্ট'**
  String get accountVoice;

  /// No description provided for @accountLanguage.
  ///
  /// In bn, this message translates to:
  /// **'ভাষা'**
  String get accountLanguage;

  /// No description provided for @accountDemoTools.
  ///
  /// In bn, this message translates to:
  /// **'ডেমো টুলস'**
  String get accountDemoTools;

  /// No description provided for @accountLowBalanceMode.
  ///
  /// In bn, this message translates to:
  /// **'কম ব্যালেন্স মোড'**
  String get accountLowBalanceMode;

  /// No description provided for @accountServer.
  ///
  /// In bn, this message translates to:
  /// **'সার্ভার'**
  String get accountServer;

  /// No description provided for @accountServerLive.
  ///
  /// In bn, this message translates to:
  /// **'সংযুক্ত'**
  String get accountServerLive;

  /// No description provided for @accountServerOffline.
  ///
  /// In bn, this message translates to:
  /// **'অফলাইন'**
  String get accountServerOffline;

  /// No description provided for @kycApproved.
  ///
  /// In bn, this message translates to:
  /// **'অনুমোদিত'**
  String get kycApproved;

  /// No description provided for @kycPending.
  ///
  /// In bn, this message translates to:
  /// **'যাচাই হচ্ছে'**
  String get kycPending;

  /// No description provided for @kycRejected.
  ///
  /// In bn, this message translates to:
  /// **'বাতিল'**
  String get kycRejected;

  /// No description provided for @voiceOn.
  ///
  /// In bn, this message translates to:
  /// **'চালু'**
  String get voiceOn;

  /// No description provided for @voiceOff.
  ///
  /// In bn, this message translates to:
  /// **'বন্ধ'**
  String get voiceOff;

  /// No description provided for @languageBangla.
  ///
  /// In bn, this message translates to:
  /// **'বাংলা'**
  String get languageBangla;

  /// No description provided for @languageEnglish.
  ///
  /// In bn, this message translates to:
  /// **'English'**
  String get languageEnglish;

  /// No description provided for @kycStatus.
  ///
  /// In bn, this message translates to:
  /// **'অবস্থা: {status}'**
  String kycStatus(String status);

  /// No description provided for @kycVehicleType.
  ///
  /// In bn, this message translates to:
  /// **'গাড়ির ধরন'**
  String get kycVehicleType;

  /// No description provided for @kycEasybikeHint.
  ///
  /// In bn, this message translates to:
  /// **'পৌরসভা ও ইউনিয়ন রুট'**
  String get kycEasybikeHint;

  /// No description provided for @kycCngHint.
  ///
  /// In bn, this message translates to:
  /// **'ভৈরব-কুলিয়ারচর-বাজিতপুর রুট'**
  String get kycCngHint;

  /// No description provided for @kycBikeHint.
  ///
  /// In bn, this message translates to:
  /// **'দ্রুত, একজন যাত্রী'**
  String get kycBikeHint;

  /// No description provided for @kycMicrobusHint.
  ///
  /// In bn, this message translates to:
  /// **'হাইওয়ে ও রিজার্ভ ট্রিপ'**
  String get kycMicrobusHint;

  /// No description provided for @kycName.
  ///
  /// In bn, this message translates to:
  /// **'পুরো নাম'**
  String get kycName;

  /// No description provided for @kycPhone.
  ///
  /// In bn, this message translates to:
  /// **'মোবাইল নম্বর'**
  String get kycPhone;

  /// No description provided for @kycNid.
  ///
  /// In bn, this message translates to:
  /// **'জাতীয় পরিচয়পত্র নম্বর'**
  String get kycNid;

  /// No description provided for @kycModel.
  ///
  /// In bn, this message translates to:
  /// **'গাড়ির মডেল'**
  String get kycModel;

  /// No description provided for @kycRegistration.
  ///
  /// In bn, this message translates to:
  /// **'রেজিস্ট্রেশন / টোকেন নম্বর'**
  String get kycRegistration;

  /// No description provided for @kycCouncilor.
  ///
  /// In bn, this message translates to:
  /// **'ওয়ার্ড কাউন্সিলরের প্রত্যয়নপত্র নম্বর'**
  String get kycCouncilor;

  /// No description provided for @kycBrta.
  ///
  /// In bn, this message translates to:
  /// **'বিআরটিএ ড্রাইভিং লাইসেন্স নম্বর'**
  String get kycBrta;

  /// No description provided for @kycRequired.
  ///
  /// In bn, this message translates to:
  /// **'এটি পূরণ করুন'**
  String get kycRequired;

  /// No description provided for @kycPhoneInvalid.
  ///
  /// In bn, this message translates to:
  /// **'সঠিক 11 সংখ্যার মোবাইল নম্বর দিন'**
  String get kycPhoneInvalid;

  /// No description provided for @kycNidInvalid.
  ///
  /// In bn, this message translates to:
  /// **'কমপক্ষে 10 সংখ্যা দিন'**
  String get kycNidInvalid;

  /// No description provided for @kycSubmit.
  ///
  /// In bn, this message translates to:
  /// **'জমা দিন'**
  String get kycSubmit;

  /// No description provided for @kycSubmitted.
  ///
  /// In bn, this message translates to:
  /// **'আবেদন জমা হয়েছে · {status}'**
  String kycSubmitted(String status);

  /// No description provided for @voiceSwitch.
  ///
  /// In bn, this message translates to:
  /// **'ভয়েস অ্যালার্ট চালু রাখুন'**
  String get voiceSwitch;

  /// No description provided for @voiceExplain.
  ///
  /// In bn, this message translates to:
  /// **'নতুন ট্রিপ এলে শব্দ ও কম্পন দিয়ে জানানো হয়। কী জানানো হয়েছিল তা নিচে লেখা থাকে।'**
  String get voiceExplain;

  /// No description provided for @voiceTest.
  ///
  /// In bn, this message translates to:
  /// **'টেস্ট করুন'**
  String get voiceTest;

  /// No description provided for @voiceTestTrip.
  ///
  /// In bn, this message translates to:
  /// **'নতুন ট্রিপ'**
  String get voiceTestTrip;

  /// No description provided for @voiceTestConfirmed.
  ///
  /// In bn, this message translates to:
  /// **'রাইড কনফার্ম'**
  String get voiceTestConfirmed;

  /// No description provided for @voiceTestLowBalance.
  ///
  /// In bn, this message translates to:
  /// **'কম ব্যালেন্স'**
  String get voiceTestLowBalance;

  /// No description provided for @voiceHistory.
  ///
  /// In bn, this message translates to:
  /// **'ইতিহাস'**
  String get voiceHistory;

  /// No description provided for @voiceClear.
  ///
  /// In bn, this message translates to:
  /// **'মুছে ফেলুন'**
  String get voiceClear;

  /// No description provided for @voiceEmpty.
  ///
  /// In bn, this message translates to:
  /// **'এখনো কোনো অ্যালার্ট নেই।'**
  String get voiceEmpty;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['bn', 'en'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'bn':
      return AppLocalizationsBn();
    case 'en':
      return AppLocalizationsEn();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
