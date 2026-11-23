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
  /// **'চলো ভৈরব'**
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

  /// No description provided for @commonContinue.
  ///
  /// In bn, this message translates to:
  /// **'চালিয়ে যান'**
  String get commonContinue;

  /// No description provided for @commonBack.
  ///
  /// In bn, this message translates to:
  /// **'ফিরে যান'**
  String get commonBack;

  /// No description provided for @commonCash.
  ///
  /// In bn, this message translates to:
  /// **'নগদে'**
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

  /// No description provided for @phoneTitle.
  ///
  /// In bn, this message translates to:
  /// **'আপনার মোবাইল নম্বর দিন'**
  String get phoneTitle;

  /// No description provided for @phoneSubtitle.
  ///
  /// In bn, this message translates to:
  /// **'6 সংখ্যার একটি কোড এসএমএস করে পাঠানো হবে।'**
  String get phoneSubtitle;

  /// No description provided for @phoneFieldLabel.
  ///
  /// In bn, this message translates to:
  /// **'মোবাইল নম্বর'**
  String get phoneFieldLabel;

  /// No description provided for @phoneInvalid.
  ///
  /// In bn, this message translates to:
  /// **'সঠিক 11 সংখ্যার মোবাইল নম্বর দিন'**
  String get phoneInvalid;

  /// No description provided for @phoneSend.
  ///
  /// In bn, this message translates to:
  /// **'কোড পাঠান'**
  String get phoneSend;

  /// No description provided for @phoneDemoSkip.
  ///
  /// In bn, this message translates to:
  /// **'ডেমো: লগইন ছাড়া চালিয়ে যান'**
  String get phoneDemoSkip;

  /// No description provided for @otpTitle.
  ///
  /// In bn, this message translates to:
  /// **'কোডটি লিখুন'**
  String get otpTitle;

  /// No description provided for @otpSentTo.
  ///
  /// In bn, this message translates to:
  /// **'{phone}-এ পাঠানো হয়েছে।'**
  String otpSentTo(String phone);

  /// No description provided for @otpChangeNumber.
  ///
  /// In bn, this message translates to:
  /// **'নম্বর বদলান'**
  String get otpChangeNumber;

  /// No description provided for @otpWrong.
  ///
  /// In bn, this message translates to:
  /// **'কোডটি ভুল। আবার চেষ্টা করুন।'**
  String get otpWrong;

  /// No description provided for @otpResendIn.
  ///
  /// In bn, this message translates to:
  /// **'আবার পাঠান {time}'**
  String otpResendIn(String time);

  /// No description provided for @otpResend.
  ///
  /// In bn, this message translates to:
  /// **'আবার পাঠান'**
  String get otpResend;

  /// No description provided for @otpVerify.
  ///
  /// In bn, this message translates to:
  /// **'যাচাই করুন'**
  String get otpVerify;

  /// No description provided for @otpDemoHint.
  ///
  /// In bn, this message translates to:
  /// **'ডেমো কোড: {code}'**
  String otpDemoHint(String code);

  /// No description provided for @nameTitle.
  ///
  /// In bn, this message translates to:
  /// **'আপনার নাম কী?'**
  String get nameTitle;

  /// No description provided for @nameSubtitle.
  ///
  /// In bn, this message translates to:
  /// **'বুক করলে চালক এই নামটি দেখবেন।'**
  String get nameSubtitle;

  /// No description provided for @nameField.
  ///
  /// In bn, this message translates to:
  /// **'পুরো নাম'**
  String get nameField;

  /// No description provided for @homeAccount.
  ///
  /// In bn, this message translates to:
  /// **'অ্যাকাউন্ট'**
  String get homeAccount;

  /// No description provided for @homePickupFrom.
  ///
  /// In bn, this message translates to:
  /// **'পিকআপ: {place}'**
  String homePickupFrom(String place);

  /// No description provided for @homeWhereTo.
  ///
  /// In bn, this message translates to:
  /// **'কোথায় যাবেন?'**
  String get homeWhereTo;

  /// No description provided for @homeServiceRide.
  ///
  /// In bn, this message translates to:
  /// **'রাইড'**
  String get homeServiceRide;

  /// No description provided for @homeServiceRideHint.
  ///
  /// In bn, this message translates to:
  /// **'বাইক · সিএনজি · ইজিবাইক'**
  String get homeServiceRideHint;

  /// No description provided for @homeServiceIntercity.
  ///
  /// In bn, this message translates to:
  /// **'ইন্টারসিটি'**
  String get homeServiceIntercity;

  /// No description provided for @homeServiceIntercityHint.
  ///
  /// In bn, this message translates to:
  /// **'ঢাকা · কিশোরগঞ্জ'**
  String get homeServiceIntercityHint;

  /// No description provided for @homeRecent.
  ///
  /// In bn, this message translates to:
  /// **'সাম্প্রতিক'**
  String get homeRecent;

  /// No description provided for @homePlaces.
  ///
  /// In bn, this message translates to:
  /// **'ভৈরবের জায়গা'**
  String get homePlaces;

  /// No description provided for @homeOfflineDemo.
  ///
  /// In bn, this message translates to:
  /// **'অফলাইন ডেমো'**
  String get homeOfflineDemo;

  /// No description provided for @homeNoConnection.
  ///
  /// In bn, this message translates to:
  /// **'সংযোগ নেই'**
  String get homeNoConnection;

  /// No description provided for @optionsChangeRoute.
  ///
  /// In bn, this message translates to:
  /// **'রুট বদলান'**
  String get optionsChangeRoute;

  /// No description provided for @optionsTripSummary.
  ///
  /// In bn, this message translates to:
  /// **'{km} কিমি · প্রায় {min} মিনিট'**
  String optionsTripSummary(String km, String min);

  /// No description provided for @optionsYourOffer.
  ///
  /// In bn, this message translates to:
  /// **'আপনার ভাড়া'**
  String get optionsYourOffer;

  /// No description provided for @optionsOfferHint.
  ///
  /// In bn, this message translates to:
  /// **'প্রস্তাবিত {rec} · সর্বনিম্ন {min} · নগদে'**
  String optionsOfferHint(String rec, String min);

  /// No description provided for @optionsFindDrivers.
  ///
  /// In bn, this message translates to:
  /// **'{fare}-এ চালক খুঁজুন'**
  String optionsFindDrivers(String fare);

  /// No description provided for @optionsLower.
  ///
  /// In bn, this message translates to:
  /// **'ভাড়া 5 টাকা কমান'**
  String get optionsLower;

  /// No description provided for @optionsRaise.
  ///
  /// In bn, this message translates to:
  /// **'ভাড়া 5 টাকা বাড়ান'**
  String get optionsRaise;

  /// No description provided for @optionsEstimating.
  ///
  /// In bn, this message translates to:
  /// **'ভাড়া হিসাব হচ্ছে…'**
  String get optionsEstimating;

  /// No description provided for @offersFinding.
  ///
  /// In bn, this message translates to:
  /// **'চালক খোঁজা হচ্ছে'**
  String get offersFinding;

  /// No description provided for @offersYourOffer.
  ///
  /// In bn, this message translates to:
  /// **'আপনার অফার {fare} · {vehicle}'**
  String offersYourOffer(String fare, String vehicle);

  /// No description provided for @offersRaise.
  ///
  /// In bn, this message translates to:
  /// **'{fare}-এ বাড়ান'**
  String offersRaise(String fare);

  /// No description provided for @offersCount.
  ///
  /// In bn, this message translates to:
  /// **'অফার · {count}'**
  String offersCount(String count);

  /// No description provided for @offersSortPrice.
  ///
  /// In bn, this message translates to:
  /// **'কম দাম'**
  String get offersSortPrice;

  /// No description provided for @offersSortEta.
  ///
  /// In bn, this message translates to:
  /// **'দ্রুত'**
  String get offersSortEta;

  /// No description provided for @offersEmpty.
  ///
  /// In bn, this message translates to:
  /// **'আশেপাশের চালকরা আপনার অনুরোধ পেয়েছেন। অফার এলে এখানে দেখাবে।'**
  String get offersEmpty;

  /// No description provided for @offersMinAway.
  ///
  /// In bn, this message translates to:
  /// **'{min} মিনিট দূরে'**
  String offersMinAway(String min);

  /// No description provided for @offersMatches.
  ///
  /// In bn, this message translates to:
  /// **'আপনার ভাড়ায় রাজি'**
  String get offersMatches;

  /// No description provided for @offersAccept.
  ///
  /// In bn, this message translates to:
  /// **'গ্রহণ করুন'**
  String get offersAccept;

  /// No description provided for @offersDecline.
  ///
  /// In bn, this message translates to:
  /// **'বাদ দিন'**
  String get offersDecline;

  /// No description provided for @offersUnavailable.
  ///
  /// In bn, this message translates to:
  /// **'এই অফারটি আর নেই। অন্য একটি বেছে নিন।'**
  String get offersUnavailable;

  /// No description provided for @tripDriverComing.
  ///
  /// In bn, this message translates to:
  /// **'চালক আসছেন · {min} মিনিট'**
  String tripDriverComing(String min);

  /// No description provided for @tripOnTrip.
  ///
  /// In bn, this message translates to:
  /// **'আপনি যাত্রায় আছেন'**
  String get tripOnTrip;

  /// No description provided for @tripPickup.
  ///
  /// In bn, this message translates to:
  /// **'পিকআপ'**
  String get tripPickup;

  /// No description provided for @tripDropoff.
  ///
  /// In bn, this message translates to:
  /// **'গন্তব্য'**
  String get tripDropoff;

  /// No description provided for @tripCall.
  ///
  /// In bn, this message translates to:
  /// **'কল'**
  String get tripCall;

  /// No description provided for @tripShare.
  ///
  /// In bn, this message translates to:
  /// **'শেয়ার'**
  String get tripShare;

  /// No description provided for @tripSafety.
  ///
  /// In bn, this message translates to:
  /// **'নিরাপত্তা'**
  String get tripSafety;

  /// No description provided for @tripShareCopied.
  ///
  /// In bn, this message translates to:
  /// **'ট্রিপের তথ্য কপি হয়েছে। হোয়াটসঅ্যাপ বা এসএমএসে পাঠান।'**
  String get tripShareCopied;

  /// No description provided for @tripShareText.
  ///
  /// In bn, this message translates to:
  /// **'চলো ভৈরব ট্রিপ: {driver}, {vehicle}, {phone}। {pickup} থেকে {dropoff}। লাইভ ট্র্যাকিং: {link}'**
  String tripShareText(
    String driver,
    String vehicle,
    String phone,
    String pickup,
    String dropoff,
    String link,
  );

  /// No description provided for @tripCallFailed.
  ///
  /// In bn, this message translates to:
  /// **'{phone} নম্বরে কল করুন'**
  String tripCallFailed(String phone);

  /// No description provided for @tripDemoComplete.
  ///
  /// In bn, this message translates to:
  /// **'ডেমো: ট্রিপ শেষ করুন'**
  String get tripDemoComplete;

  /// No description provided for @tripCancel.
  ///
  /// In bn, this message translates to:
  /// **'রাইড বাতিল'**
  String get tripCancel;

  /// No description provided for @tripCancelTitle.
  ///
  /// In bn, this message translates to:
  /// **'রাইড বাতিল করবেন?'**
  String get tripCancelTitle;

  /// No description provided for @tripCancelBody.
  ///
  /// In bn, this message translates to:
  /// **'চালক নিজে থেকে জানবেন না। বাতিলের আগে চালককে ফোন করে জানান।'**
  String get tripCancelBody;

  /// No description provided for @tripCancelConfirm.
  ///
  /// In bn, this message translates to:
  /// **'হ্যাঁ, বাতিল করুন'**
  String get tripCancelConfirm;

  /// No description provided for @tripKeep.
  ///
  /// In bn, this message translates to:
  /// **'রাইড রাখুন'**
  String get tripKeep;

  /// No description provided for @tripSosActive.
  ///
  /// In bn, this message translates to:
  /// **'SOS চালু · নিরাপত্তা টিমকে জানানো হয়েছে'**
  String get tripSosActive;

  /// No description provided for @safetyTitle.
  ///
  /// In bn, this message translates to:
  /// **'নিরাপত্তা'**
  String get safetyTitle;

  /// No description provided for @safetySendSos.
  ///
  /// In bn, this message translates to:
  /// **'SOS পাঠান'**
  String get safetySendSos;

  /// No description provided for @safetySosOn.
  ///
  /// In bn, this message translates to:
  /// **'SOS চালু আছে'**
  String get safetySosOn;

  /// No description provided for @safetyExplain.
  ///
  /// In bn, this message translates to:
  /// **'SOS চাপলে চলো ভৈরব নিরাপত্তা টিম আপনার ট্রিপ ও অবস্থান দেখতে পাবে। বিপদে 999-এ কল করুন।'**
  String get safetyExplain;

  /// No description provided for @safetyImSafe.
  ///
  /// In bn, this message translates to:
  /// **'আমি নিরাপদ আছি'**
  String get safetyImSafe;

  /// No description provided for @safetySosSent.
  ///
  /// In bn, this message translates to:
  /// **'SOS পাঠানো হয়েছে'**
  String get safetySosSent;

  /// No description provided for @safetySosResolved.
  ///
  /// In bn, this message translates to:
  /// **'SOS বন্ধ করা হয়েছে'**
  String get safetySosResolved;

  /// No description provided for @safetyNumbers.
  ///
  /// In bn, this message translates to:
  /// **'জরুরি নম্বর'**
  String get safetyNumbers;

  /// No description provided for @safetyNational.
  ///
  /// In bn, this message translates to:
  /// **'জাতীয় জরুরি সেবা'**
  String get safetyNational;

  /// No description provided for @safetyHealth.
  ///
  /// In bn, this message translates to:
  /// **'স্বাস্থ্য বাতায়ন'**
  String get safetyHealth;

  /// No description provided for @receiptTitle.
  ///
  /// In bn, this message translates to:
  /// **'ট্রিপ শেষ'**
  String get receiptTitle;

  /// No description provided for @receiptPayCash.
  ///
  /// In bn, this message translates to:
  /// **'চালককে নগদে দিন'**
  String get receiptPayCash;

  /// No description provided for @receiptDriver.
  ///
  /// In bn, this message translates to:
  /// **'চালক'**
  String get receiptDriver;

  /// No description provided for @receiptRoute.
  ///
  /// In bn, this message translates to:
  /// **'রুট'**
  String get receiptRoute;

  /// No description provided for @receiptRouteValue.
  ///
  /// In bn, this message translates to:
  /// **'{pickup} থেকে {dropoff}'**
  String receiptRouteValue(String pickup, String dropoff);

  /// No description provided for @searchTitle.
  ///
  /// In bn, this message translates to:
  /// **'রাইডের পরিকল্পনা'**
  String get searchTitle;

  /// No description provided for @searchPickupHint.
  ///
  /// In bn, this message translates to:
  /// **'পিকআপ কোথায়?'**
  String get searchPickupHint;

  /// No description provided for @searchSwap.
  ///
  /// In bn, this message translates to:
  /// **'পিকআপ ও গন্তব্য অদলবদল'**
  String get searchSwap;

  /// No description provided for @searchOnMap.
  ///
  /// In bn, this message translates to:
  /// **'ম্যাপে বেছে নিন'**
  String get searchOnMap;

  /// No description provided for @searchNoResults.
  ///
  /// In bn, this message translates to:
  /// **'\"{query}\" নামে কোনো জায়গা পাওয়া যায়নি'**
  String searchNoResults(String query);

  /// No description provided for @pickTitlePickup.
  ///
  /// In bn, this message translates to:
  /// **'পিকআপের জায়গা বেছে নিন'**
  String get pickTitlePickup;

  /// No description provided for @pickTitleDropoff.
  ///
  /// In bn, this message translates to:
  /// **'গন্তব্য বেছে নিন'**
  String get pickTitleDropoff;

  /// No description provided for @pickNear.
  ///
  /// In bn, this message translates to:
  /// **'{place}-এর কাছে'**
  String pickNear(String place);

  /// No description provided for @pickConfirmPickup.
  ///
  /// In bn, this message translates to:
  /// **'এখান থেকে নিন'**
  String get pickConfirmPickup;

  /// No description provided for @pickConfirmDropoff.
  ///
  /// In bn, this message translates to:
  /// **'এখানে নামাবেন'**
  String get pickConfirmDropoff;

  /// No description provided for @pickOutside.
  ///
  /// In bn, this message translates to:
  /// **'এই জায়গা সেবা এলাকার বাইরে'**
  String get pickOutside;

  /// No description provided for @intercityTitle.
  ///
  /// In bn, this message translates to:
  /// **'ইন্টারসিটি'**
  String get intercityTitle;

  /// No description provided for @intercitySubtitle.
  ///
  /// In bn, this message translates to:
  /// **'সিট শেয়ার করুন বা পুরো গাড়ি নিন।'**
  String get intercitySubtitle;

  /// No description provided for @intercityFrom.
  ///
  /// In bn, this message translates to:
  /// **'{place} থেকে · {vehicle}'**
  String intercityFrom(String place, String vehicle);

  /// No description provided for @intercityPrices.
  ///
  /// In bn, this message translates to:
  /// **'সিট {seat} · পুরো গাড়ি {whole}'**
  String intercityPrices(String seat, String whole);

  /// No description provided for @intercitySeatShare.
  ///
  /// In bn, this message translates to:
  /// **'সিট শেয়ার'**
  String get intercitySeatShare;

  /// No description provided for @intercityWhole.
  ///
  /// In bn, this message translates to:
  /// **'পুরো গাড়ি'**
  String get intercityWhole;

  /// No description provided for @intercitySeats.
  ///
  /// In bn, this message translates to:
  /// **'সিট'**
  String get intercitySeats;

  /// No description provided for @intercityDeparture.
  ///
  /// In bn, this message translates to:
  /// **'ছাড়ার সময়'**
  String get intercityDeparture;

  /// No description provided for @intercityBook.
  ///
  /// In bn, this message translates to:
  /// **'বুক করুন · {fare}'**
  String intercityBook(String fare);

  /// No description provided for @accountTitle.
  ///
  /// In bn, this message translates to:
  /// **'অ্যাকাউন্ট'**
  String get accountTitle;

  /// No description provided for @accountLanguage.
  ///
  /// In bn, this message translates to:
  /// **'ভাষা'**
  String get accountLanguage;

  /// No description provided for @accountLogout.
  ///
  /// In bn, this message translates to:
  /// **'লগ আউট'**
  String get accountLogout;

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
