import 'package:cholo_ui/cholo_ui.dart';
import 'package:material_ui/material_ui.dart';

/// One tappable place in a list: icon well, name, optional subtitle, distance on the right.
class PlaceRow extends StatelessWidget {
  const PlaceRow({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.trailing,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String? subtitle;

  /// Usually a distance such as "2.1 km".
  final String? trailing;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(CbRadius.control),
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: 64),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: const BoxDecoration(color: CbColors.raised, shape: BoxShape.circle),
              child: Icon(icon, size: 20, color: CbColors.ink2),
            ),
            const SizedBox(width: CbSpace.m),
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: text.bodyLarge?.copyWith(fontWeight: FontWeight.w500),
                  ),
                  if (subtitle != null && subtitle!.isNotEmpty)
                    Text(subtitle!, maxLines: 1, overflow: TextOverflow.ellipsis, style: text.bodySmall),
                ],
              ),
            ),
            if (trailing != null) ...[
              const SizedBox(width: CbSpace.s),
              Text(trailing!, style: cbMoneyStyle(13, color: CbColors.ink3, weight: FontWeight.w400)),
            ],
          ],
        ),
      ),
    );
  }
}
