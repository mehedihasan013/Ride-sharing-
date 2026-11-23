import 'package:flutter/widgets.dart';

import '../l10n/app_localizations.dart';
import '../models/passenger_models.dart';

/// True when the UI is in Bangla.
bool isBangla(BuildContext context) => Localizations.localeOf(context).languageCode == 'bn';

/// Localized vehicle name for a backend type code.
String vehicleLabel(AppLocalizations l, String type) => switch (type) {
      'BIKE' => l.vehicleBike,
      'CNG' => l.vehicleCng,
      'CAR_MICROBUS' => l.vehicleMicrobus,
      _ => l.vehicleEasybike,
    };

/// Place name in the UI language (English falls back to Bangla when missing).
String placeName(BuildContext context, BhairabLandmark place) =>
    isBangla(context) || place.englishName.isEmpty ? place.banglaName : place.englishName;

/// Name without the bracketed detail, for small map labels: "Meghna Bridge (roundabout)" -> "Meghna Bridge".
String shortPlaceName(BuildContext context, BhairabLandmark place) {
  final name = placeName(context, place);
  final bracket = name.indexOf(' (');
  return bracket > 0 ? name.substring(0, bracket) : name;
}
