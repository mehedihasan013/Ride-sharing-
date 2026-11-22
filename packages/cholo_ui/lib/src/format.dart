/// Formatting helpers. Digits stay Latin in both languages (matches the v1.1.0 web design);
/// change it here if Bangla digits are ever wanted.
library;

final _thousands = RegExp(r'\B(?=(\d{3})+(?!\d))');

/// `58` -> `৳58`, `2400` -> `৳2,400`, `-7` -> `−৳7`.
String fmtMoney(num amount) {
  final value = amount.round();
  final digits = value.abs().toString().replaceAll(_thousands, ',');
  return '${value < 0 ? '−' : ''}৳$digits';
}

/// `2.149` -> `2.1` (units come from the localized string).
String fmtKm(double km) => km.toStringAsFixed(1);

/// `27` -> `0:27`, `75` -> `1:15`.
String fmtCountdown(int seconds) {
  final s = seconds < 0 ? 0 : seconds;
  return '${s ~/ 60}:${(s % 60).toString().padLeft(2, '0')}';
}

/// Normalizes user input to the 11-digit local form `01XXXXXXXXX`.
/// Accepts `+880 1700-000001`, `8801700000001`, `1700000001`.
String normalizeBdPhone(String input) {
  var digits = input.replaceAll(RegExp(r'\D'), '');
  if (digits.startsWith('880')) digits = digits.substring(2);
  if (digits.length == 10 && digits.startsWith('1')) digits = '0$digits';
  return digits;
}

final _bdMobile = RegExp(r'^01[3-9]\d{8}$');

/// True for a valid Bangladeshi mobile number in local form.
bool isValidBdPhone(String local) => _bdMobile.hasMatch(local);

/// `01700000001` -> `+880 1700-000001`. Returns the input unchanged if it is not a valid number.
String fmtBdPhone(String local) {
  if (!isValidBdPhone(local)) return local;
  final rest = local.substring(1);
  return '+880 ${rest.substring(0, 4)}-${rest.substring(4)}';
}
