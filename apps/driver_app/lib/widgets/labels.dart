import 'package:cholo_ui/cholo_ui.dart';
import 'package:flutter/widgets.dart';

import '../l10n/app_localizations.dart';
import '../models/driver_models.dart';

bool isBangla(BuildContext context) => Localizations.localeOf(context).languageCode == 'bn';

String vehicleLabel(AppLocalizations l, String type) => switch (type) {
      'BIKE' => l.vehicleBike,
      'CNG' => l.vehicleCng,
      'CAR_MICROBUS' => l.vehicleMicrobus,
      _ => l.vehicleEasybike,
    };

/// Place name in the UI language (English falls back to Bangla when missing).
String placeName(BuildContext context, BhairabLandmark place) =>
    isBangla(context) || place.englishName.isEmpty ? place.banglaName : place.englishName;

/// Name without the bracketed detail, for small labels.
String shortPlaceName(BuildContext context, BhairabLandmark place) {
  final name = placeName(context, place);
  final bracket = name.indexOf(' (');
  return bracket > 0 ? name.substring(0, bracket) : name;
}

/// Trip addresses arrive in Bangla; show the matching landmark's name in the UI language.
String addressLabel(BuildContext context, List<BhairabLandmark> landmarks, String banglaAddress) {
  for (final place in landmarks) {
    if (place.banglaName == banglaAddress) return placeName(context, place);
  }
  return banglaAddress;
}

/// Drop-off point: from the server when sent, else the landmark with the same Bangla name.
LatLng? dropoffPoint(List<BhairabLandmark> landmarks, String address, double? lat, double? lng) {
  if (lat != null && lng != null) return LatLng(lat, lng);
  for (final place in landmarks) {
    if (place.banglaName == address) return LatLng(place.latitude, place.longitude);
  }
  return null;
}

/// (label, dot colour) for a KYC status code.
(String, Color) kycStatusLabel(AppLocalizations l, String status) => switch (status) {
      'APPROVED' => (l.kycApproved, CbColors.brand),
      'REJECTED' => (l.kycRejected, CbColors.danger),
      _ => (l.kycPending, CbColors.warning),
    };

String transactionLabel(AppLocalizations l, String type) => switch (type) {
      'BKASH_TOPUP' => l.txBkash,
      'NAGAD_TOPUP' => l.txNagad,
      'COMMISSION_DEDUCTION' => l.txCommission,
      'PROMOTIONAL_BONUS' => l.txBonus,
      _ => l.txOther,
    };
