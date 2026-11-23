import 'package:cholo_ui/cholo_ui.dart';
import 'package:flutter/services.dart';
import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../l10n/app_localizations.dart';
import '../../services/driver_api_service.dart';
import '../../services/driver_socket_service.dart';

/// Opens the bKash tokenized checkout for [amount].
Future<void> showBkashTopup(BuildContext context, double amount) => showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (_) => TopupSheet(amount: amount),
    );

enum _Step { creating, pay, paying, done, failed }

/// bKash checkout in three steps: create payment, pay from the bKash account, receipt.
class TopupSheet extends StatefulWidget {
  const TopupSheet({super.key, required this.amount});

  final double amount;

  @override
  State<TopupSheet> createState() => _TopupSheetState();
}

class _TopupSheetState extends State<TopupSheet> {
  _Step _step = _Step.creating;
  BkashCreatePaymentResult? _payment;
  BkashExecutePaymentResult? _result;
  final _account = TextEditingController(text: kDemoMode ? '01811223304' : '');

  @override
  void initState() {
    super.initState();
    _create();
  }

  @override
  void dispose() {
    _account.dispose();
    super.dispose();
  }

  Future<void> _create() async {
    setState(() => _step = _Step.creating);
    try {
      final payment = await context.read<DriverSocketService>().createBkashTokenizedPayment(widget.amount);
      if (!mounted) return;
      setState(() {
        _payment = payment;
        _step = _Step.pay;
      });
    } catch (_) {
      if (mounted) setState(() => _step = _Step.failed);
    }
  }

  Future<void> _pay() async {
    final payment = _payment;
    if (payment == null) return;
    setState(() => _step = _Step.paying);
    try {
      final msisdn = _account.text.replaceAll(RegExp(r'\D'), '');
      final result = await context.read<DriverSocketService>().executeBkashTokenizedPayment(
            paymentID: payment.paymentID,
            amountBdt: widget.amount,
            msisdn: msisdn.isEmpty ? '01811223304' : msisdn,
          );
      if (!mounted) return;
      setState(() {
        _result = result;
        _step = _Step.done;
      });
    } catch (_) {
      if (mounted) setState(() => _step = _Step.failed);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          CbSpace.gutter,
          0,
          CbSpace.gutter,
          CbSpace.l + MediaQuery.viewInsetsOf(context).bottom,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: CbSpace.s, vertical: 2),
                  decoration: BoxDecoration(color: CbColors.bkash, borderRadius: BorderRadius.circular(CbRadius.chip)),
                  child: Text('bKash', style: text.labelLarge?.copyWith(color: CbColors.surface)),
                ),
                const SizedBox(width: CbSpace.s),
                Expanded(child: Text(fmtMoney(widget.amount), style: cbMoneyStyle(22))),
              ],
            ),
            const SizedBox(height: CbSpace.l),
            ...switch (_step) {
              _Step.creating => [
                  const Center(child: CircularProgressIndicator()),
                  const SizedBox(height: CbSpace.m),
                  Text(l.topupConnecting, textAlign: TextAlign.center, style: text.bodyMedium),
                ],
              _Step.pay || _Step.paying => _payStep(l, text),
              _Step.done => _doneStep(l, text),
              _Step.failed => [
                  CbBanner(tone: CbTone.danger, message: l.topupFailed),
                  const SizedBox(height: CbSpace.l),
                  FilledButton(
                    onPressed: _payment == null ? _create : _pay,
                    child: Text(l.topupPay(fmtMoney(widget.amount))),
                  ),
                ],
            },
          ],
        ),
      ),
    );
  }

  List<Widget> _payStep(AppLocalizations l, TextTheme text) {
    final payment = _payment!;
    return [
      _InfoRow(label: l.topupMerchant, value: 'Cholo Bhairab'),
      _InfoRow(label: l.topupInvoice, value: payment.invoiceNumber, mono: true),
      const SizedBox(height: CbSpace.m),
      TextField(
        controller: _account,
        keyboardType: TextInputType.phone,
        inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9 \-]'))],
        decoration: InputDecoration(labelText: l.topupAccount),
      ),
      if (!payment.isLiveBackend) ...[
        const SizedBox(height: CbSpace.s),
        Text(l.walletOfflineDemo, style: text.bodySmall),
      ],
      const SizedBox(height: CbSpace.l),
      FilledButton(
        style: FilledButton.styleFrom(backgroundColor: CbColors.bkash, foregroundColor: CbColors.surface),
        onPressed: _step == _Step.paying ? null : _pay,
        child: _step == _Step.paying
            ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5))
            : Text(l.topupPay(fmtMoney(widget.amount))),
      ),
    ];
  }

  List<Widget> _doneStep(AppLocalizations l, TextTheme text) {
    final result = _result!;
    return [
      const Icon(Icons.check_circle, size: 40, color: CbColors.brand),
      const SizedBox(height: CbSpace.s),
      Text(l.topupSuccess, textAlign: TextAlign.center, style: text.titleLarge),
      const SizedBox(height: CbSpace.m),
      _InfoRow(label: l.topupTrx, value: result.trxID, mono: true),
      _InfoRow(label: l.sumBalance, value: fmtMoney(result.newBalance)),
      if (!result.isLiveBackend) Text(l.walletOfflineDemo, style: text.bodySmall),
      const SizedBox(height: CbSpace.l),
      FilledButton(onPressed: () => Navigator.of(context).pop(), child: Text(l.commonDone)),
    ];
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value, this.mono = false});

  final String label;
  final String value;
  final bool mono;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: CbSpace.xs),
        child: Row(
          children: [
            Text(label, style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(width: CbSpace.l),
            Expanded(
              child: Text(
                value,
                textAlign: TextAlign.end,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: mono ? cbMoneyStyle(14, weight: FontWeight.w500) : Theme.of(context).textTheme.bodyLarge,
              ),
            ),
          ],
        ),
      );
}
