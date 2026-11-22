import 'package:material_ui/material_ui.dart';

/// Colour tokens for both apps (light theme only).
/// Mirrors the light web simulator palette in apps/mobile_simulator/src/index.css.
abstract final class CbColors {
  static const page = Color(0xFFF6F5F2);
  static const surface = Color(0xFFFFFFFF);
  static const raised = Color(0xFFEFEDE8);
  static const line = Color(0xFFDEDBD3);

  static const ink = Color(0xFF16181A);
  static const ink2 = Color(0xFF4D5358);
  static const ink3 = Color(0xFF6C7278);

  static const brand = Color(0xFF006A4E);
  static const onBrand = Color(0xFFFFFFFF);
  static const brandTint = Color(0xFFE6F0ED);

  /// SOS and blocking errors only.
  static const danger = Color(0xFFD22638);
  static const dangerTint = Color(0xFFFCF2F3);

  /// Bids, counter-offers, low balance, countdown at 15 s or less.
  static const warning = Color(0xFFA86200);
  static const warningTint = Color(0xFFF8F2EB);

  /// bKash surfaces only; white text passes contrast (5.3:1).
  static const bkash = Color(0xFFD21065);

  /// Nagad surfaces only; needs ink text, white fails contrast (2.3:1).
  static const nagad = Color(0xFFF7941D);

  static const easybike = Color(0xFF00805C);
  static const cng = Color(0xFFA86200);
  static const bike = Color(0xFF2563C7);
  static const microbus = Color(0xFF6D4DD6);

  /// Colour for a backend vehicle type code (EASYBIKE, CNG, BIKE, CAR_MICROBUS).
  static Color vehicle(String type) => switch (type) {
        'EASYBIKE' => easybike,
        'CNG' => cng,
        'BIKE' => bike,
        'CAR_MICROBUS' => microbus,
        _ => ink2,
      };
}

/// Icon for a backend vehicle type code.
IconData cbVehicleIcon(String type) => switch (type) {
      'BIKE' => Icons.two_wheeler,
      'CAR_MICROBUS' => Icons.airport_shuttle,
      _ => Icons.electric_rickshaw,
    };

abstract final class CbSpace {
  static const double xs = 4;
  static const double s = 8;
  static const double m = 12;
  static const double l = 16;
  static const double xl = 24;
  static const double xxl = 32;

  /// Horizontal screen padding.
  static const double gutter = 16;
}

abstract final class CbRadius {
  static const double chip = 8;
  static const double control = 12;
  static const double sheet = 16;
}

abstract final class CbShadow {
  /// Floating map buttons and markers.
  static const floating = [
    BoxShadow(color: Color(0x2916181A), offset: Offset(0, 1), blurRadius: 4),
  ];

  /// Bottom panels and sheets.
  static const panel = [
    BoxShadow(color: Color(0x1A16181A), offset: Offset(0, -2), blurRadius: 12),
  ];
}
