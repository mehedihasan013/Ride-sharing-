import 'package:flutter/services.dart';
import 'package:material_ui/material_ui.dart';

import 'tokens.dart';

const _pkg = 'cholo_ui';
const _hind = 'HindSiliguri';
const _geist = 'Geist';

TextStyle _style(double size, double height, FontWeight weight, Color color) => TextStyle(
      fontSize: size,
      height: height,
      fontWeight: weight,
      color: color,
      // Even leading keeps Bangla vowel signs above/below the letter from clipping or shifting.
      leadingDistribution: TextLeadingDistribution.even,
    );

/// Money and other numbers: Geist with tabular figures; ৳ falls back to Hind Siliguri.
TextStyle cbMoneyStyle(double size, {Color color = CbColors.ink, FontWeight weight = FontWeight.w600}) =>
    TextStyle(
      fontFamily: _geist,
      fontFamilyFallback: const [_hind],
      package: _pkg,
      fontSize: size,
      height: 1.2,
      fontWeight: weight,
      color: color,
      fontFeatures: const [FontFeature.tabularFigures()],
      leadingDistribution: TextLeadingDistribution.even,
    );

/// The single light theme for both apps.
///
/// [bangla] picks the primary font: Bangla text must be shaped by Hind Siliguri (with Geist first,
/// conjuncts can split across fonts); English uses Geist with Hind as fallback.
ThemeData cbTheme({required bool bangla}) {
  const scheme = ColorScheme(
    brightness: Brightness.light,
    primary: CbColors.brand,
    onPrimary: CbColors.onBrand,
    primaryContainer: CbColors.brandTint,
    onPrimaryContainer: CbColors.brand,
    secondary: CbColors.ink,
    onSecondary: CbColors.surface,
    secondaryContainer: CbColors.raised,
    onSecondaryContainer: CbColors.ink,
    tertiary: CbColors.warning,
    onTertiary: CbColors.surface,
    error: CbColors.danger,
    onError: CbColors.surface,
    errorContainer: CbColors.dangerTint,
    onErrorContainer: CbColors.danger,
    surface: CbColors.surface,
    onSurface: CbColors.ink,
    onSurfaceVariant: CbColors.ink2,
    surfaceContainerLowest: CbColors.surface,
    surfaceContainerLow: CbColors.page,
    surfaceContainer: CbColors.raised,
    surfaceContainerHigh: CbColors.raised,
    surfaceContainerHighest: CbColors.raised,
    outline: CbColors.line,
    outlineVariant: CbColors.line,
    shadow: CbColors.ink,
    scrim: Color(0x66000000),
    inverseSurface: CbColors.ink,
    onInverseSurface: CbColors.surface,
    inversePrimary: Color(0xFF7FD3B4),
    surfaceTint: Color(0x00000000),
  );

  final text = TextTheme(
    displaySmall: _style(32, 1.2, FontWeight.w600, CbColors.ink),
    headlineSmall: _style(24, 1.35, FontWeight.w600, CbColors.ink),
    titleLarge: _style(20, 1.4, FontWeight.w600, CbColors.ink),
    titleMedium: _style(17, 1.45, FontWeight.w600, CbColors.ink),
    titleSmall: _style(16, 1.45, FontWeight.w600, CbColors.ink),
    bodyLarge: _style(16, 1.5, FontWeight.w400, CbColors.ink),
    bodyMedium: _style(14, 1.5, FontWeight.w400, CbColors.ink2),
    bodySmall: _style(13, 1.45, FontWeight.w400, CbColors.ink3),
    labelLarge: _style(14, 1.4, FontWeight.w500, CbColors.ink),
    labelMedium: _style(13, 1.4, FontWeight.w500, CbColors.ink2),
    labelSmall: _style(13, 1.4, FontWeight.w500, CbColors.ink3),
  );

  const control = RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(CbRadius.control)));
  final buttonText = _style(16, 1.25, FontWeight.w600, CbColors.ink);

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: CbColors.page,
    fontFamily: bangla ? _hind : _geist,
    fontFamilyFallback: [bangla ? _geist : _hind],
    package: _pkg,
    textTheme: text,
    // Calmer than the M3 sparkle; also cheaper on low-end phones.
    splashFactory: InkRipple.splashFactory,
    materialTapTargetSize: MaterialTapTargetSize.padded,
    appBarTheme: AppBarThemeData(
      backgroundColor: CbColors.page,
      foregroundColor: CbColors.ink,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      titleTextStyle: text.titleLarge,
      systemOverlayStyle: SystemUiOverlayStyle.dark,
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size(64, 56),
        padding: const EdgeInsets.symmetric(horizontal: CbSpace.xl),
        shape: control,
        textStyle: buttonText,
        backgroundColor: CbColors.brand,
        foregroundColor: CbColors.onBrand,
        disabledBackgroundColor: CbColors.raised,
        disabledForegroundColor: CbColors.ink3,
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(64, 48),
        padding: const EdgeInsets.symmetric(horizontal: CbSpace.l),
        shape: control,
        side: const BorderSide(color: CbColors.line),
        foregroundColor: CbColors.ink,
        textStyle: buttonText.copyWith(fontWeight: FontWeight.w500),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        minimumSize: const Size(48, 48),
        padding: const EdgeInsets.symmetric(horizontal: CbSpace.m),
        shape: control,
        foregroundColor: CbColors.brand,
        textStyle: buttonText.copyWith(fontWeight: FontWeight.w500),
      ),
    ),
    iconButtonTheme: IconButtonThemeData(
      style: IconButton.styleFrom(minimumSize: const Size(48, 48), foregroundColor: CbColors.ink),
    ),
    inputDecorationTheme: InputDecorationThemeData(
      filled: true,
      fillColor: CbColors.raised,
      contentPadding: const EdgeInsets.symmetric(horizontal: CbSpace.l, vertical: CbSpace.l),
      hintStyle: _style(16, 1.5, FontWeight.w400, CbColors.ink3),
      labelStyle: _style(16, 1.5, FontWeight.w400, CbColors.ink2),
      errorStyle: _style(13, 1.45, FontWeight.w400, CbColors.danger),
      border: const OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(CbRadius.control)),
        borderSide: BorderSide.none,
      ),
      enabledBorder: const OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(CbRadius.control)),
        borderSide: BorderSide.none,
      ),
      focusedBorder: const OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(CbRadius.control)),
        borderSide: BorderSide(color: CbColors.brand, width: 2),
      ),
      errorBorder: const OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(CbRadius.control)),
        borderSide: BorderSide(color: CbColors.danger),
      ),
      focusedErrorBorder: const OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(CbRadius.control)),
        borderSide: BorderSide(color: CbColors.danger, width: 2),
      ),
    ),
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: CbColors.surface,
      surfaceTintColor: Color(0x00000000),
      showDragHandle: true,
      dragHandleColor: CbColors.line,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(CbRadius.sheet)),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      height: 64,
      elevation: 0,
      backgroundColor: CbColors.surface,
      surfaceTintColor: const Color(0x00000000),
      indicatorColor: CbColors.brandTint,
      labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
      labelTextStyle: WidgetStateProperty.resolveWith(
        (states) => _style(
          13,
          1.3,
          FontWeight.w500,
          states.contains(WidgetState.selected) ? CbColors.ink : CbColors.ink2,
        ),
      ),
      iconTheme: WidgetStateProperty.resolveWith(
        (states) => IconThemeData(
          color: states.contains(WidgetState.selected) ? CbColors.brand : CbColors.ink2,
        ),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: CbColors.ink,
      contentTextStyle: _style(14, 1.45, FontWeight.w400, CbColors.surface),
      shape: control,
    ),
    chipTheme: ChipThemeData(
      backgroundColor: CbColors.surface,
      selectedColor: CbColors.brandTint,
      side: const BorderSide(color: CbColors.line),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(CbRadius.chip))),
      labelStyle: text.labelLarge,
      padding: const EdgeInsets.symmetric(horizontal: CbSpace.s, vertical: CbSpace.s),
    ),
    segmentedButtonTheme: SegmentedButtonThemeData(
      style: SegmentedButton.styleFrom(
        minimumSize: const Size(48, 44),
        selectedBackgroundColor: CbColors.brandTint,
        selectedForegroundColor: CbColors.ink,
        foregroundColor: CbColors.ink2,
        side: const BorderSide(color: CbColors.line),
        textStyle: text.labelLarge,
      ),
    ),
    dividerTheme: const DividerThemeData(color: CbColors.line, thickness: 1, space: 1),
    listTileTheme: ListTileThemeData(
      minVerticalPadding: CbSpace.m,
      iconColor: CbColors.ink2,
      titleTextStyle: _style(16, 1.45, FontWeight.w500, CbColors.ink),
      subtitleTextStyle: text.bodySmall,
    ),
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith(
        (states) => states.contains(WidgetState.selected) ? CbColors.surface : CbColors.ink3,
      ),
      trackColor: WidgetStateProperty.resolveWith(
        (states) => states.contains(WidgetState.selected) ? CbColors.brand : CbColors.raised,
      ),
      trackOutlineColor: WidgetStateProperty.resolveWith(
        (states) => states.contains(WidgetState.selected) ? CbColors.brand : CbColors.line,
      ),
    ),
    radioTheme: RadioThemeData(
      fillColor: WidgetStateProperty.resolveWith(
        (states) => states.contains(WidgetState.selected) ? CbColors.brand : CbColors.ink3,
      ),
    ),
    progressIndicatorTheme: const ProgressIndicatorThemeData(
      color: CbColors.brand,
      linearTrackColor: CbColors.raised,
      circularTrackColor: CbColors.raised,
    ),
    cardTheme: const CardThemeData(
      color: CbColors.surface,
      surfaceTintColor: Color(0x00000000),
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(CbRadius.control)),
        side: BorderSide(color: CbColors.line),
      ),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: CbColors.surface,
      surfaceTintColor: const Color(0x00000000),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(CbRadius.sheet))),
      titleTextStyle: text.titleLarge,
      contentTextStyle: text.bodyLarge,
    ),
  );
}
