import 'package:flutter/widgets.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Settings saved on the phone. The driver app only keeps the UI language.
class AppPrefs extends ChangeNotifier {
  AppPrefs(this._prefs);

  final SharedPreferencesWithCache _prefs;

  static const _localeKey = 'locale';

  static Future<AppPrefs> load() async => AppPrefs(
        await SharedPreferencesWithCache.create(
          cacheOptions: const SharedPreferencesWithCacheOptions(allowList: {_localeKey}),
        ),
      );

  Locale get locale => Locale(_prefs.getString(_localeKey) ?? 'bn');

  Future<void> setLocale(String languageCode) async {
    await _prefs.setString(_localeKey, languageCode);
    notifyListeners();
  }
}
