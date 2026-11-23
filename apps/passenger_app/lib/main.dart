import 'package:cholo_ui/cholo_ui.dart';
import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import 'app_prefs.dart';
import 'l10n/app_localizations.dart';
import 'screens/auth/phone_screen.dart';
import 'screens/home/home_screen.dart';
import 'services/passenger_api_service.dart';
import 'services/passenger_socket_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await AppPrefs.load();
  // Created once here: rebuilding the app (e.g. a language switch) must not create a second
  // socket, which would lose the backend's ride room membership mid-ride.
  final api = PassengerApiService();
  final socket = PassengerSocketService(apiService: api);
  final saved = prefs.session;
  if (saved != null) socket.updateSession(saved);
  runApp(PassengerApp(prefs: prefs, api: api, socket: socket, signedIn: saved != null));
}

/// Root of the Cholo Bhairab passenger app.
class PassengerApp extends StatelessWidget {
  const PassengerApp({
    super.key,
    required this.prefs,
    required this.api,
    required this.socket,
    required this.signedIn,
  });

  final AppPrefs prefs;
  final PassengerApiService api;
  final PassengerSocketService socket;
  final bool signedIn;

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<AppPrefs>.value(value: prefs),
        Provider<PassengerApiService>.value(value: api),
        ChangeNotifierProvider<PassengerSocketService>.value(value: socket),
      ],
      child: Builder(
        builder: (context) {
          final locale = context.select<AppPrefs, Locale>((p) => p.locale);
          return MaterialApp(
            debugShowCheckedModeBanner: false,
            onGenerateTitle: (context) => AppLocalizations.of(context).appTitle,
            locale: locale,
            supportedLocales: AppLocalizations.supportedLocales,
            localizationsDelegates: const [
              AppLocalizations.delegate,
              ...GlobalMaterialLocalizations.delegates,
            ],
            theme: cbTheme(bangla: locale.languageCode == 'bn'),
            themeMode: ThemeMode.light,
            home: signedIn ? const HomeScreen() : const PhoneScreen(),
          );
        },
      ),
    );
  }
}
