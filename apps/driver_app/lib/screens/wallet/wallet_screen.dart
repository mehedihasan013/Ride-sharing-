import 'package:cholo_ui/cholo_ui.dart';
import 'package:intl/intl.dart';
import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../l10n/app_localizations.dart';
import '../../models/driver_models.dart';
import '../../services/driver_api_service.dart';
import '../../services/driver_socket_service.dart';
import '../../widgets/labels.dart';
import 'topup_sheet.dart';

/// Balance, top-up (bKash; Nagad in demo builds) and history.
class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  static final _date = DateFormat('dd/MM HH:mm', 'en');

  double _amount = 200;
  bool _nagad = false;
  bool _busy = false;

  Future<void> _topUp() async {
    if (!_nagad) return showBkashTopup(context, _amount);
    final messenger = ScaffoldMessenger.of(context);
    final l = AppLocalizations.of(context);
    setState(() => _busy = true);
    try {
      final tx = await context.read<DriverSocketService>().topupWallet(amountBdt: _amount, method: 'NAGAD');
      messenger.showSnackBar(SnackBar(content: Text(l.topupNagadDone(fmtMoney(tx.balanceAfter)))));
    } catch (_) {
      messenger.showSnackBar(SnackBar(content: Text(l.topupFailed)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final text = Theme.of(context).textTheme;
    final (wallet, transactions) = context.select<DriverSocketService, (DriverWalletModel, List<WalletTransactionModel>)>(
      (s) => (s.wallet, s.transactions),
    );
    final locked = wallet.isLockedOut;
    final method = _nagad ? 'Nagad' : 'bKash';

    return Scaffold(
      appBar: AppBar(title: Text(l.walletTitle)),
      body: RefreshIndicator(
        onRefresh: context.read<DriverSocketService>().refreshWallet,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(CbSpace.gutter, 0, CbSpace.gutter, CbSpace.xl),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(CbSpace.l),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(l.walletBalance, style: text.bodyMedium),
                    Wrap(
                      crossAxisAlignment: WrapCrossAlignment.center,
                      spacing: CbSpace.m,
                      runSpacing: CbSpace.xs,
                      children: [
                        Text(fmtMoney(wallet.currentBalance), style: cbMoneyStyle(32)),
                        StatusPill(
                          label: locked ? l.walletBiddingOff : l.walletBiddingOn,
                          dotColor: locked ? CbColors.danger : CbColors.brand,
                        ),
                      ],
                    ),
                    const SizedBox(height: CbSpace.xs),
                    Text(l.walletMinHint(fmtMoney(DriverWalletModel.minimumBidBalanceBdt)), style: text.bodySmall),
                  ],
                ),
              ),
            ),
            CbSectionLabel(l.walletTopup),
            Wrap(
              spacing: CbSpace.s,
              children: [
                for (final amount in const [100.0, 200.0, 500.0])
                  ChoiceChip(
                    showCheckmark: false,
                    label: Text(fmtMoney(amount)),
                    selected: _amount == amount,
                    onSelected: (_) => setState(() => _amount = amount),
                  ),
              ],
            ),
            if (kDemoMode) ...[
              const SizedBox(height: CbSpace.m),
              // shortcut: Nagad uses the admin-guarded top-up route, so it is demo-only until a
              // driver-facing Nagad API exists.
              SegmentedButton<bool>(
                showSelectedIcon: false,
                segments: const [
                  ButtonSegment(value: false, label: Text('bKash')),
                  ButtonSegment(value: true, label: Text('Nagad')),
                ],
                selected: {_nagad},
                onSelectionChanged: (value) => setState(() => _nagad = value.first),
              ),
            ],
            const SizedBox(height: CbSpace.m),
            FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: _nagad ? CbColors.nagad : CbColors.bkash,
                foregroundColor: _nagad ? CbColors.ink : CbColors.surface,
              ),
              onPressed: _busy ? null : _topUp,
              child: Text(l.walletTopupWith(method, fmtMoney(_amount))),
            ),
            const SizedBox(height: CbSpace.s),
            Text(l.walletCommissionNote, style: text.bodySmall),
            CbSectionLabel(l.walletHistory),
            if (transactions.isEmpty)
              Text(l.walletEmpty, style: text.bodyMedium)
            else
              for (final tx in transactions)
                ConstrainedBox(
                  constraints: const BoxConstraints(minHeight: 56),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(transactionLabel(l, tx.type), style: text.bodyLarge),
                            Text(_date.format(tx.createdAt), style: text.bodySmall),
                          ],
                        ),
                      ),
                      Text(
                        tx.isCredit ? '+${fmtMoney(tx.amount)}' : fmtMoney(tx.amount),
                        style: cbMoneyStyle(16, color: tx.isCredit ? CbColors.brand : CbColors.ink),
                      ),
                    ],
                  ),
                ),
          ],
        ),
      ),
    );
  }
}
