import 'dart:convert';

import 'package:flutter/widgets.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'models/passenger_models.dart';

/// Settings saved on the phone: language, signed-in session, recent destinations.
/// shortcut: the session sits in plain preferences; move it to secure storage once the backend
/// actually verifies the JWT.
class AppPrefs extends ChangeNotifier {
  AppPrefs(this._prefs);

  final SharedPreferencesWithCache _prefs;

  static const _localeKey = 'locale';
  static const _sessionKey = 'session';
  static const _recentKey = 'recent';
  static const _maxRecent = 3;

  static Future<AppPrefs> load() async => AppPrefs(
        await SharedPreferencesWithCache.create(
          cacheOptions: const SharedPreferencesWithCacheOptions(
            allowList: {_localeKey, _sessionKey, _recentKey},
          ),
        ),
      );

  Locale get locale => Locale(_prefs.getString(_localeKey) ?? 'bn');
  bool get isBangla => locale.languageCode == 'bn';

  Future<void> setLocale(String languageCode) async {
    await _prefs.setString(_localeKey, languageCode);
    notifyListeners();
  }

  PassengerSession? get session {
    final raw = _prefs.getString(_sessionKey);
    if (raw == null) return null;
    try {
      return PassengerSession.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<void> saveSession(PassengerSession session) =>
      _prefs.setString(_sessionKey, jsonEncode(session.toJson()));

  Future<void> clearSession() => _prefs.remove(_sessionKey);

  List<BhairabLandmark> get recentPlaces {
    final raw = _prefs.getString(_recentKey);
    if (raw == null) return const [];
    try {
      return (jsonDecode(raw) as List)
          .whereType<Map<String, dynamic>>()
          .map(BhairabLandmark.fromJson)
          .toList();
    } catch (_) {
      return const [];
    }
  }

  /// Newest first, unique by id, at most 3. Map pins and intercity drop-offs are not kept.
  Future<void> addRecentPlace(BhairabLandmark place) async {
    if (place.category == 'pin' || place.category == 'intercity') return;
    final updated = [place, ...recentPlaces.where((p) => p.id != place.id)].take(_maxRecent).toList();
    await _prefs.setString(_recentKey, jsonEncode(updated.map((p) => p.toJson()).toList()));
    notifyListeners();
  }
}
