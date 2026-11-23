import 'package:cholo_ui/cholo_ui.dart';
import 'package:intl/intl.dart';
import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../l10n/app_localizations.dart';
import '../../services/bangla_voice_service.dart';
import '../../services/driver_api_service.dart';

/// Voice alerts: on/off, test prompts (demo builds), and what was announced.
/// shortcut: alerts are a system sound + vibration with the text shown (no Bangla TTS yet).
class VoiceScreen extends StatelessWidget {
  const VoiceScreen({super.key});

  static final _time = DateFormat('HH:mm:ss', 'en');

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    final voice = context.watch<BanglaVoiceService>();

    return Scaffold(
      appBar: AppBar(title: Text(l.accountVoice)),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(CbSpace.gutter, 0, CbSpace.gutter, CbSpace.xl),
        children: [
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(l.voiceSwitch),
            value: !voice.isMuted,
            onChanged: (_) => voice.toggleMute(),
          ),
          Text(l.voiceExplain, style: text.bodyMedium),
          if (kDemoMode) ...[
            CbSectionLabel(l.voiceTest),
            Wrap(
              spacing: CbSpace.s,
              runSpacing: CbSpace.s,
              children: [
                OutlinedButton(
                  onPressed: () => voice.speakRideOpportunity(BanglaVoiceService.sampleRidePromptBangla),
                  child: Text(l.voiceTestTrip),
                ),
                OutlinedButton(onPressed: voice.speakRideConfirmed, child: Text(l.voiceTestConfirmed)),
                OutlinedButton(onPressed: voice.speakLowBalanceWarning, child: Text(l.voiceTestLowBalance)),
              ],
            ),
          ],
          Row(
            children: [
              Expanded(child: CbSectionLabel(l.voiceHistory)),
              if (voice.history.isNotEmpty) TextButton(onPressed: voice.clearHistory, child: Text(l.voiceClear)),
            ],
          ),
          if (voice.history.isEmpty) Text(l.voiceEmpty, style: text.bodyMedium),
          // Transcripts stay Bangla: they are what the Bangla alert says.
          for (final entry in voice.history)
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(entry.textBangla),
              subtitle: Text(_time.format(entry.timestamp)),
              trailing: IconButton(
                tooltip: l.reqReplay,
                icon: const Icon(Icons.replay),
                onPressed: () => voice.replay(entry.textBangla, category: entry.category),
              ),
            ),
        ],
      ),
    );
  }
}
