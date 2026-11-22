import 'dart:math' as math;

import 'package:material_ui/material_ui.dart';
import 'package:url_launcher/url_launcher.dart';

import 'format.dart';
import 'theme.dart';
import 'tokens.dart';

/// Small solid status dot (online, connecting, approved...).
class StatusDot extends StatelessWidget {
  const StatusDot({super.key, required this.color, this.size = 8});

  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
      );
}

/// Pill with a status dot and a short label. Tappable when [onTap] is set (44dp tall).
class StatusPill extends StatelessWidget {
  const StatusPill({super.key, required this.label, required this.dotColor, this.onTap, this.floating = false});

  final String label;
  final Color dotColor;
  final VoidCallback? onTap;

  /// Use on top of the map: white background and the floating shadow.
  final bool floating;

  @override
  Widget build(BuildContext context) {
    final pill = Container(
      constraints: BoxConstraints(minHeight: onTap == null ? 32 : 44),
      padding: const EdgeInsets.symmetric(horizontal: CbSpace.m),
      decoration: BoxDecoration(
        color: floating ? CbColors.surface : CbColors.raised,
        borderRadius: BorderRadius.circular(999),
        boxShadow: floating ? CbShadow.floating : null,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          StatusDot(color: dotColor),
          const SizedBox(width: CbSpace.s),
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.labelMedium?.copyWith(color: CbColors.ink),
            ),
          ),
        ],
      ),
    );
    if (onTap == null) return pill;
    return Semantics(
      button: true,
      child: Material(
        type: MaterialType.transparency,
        child: InkWell(borderRadius: BorderRadius.circular(999), onTap: onTap, child: pill),
      ),
    );
  }
}

enum CbTone { info, warning, danger }

/// Inline message box. Danger is for SOS and blocking errors only.
class CbBanner extends StatelessWidget {
  const CbBanner({
    super.key,
    required this.tone,
    required this.message,
    this.title,
    this.icon,
    this.actionLabel,
    this.onAction,
  });

  final CbTone tone;
  final String message;
  final String? title;
  final IconData? icon;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final (Color tint, Color accent) = switch (tone) {
      CbTone.info => (CbColors.brandTint, CbColors.brand),
      CbTone.warning => (CbColors.warningTint, CbColors.warning),
      CbTone.danger => (CbColors.dangerTint, CbColors.danger),
    };
    final text = Theme.of(context).textTheme;
    return Container(
      padding: const EdgeInsets.all(CbSpace.m),
      decoration: BoxDecoration(
        color: tint,
        borderRadius: BorderRadius.circular(CbRadius.control),
        border: Border.all(color: accent.withValues(alpha: 0.4)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            icon ??
                switch (tone) {
                  CbTone.info => Icons.info_outline,
                  CbTone.warning => Icons.warning_amber_rounded,
                  CbTone.danger => Icons.error_outline,
                },
            size: 20,
            color: accent,
          ),
          const SizedBox(width: CbSpace.m),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (title != null) Text(title!, style: text.titleSmall),
                Text(message, style: text.bodyMedium?.copyWith(color: CbColors.ink)),
                if (actionLabel != null && onAction != null)
                  Padding(
                    padding: const EdgeInsets.only(top: CbSpace.xs),
                    child: TextButton(
                      style: TextButton.styleFrom(
                        foregroundColor: accent,
                        padding: EdgeInsets.zero,
                        alignment: AlignmentDirectional.centerStart,
                      ),
                      onPressed: onAction,
                      child: Text(actionLabel!),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// [-]  ৳58  [+] fare stepper. Step 5 by default, never below [min].
class MoneyStepper extends StatelessWidget {
  const MoneyStepper({
    super.key,
    required this.value,
    required this.onChanged,
    required this.decreaseLabel,
    required this.increaseLabel,
    this.min = 0,
    this.max,
    this.step = 5,
    this.fontSize = 32,
  });

  final int value;
  final ValueChanged<int> onChanged;

  /// Spoken labels for screen readers.
  final String decreaseLabel;
  final String increaseLabel;
  final int min;
  final int? max;
  final int step;
  final double fontSize;

  @override
  Widget build(BuildContext context) {
    final canDecrease = value > min;
    final canIncrease = max == null || value < max!;
    return Row(
      children: [
        IconButton.outlined(
          tooltip: decreaseLabel,
          onPressed: canDecrease ? () => onChanged(math.max(min, value - step)) : null,
          icon: const Icon(Icons.remove),
        ),
        Expanded(
          child: Semantics(
            liveRegion: true,
            child: Text(
              fmtMoney(value),
              textAlign: TextAlign.center,
              style: cbMoneyStyle(fontSize),
            ),
          ),
        ),
        IconButton.outlined(
          tooltip: increaseLabel,
          onPressed: canIncrease ? () => onChanged(max == null ? value + step : math.min(max!, value + step)) : null,
          icon: const Icon(Icons.add),
        ),
      ],
    );
  }
}

/// Pickup (brand circle) to drop-off (ink square) with a connector line.
class RouteStops extends StatelessWidget {
  const RouteStops({
    super.key,
    required this.pickupLabel,
    required this.pickup,
    required this.dropoffLabel,
    required this.dropoff,
    this.maxLines = 2,
  });

  final String pickupLabel;
  final String pickup;
  final String dropoffLabel;
  final String dropoff;
  final int maxLines;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _stop(context, _pickupMark, pickupLabel, pickup, connector: true),
        _stop(context, _dropoffMark, dropoffLabel, dropoff, connector: false),
      ],
    );
  }

  static const _pickupMark = SizedBox(
    width: 10,
    height: 10,
    child: DecoratedBox(decoration: BoxDecoration(color: CbColors.brand, shape: BoxShape.circle)),
  );

  static const _dropoffMark = SizedBox(
    width: 10,
    height: 10,
    child: DecoratedBox(decoration: BoxDecoration(color: CbColors.ink)),
  );

  Widget _stop(BuildContext context, Widget mark, String label, String name, {required bool connector}) {
    final text = Theme.of(context).textTheme;
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 16,
            child: Column(
              children: [
                const SizedBox(height: 6),
                mark,
                if (connector)
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Container(width: 2, color: CbColors.line),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: CbSpace.m),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: connector ? CbSpace.m : 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: text.bodySmall),
                  Text(
                    name,
                    maxLines: maxLines,
                    overflow: TextOverflow.ellipsis,
                    style: text.bodyLarge?.copyWith(fontWeight: FontWeight.w500),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Circle with the first letter of a name.
class CbAvatar extends StatelessWidget {
  const CbAvatar({super.key, required this.name, this.size = 48});

  final String name;
  final double size;

  @override
  Widget build(BuildContext context) {
    final trimmed = name.trim();
    final initial = trimmed.isEmpty ? '?' : trimmed.characters.first.toUpperCase();
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: const BoxDecoration(color: CbColors.raised, shape: BoxShape.circle),
      child: Text(initial, style: Theme.of(context).textTheme.titleMedium),
    );
  }
}

/// Round 48dp button that floats over the map.
class CbFloatingButton extends StatelessWidget {
  const CbFloatingButton({super.key, required this.icon, required this.tooltip, required this.onPressed});

  final IconData icon;
  final String tooltip;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) => DecoratedBox(
        decoration: const BoxDecoration(
          color: CbColors.surface,
          shape: BoxShape.circle,
          boxShadow: CbShadow.floating,
        ),
        child: IconButton(tooltip: tooltip, onPressed: onPressed, icon: Icon(icon)),
      );
}

/// Caption-style section header, e.g. "RECENT".
class CbSectionLabel extends StatelessWidget {
  const CbSectionLabel(this.label, {super.key});

  final String label;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(top: CbSpace.l, bottom: CbSpace.s),
        child: Text(label, style: Theme.of(context).textTheme.labelMedium),
      );
}

/// OSM licence requirement: visible, linked attribution on every map screen.
class CbMapAttribution extends StatelessWidget {
  const CbMapAttribution({super.key});

  static final _copyright = Uri.parse('https://www.openstreetmap.org/copyright');

  @override
  Widget build(BuildContext context) => Semantics(
        link: true,
        child: GestureDetector(
          onTap: () => launchUrl(_copyright, mode: LaunchMode.externalApplication),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: CbColors.surface.withValues(alpha: 0.85),
              borderRadius: BorderRadius.circular(4),
            ),
            child: const Text(
              '© OpenStreetMap contributors',
              style: TextStyle(fontSize: 11, height: 1.3, color: CbColors.ink2),
            ),
          ),
        ),
      );
}

/// Bottom panel over the map: white, rounded top, soft shadow, capped at 62% of the screen and
/// scrollable inside, resizes smoothly (instantly when the phone asks for reduced motion).
class CbPanel extends StatelessWidget {
  const CbPanel({super.key, required this.child, this.maxHeightFactor = 0.62});

  final Widget child;
  final double maxHeightFactor;

  @override
  Widget build(BuildContext context) {
    final media = MediaQuery.of(context);
    final reduceMotion = media.disableAnimations;
    return DecoratedBox(
      decoration: const BoxDecoration(
        color: CbColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(CbRadius.sheet)),
        boxShadow: CbShadow.panel,
      ),
      child: AnimatedSize(
        duration: reduceMotion ? Duration.zero : const Duration(milliseconds: 200),
        curve: Curves.easeOutCubic,
        alignment: Alignment.bottomCenter,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxHeight: media.size.height * maxHeightFactor),
          child: SingleChildScrollView(
            padding: EdgeInsets.fromLTRB(
              CbSpace.gutter,
              CbSpace.l,
              CbSpace.gutter,
              CbSpace.l + media.padding.bottom,
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}

/// Full-screen map with floating corner controls and a bottom panel.
/// The OSM attribution always sits just above the panel.
class CbMapLayout extends StatelessWidget {
  const CbMapLayout({
    super.key,
    required this.map,
    required this.panel,
    this.topStart,
    this.topEnd,
    this.overlay,
    this.panelMaxHeightFactor = 0.62,
  });

  final Widget map;
  final Widget panel;
  final Widget? topStart;
  final Widget? topEnd;

  /// Optional widget pinned under the top controls (for example a status banner).
  final Widget? overlay;
  final double panelMaxHeightFactor;

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.paddingOf(context).top + CbSpace.s;
    return Stack(
      children: [
        Positioned.fill(child: map),
        if (topStart != null) PositionedDirectional(top: top, start: CbSpace.gutter, child: topStart!),
        if (topEnd != null) PositionedDirectional(top: top, end: CbSpace.gutter, child: topEnd!),
        if (overlay != null)
          Positioned(top: top + 56, left: CbSpace.gutter, right: CbSpace.gutter, child: overlay!),
        Align(
          alignment: Alignment.bottomCenter,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Padding(
                padding: EdgeInsetsDirectional.only(start: CbSpace.m, bottom: 6),
                child: Align(alignment: AlignmentDirectional.centerStart, child: CbMapAttribution()),
              ),
              CbPanel(maxHeightFactor: panelMaxHeightFactor, child: panel),
            ],
          ),
        ),
      ],
    );
  }
}
