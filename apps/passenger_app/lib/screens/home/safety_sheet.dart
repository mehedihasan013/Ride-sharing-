import 'package:cholo_ui/cholo_ui.dart';
import 'package:material_ui/material_ui.dart';

import '../../l10n/app_localizations.dart';

/// Modal safety sheet during a ride: SOS, "I'm safe", emergency numbers.
class SafetySheet extends StatelessWidget {
  const SafetySheet({
    super.key,
    required this.sosActive,
    required this.onSos,
    required this.onSafe,
    required this.onCall,
  });

  final bool sosActive;
  final VoidCallback onSos;
  final VoidCallback onSafe;
  final ValueChanged<String> onCall;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(CbSpace.gutter, 0, CbSpace.gutter, CbSpace.l),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(l.safetyTitle, style: text.titleLarge),
            const SizedBox(height: CbSpace.l),
            if (sosActive)
              Semantics(
                liveRegion: true,
                child: Container(
                  height: 56,
                  decoration: BoxDecoration(
                    color: CbColors.danger,
                    borderRadius: BorderRadius.circular(CbRadius.control),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SosPulseDot(color: CbColors.surface),
                      const SizedBox(width: CbSpace.s),
                      Text(l.safetySosOn, style: text.titleSmall?.copyWith(color: CbColors.surface)),
                    ],
                  ),
                ),
              )
            else
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(56),
                  foregroundColor: CbColors.danger,
                  side: const BorderSide(color: CbColors.danger, width: 1.5),
                ),
                onPressed: onSos,
                icon: const Icon(Icons.sos),
                label: Text(l.safetySendSos),
              ),
            const SizedBox(height: CbSpace.s),
            Text(l.safetyExplain, style: text.bodyMedium),
            if (sosActive) ...[
              const SizedBox(height: CbSpace.m),
              OutlinedButton(onPressed: onSafe, child: Text(l.safetyImSafe)),
            ],
            const SizedBox(height: CbSpace.l),
            EmergencyNumbers(onCall: onCall),
          ],
        ),
      ),
    );
  }
}

/// Verified national numbers only. Local police numbers are added once the owner verifies them.
class EmergencyNumbers extends StatelessWidget {
  const EmergencyNumbers({super.key, required this.onCall});

  final ValueChanged<String> onCall;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    final numbers = [(l.safetyNational, '999'), (l.safetyHealth, '16263')];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(l.safetyNumbers, style: text.titleSmall),
        for (final (label, number) in numbers)
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(label),
            subtitle: Text(number, style: cbMoneyStyle(16, color: CbColors.ink2, weight: FontWeight.w500)),
            trailing: IconButton.outlined(
              tooltip: '$label $number',
              onPressed: () => onCall(number),
              icon: const Icon(Icons.call_outlined),
            ),
          ),
      ],
    );
  }
}

/// The only decorative animation in the app: a soft pulse while SOS is on.
/// Static when the phone asks for reduced motion.
class SosPulseDot extends StatefulWidget {
  const SosPulseDot({super.key, required this.color});

  final Color color;

  @override
  State<SosPulseDot> createState() => _SosPulseDotState();
}

class _SosPulseDotState extends State<SosPulseDot> with SingleTickerProviderStateMixin {
  late final _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 1400));

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (MediaQuery.disableAnimationsOf(context)) {
      _controller.stop();
      _controller.value = 1;
    } else if (!_controller.isAnimating) {
      _controller.repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => FadeTransition(
        opacity: Tween<double>(begin: 0.35, end: 1).animate(_controller),
        child: StatusDot(color: widget.color, size: 10),
      );
}
