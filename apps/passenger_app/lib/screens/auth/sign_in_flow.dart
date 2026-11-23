import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../app_prefs.dart';
import '../../models/passenger_models.dart';
import '../../services/passenger_socket_service.dart';
import '../home/home_screen.dart';

/// Saves the session, hands it to the socket service and replaces the sign-in screens with Home.
Future<void> completeSignIn(BuildContext context, PassengerSession session) async {
  final navigator = Navigator.of(context);
  final prefs = context.read<AppPrefs>();
  context.read<PassengerSocketService>().updateSession(session);
  await prefs.saveSession(session);
  navigator.pushAndRemoveUntil(
    MaterialPageRoute<void>(builder: (_) => const HomeScreen()),
    (_) => false,
  );
}
