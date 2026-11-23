import 'package:cholo_ui/cholo_ui.dart';
import 'package:material_ui/material_ui.dart';

import '../../l10n/app_localizations.dart';
import '../../models/passenger_models.dart';
import 'sign_in_flow.dart';

/// Step 3 of sign-in, only for new passengers: the name drivers will see.
/// shortcut: the name is kept on this phone only; send it to a profile endpoint once one exists.
class NameScreen extends StatefulWidget {
  const NameScreen({super.key, required this.session});

  final PassengerSession session;

  @override
  State<NameScreen> createState() => _NameScreenState();
}

class _NameScreenState extends State<NameScreen> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _continue() {
    final name = _controller.text.trim();
    if (name.isEmpty) return;
    completeSignIn(context, widget.session.withName(name));
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(CbSpace.gutter, CbSpace.s, CbSpace.gutter, CbSpace.xl),
        children: [
          Text(l.nameTitle, style: text.headlineSmall),
          const SizedBox(height: CbSpace.s),
          Text(l.nameSubtitle, style: text.bodyMedium),
          const SizedBox(height: CbSpace.xl),
          TextField(
            controller: _controller,
            autofocus: true,
            textCapitalization: TextCapitalization.words,
            autofillHints: const [AutofillHints.name],
            decoration: InputDecoration(labelText: l.nameField),
            onSubmitted: (_) => _continue(),
          ),
          const SizedBox(height: CbSpace.l),
          ValueListenableBuilder(
            valueListenable: _controller,
            builder: (context, value, _) => FilledButton(
              onPressed: value.text.trim().isEmpty ? null : _continue,
              child: Text(l.commonContinue),
            ),
          ),
        ],
      ),
    );
  }
}
