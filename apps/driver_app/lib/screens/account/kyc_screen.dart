import 'package:cholo_ui/cholo_ui.dart';
import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../l10n/app_localizations.dart';
import '../../services/driver_socket_service.dart';
import '../../widgets/labels.dart';

/// Driver documents (KYC): vehicle type, personal and vehicle details, and the licence or
/// councillor certificate the vehicle type needs.
/// shortcut: documents are reference numbers only (no photo upload yet).
class KycScreen extends StatefulWidget {
  const KycScreen({super.key});

  @override
  State<KycScreen> createState() => _KycScreenState();
}

class _KycScreenState extends State<KycScreen> {
  final _formKey = GlobalKey<FormState>();
  late final _profile = context.read<DriverSocketService>().profile;
  late String _type = _profile.vehicleType;
  late final _name = TextEditingController(text: _profile.driverName);
  late final _phone = TextEditingController(text: _profile.driverPhone);
  late final _nid = TextEditingController(text: _profile.nidNumber);
  late final _model = TextEditingController(text: _profile.vehicleModel);
  late final _registration = TextEditingController(text: _profile.registrationNumber);
  late final _councilor = TextEditingController(text: _profile.unionCouncilorCert ?? '');
  late final _brta = TextEditingController(text: _profile.brtaLicenseNo ?? '');
  bool _submitting = false;

  /// Easy-bikes and CNGs are licensed by the municipality (ward councillor); bikes and cars by BRTA.
  bool get _needsCouncilorCert => _type == 'EASYBIKE' || _type == 'CNG';

  @override
  void dispose() {
    for (final c in [_name, _phone, _nid, _model, _registration, _councilor, _brta]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final l = AppLocalizations.of(context);
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _submitting = true);
    try {
      final result = await context.read<DriverSocketService>().submitKycApplication(
            driverName: _name.text.trim(),
            driverPhone: _phone.text.trim(),
            vehicleType: _type,
            vehicleModel: _model.text.trim(),
            registrationNumber: _registration.text.trim(),
            nidNumber: _nid.text.trim(),
            unionCouncilorCert: _needsCouncilorCert ? _councilor.text.trim() : null,
            brtaLicenseNo: _needsCouncilorCert ? null : _brta.text.trim(),
          );
      messenger.showSnackBar(SnackBar(content: Text(l.kycSubmitted(kycStatusLabel(l, result.status).$1))));
    } catch (_) {
      messenger.showSnackBar(SnackBar(content: Text(l.commonServerError)));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final status = context.select<DriverSocketService, String>((s) => s.profile.kycStatus);
    final (statusLabel, statusColor) = kycStatusLabel(l, status);
    String? required(String? v) => (v == null || v.trim().isEmpty) ? l.kycRequired : null;

    final types = [
      ('EASYBIKE', l.kycEasybikeHint),
      ('CNG', l.kycCngHint),
      ('BIKE', l.kycBikeHint),
      ('CAR_MICROBUS', l.kycMicrobusHint),
    ];

    return Scaffold(
      appBar: AppBar(title: Text(l.accountDocuments)),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(CbSpace.gutter, 0, CbSpace.gutter, CbSpace.xl),
          children: [
            Align(
              alignment: AlignmentDirectional.centerStart,
              child: StatusPill(label: l.kycStatus(statusLabel), dotColor: statusColor),
            ),
            CbSectionLabel(l.kycVehicleType),
            for (final (code, hint) in types)
              Padding(
                padding: const EdgeInsets.only(bottom: CbSpace.s),
                child: _TypeRow(
                  title: vehicleLabel(l, code),
                  hint: hint,
                  color: CbColors.vehicle(code),
                  icon: cbVehicleIcon(code),
                  selected: _type == code,
                  onTap: () => setState(() => _type = code),
                ),
              ),
            const SizedBox(height: CbSpace.s),
            TextFormField(controller: _name, decoration: InputDecoration(labelText: l.kycName), validator: required),
            const SizedBox(height: CbSpace.m),
            TextFormField(
              controller: _phone,
              keyboardType: TextInputType.phone,
              decoration: InputDecoration(labelText: l.kycPhone),
              validator: (v) => isValidBdPhone(normalizeBdPhone(v ?? '')) ? null : l.kycPhoneInvalid,
            ),
            const SizedBox(height: CbSpace.m),
            TextFormField(
              controller: _nid,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(labelText: l.kycNid),
              validator: (v) => (v ?? '').replaceAll(RegExp(r'\D'), '').length >= 10 ? null : l.kycNidInvalid,
            ),
            const SizedBox(height: CbSpace.m),
            TextFormField(controller: _model, decoration: InputDecoration(labelText: l.kycModel), validator: required),
            const SizedBox(height: CbSpace.m),
            TextFormField(controller: _registration, decoration: InputDecoration(labelText: l.kycRegistration)),
            const SizedBox(height: CbSpace.m),
            if (_needsCouncilorCert)
              TextFormField(
                controller: _councilor,
                decoration: InputDecoration(labelText: l.kycCouncilor),
                validator: required,
              )
            else
              TextFormField(controller: _brta, decoration: InputDecoration(labelText: l.kycBrta), validator: required),
            const SizedBox(height: CbSpace.xl),
            FilledButton(
              onPressed: _submitting ? null : _submit,
              child: _submitting
                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5))
                  : Text(l.kycSubmit),
            ),
          ],
        ),
      ),
    );
  }
}

class _TypeRow extends StatelessWidget {
  const _TypeRow({
    required this.title,
    required this.hint,
    required this.color,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  final String title;
  final String hint;
  final Color color;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Semantics(
      selected: selected,
      inMutuallyExclusiveGroup: true,
      button: true,
      child: Material(
        color: selected ? CbColors.brandTint : CbColors.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(CbRadius.control),
          side: BorderSide(color: selected ? CbColors.brand : CbColors.line, width: selected ? 2 : 1),
        ),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(CbRadius.control),
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 64),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: CbSpace.m, vertical: CbSpace.s),
              child: Row(
                children: [
                  Icon(icon, color: color),
                  const SizedBox(width: CbSpace.m),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(title, style: text.titleSmall),
                        Text(hint, maxLines: 2, overflow: TextOverflow.ellipsis, style: text.bodySmall),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
