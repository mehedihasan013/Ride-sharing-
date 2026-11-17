import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../models/driver_models.dart';
import '../services/driver_api_service.dart';
import '../services/driver_socket_service.dart';

class DriverWalletScreen extends StatefulWidget {
  const DriverWalletScreen({super.key});

  @override
  State<DriverWalletScreen> createState() => _DriverWalletScreenState();
}

class _DriverWalletScreenState extends State<DriverWalletScreen> {
  bool _isRecharging = false;

  Future<void> _openTopupModal(
    BuildContext context,
    DriverSocketService socketService, {
    String initialMethod = 'BKASH',
    double initialAmount = 200,
  }) async {
    String selectedMethod = initialMethod;
    double selectedAmount = initialAmount;
    // 3-step bKash Tokenized Checkout state:
    // Step 0 = Select Amount & Create PaymentID -> Step 1 = OTP & PIN Verification -> Step 2 = Execute & Credit Ledger Receipt
    int bkashStep = 0;
    bool modalLoading = false;
    BkashCreatePaymentResult? createdPayment;
    BkashExecutePaymentResult? executedResult;
    final double startingBalance = socketService.wallet.currentBalance;

    final accountController = TextEditingController(text: '01811-223304');
    final otpController = TextEditingController(text: '123456');
    final pinController = TextEditingController(text: '12121');

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            final isBkash = selectedMethod == 'BKASH';
            final brandColor = isBkash
                ? const Color(0xFFE2136E)
                : const Color(0xFFF7941D);

            Future<void> handleCreateBkashPayment() async {
              setModalState(() => modalLoading = true);
              try {
                final created = await socketService
                    .createBkashTokenizedPayment(selectedAmount);
                setModalState(() {
                  createdPayment = created;
                  bkashStep = 1;
                  modalLoading = false;
                });
              } catch (_) {
                setModalState(() => modalLoading = false);
              }
            }

            Future<void> handleExecuteBkashPayment() async {
              final pid = createdPayment?.paymentID ?? '';
              if (pid.isEmpty) return;
              setModalState(() => modalLoading = true);
              try {
                final cleanMsisdn = accountController.text
                    .replaceAll(RegExp(r'[^0-9]'), '');
                final res = await socketService.executeBkashTokenizedPayment(
                  paymentID: pid,
                  amountBdt: selectedAmount,
                  msisdn: cleanMsisdn.isEmpty ? '01811223304' : cleanMsisdn,
                );
                setModalState(() {
                  executedResult = res;
                  bkashStep = 2;
                  modalLoading = false;
                });
              } catch (_) {
                setModalState(() => modalLoading = false);
              }
            }

            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: brandColor,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                isBkash ? 'bKash v1.2' : 'Nagad',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Text(
                              isBkash
                                  ? 'বিকাশ টোকেনাইজড চেকআউট'
                                  : 'নগদ ইনস্ট্যান্ট রিচার্জ গেটওয়ে',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        IconButton(
                          onPressed: () => Navigator.of(ctx).pop(),
                          icon: const Icon(Icons.close),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // 3-Step Indicator for bKash Tokenized Checkout
                    if (isBkash)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 8,
                        ),
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFDF2F7),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: const Color(0xFFE2136E).withOpacity(0.3),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildStepChip(
                              label: '১. Create ID',
                              active: bkashStep == 0,
                              completed: bkashStep > 0,
                            ),
                            const Icon(Icons.arrow_forward_ios,
                                size: 11, color: Colors.black38),
                            _buildStepChip(
                              label: '২. OTP ও PIN',
                              active: bkashStep == 1,
                              completed: bkashStep > 1,
                            ),
                            const Icon(Icons.arrow_forward_ios,
                                size: 11, color: Colors.black38),
                            _buildStepChip(
                              label: '৩. Execute',
                              active: bkashStep == 2,
                              completed: bkashStep == 2,
                            ),
                          ],
                        ),
                      ),

                    // Gateway Selector (only visible in Step 0)
                    if (bkashStep == 0) ...[
                      Row(
                        children: [
                          Expanded(
                            child: ChoiceChip(
                              label: const Text('বিকাশ (bKash)'),
                              selected: isBkash,
                              selectedColor:
                                  const Color(0xFFE2136E).withOpacity(0.18),
                              onSelected: (_) {
                                setModalState(() {
                                  selectedMethod = 'BKASH';
                                  bkashStep = 0;
                                });
                              },
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: ChoiceChip(
                              label: const Text('নগদ (Nagad)'),
                              selected: !isBkash,
                              selectedColor:
                                  const Color(0xFFF7941D).withOpacity(0.22),
                              onSelected: (_) {
                                setModalState(() {
                                  selectedMethod = 'NAGAD';
                                  bkashStep = 0;
                                });
                              },
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      const Text(
                        'রিচার্জ পরিমাণ নির্বাচন করুন:',
                        style: TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 13.5),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [100.0, 200.0, 500.0].map((amt) {
                          final isSelected = selectedAmount == amt;
                          return Expanded(
                            child: Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 4),
                              child: OutlinedButton(
                                style: OutlinedButton.styleFrom(
                                  backgroundColor: isSelected
                                      ? brandColor.withOpacity(0.14)
                                      : Colors.white,
                                  side: BorderSide(
                                    color: isSelected
                                        ? brandColor
                                        : Colors.grey.shade300,
                                    width: isSelected ? 2 : 1,
                                  ),
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 14),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                                onPressed: () {
                                  setModalState(() => selectedAmount = amt);
                                },
                                child: Text(
                                  '+৳${amt.toStringAsFixed(0)}',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w800,
                                    color: isSelected
                                        ? brandColor
                                        : Colors.black87,
                                  ),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 16),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'রিচার্জের পর নতুন ব্যালেন্স হবে:',
                              style: TextStyle(fontSize: 13),
                            ),
                            Text(
                              '৳${(startingBalance + selectedAmount).toStringAsFixed(2)}',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFF006A4E),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton.icon(
                          style: FilledButton.styleFrom(
                            backgroundColor: brandColor,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          onPressed: modalLoading
                              ? null
                              : () async {
                                  if (isBkash) {
                                    await handleCreateBkashPayment();
                                  } else {
                                    Navigator.of(ctx).pop();
                                    await _executeTopup(
                                      context,
                                      socketService,
                                      amountBdt: selectedAmount,
                                      method: selectedMethod,
                                    );
                                  }
                                },
                          icon: modalLoading
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Icon(Icons.bolt),
                          label: Text(
                            isBkash
                                ? 'ধাপ ১: PaymentID তৈরি করুন (+৳${selectedAmount.toStringAsFixed(0)})'
                                : 'নগদ দিয়ে +৳${selectedAmount.toStringAsFixed(0)} পেমেন্ট নিশ্চিত করুন',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ),
                    ],

                    // Step 2 (bkashStep == 1): OTP & PIN Verification UI
                    if (isBkash && bkashStep == 1 && createdPayment != null) ...[
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE2136E),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'CholoBhairab (চলো ভৈরব)',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                  ),
                                ),
                                Text(
                                  '৳${createdPayment!.amountBdt.toStringAsFixed(0)}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w900,
                                    fontSize: 18,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'PaymentID: ${createdPayment!.paymentID}',
                              style: const TextStyle(
                                color: Colors.white70,
                                fontSize: 11.5,
                                fontFamily: 'monospace',
                              ),
                            ),
                            Text(
                              'Invoice: #${createdPayment!.invoiceNumber}',
                              style: const TextStyle(
                                color: Colors.white70,
                                fontSize: 11.5,
                                fontFamily: 'monospace',
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                      TextField(
                        controller: accountController,
                        keyboardType: TextInputType.phone,
                        decoration: InputDecoration(
                          labelText: 'বিকাশ অ্যাকাউন্ট নম্বর (bKash Wallet)',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          prefixIcon: const Icon(Icons.phone_android),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: otpController,
                              keyboardType: TextInputType.number,
                              maxLength: 6,
                              decoration: InputDecoration(
                                labelText: '৬-ডিজিট OTP',
                                counterText: '',
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: TextField(
                              controller: pinController,
                              obscureText: true,
                              keyboardType: TextInputType.number,
                              maxLength: 5,
                              decoration: InputDecoration(
                                labelText: '৫-ডিজিট PIN',
                                counterText: '',
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton.icon(
                          style: FilledButton.styleFrom(
                            backgroundColor: const Color(0xFFE2136E),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          onPressed:
                              modalLoading ? null : handleExecuteBkashPayment,
                          icon: modalLoading
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Icon(Icons.verified_user),
                          label: const Text(
                            '✓ পেমেন্ট নিশ্চিত করুন (Execute & Credit)',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ),
                    ],

                    // Step 3 (bkashStep == 2): Server Execute Verified & Ledger Credited Receipt
                    if (isBkash &&
                        bkashStep == 2 &&
                        executedResult != null) ...[
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFFAF5),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: const Color(0xFF006A4E),
                            width: 1.5,
                          ),
                        ),
                        child: Column(
                          children: [
                            const Icon(
                              Icons.check_circle,
                              color: Color(0xFF006A4E),
                              size: 42,
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              '✓ বিকাশ পেমেন্ট সফল • লেজার আপডেট হয়েছে!',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                                color: Color(0xFF006A4E),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'TrxID: ${executedResult!.trxID}',
                              style: const TextStyle(
                                fontFamily: 'monospace',
                                fontWeight: FontWeight.w800,
                                fontSize: 13.5,
                              ),
                            ),
                            Text(
                              'PaymentID: ${executedResult!.paymentID}',
                              style: const TextStyle(
                                fontFamily: 'monospace',
                                fontSize: 11.5,
                                color: Colors.black54,
                              ),
                            ),
                            const SizedBox(height: 10),
                            Text(
                              'নতুন ওয়ালেট ব্যালেন্স: ৳${startingBalance.toStringAsFixed(0)} → ৳${executedResult!.newBalance.toStringAsFixed(0)}',
                              style: const TextStyle(
                                fontWeight: FontWeight.w900,
                                fontSize: 16,
                                color: Color(0xFF006A4E),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          style: FilledButton.styleFrom(
                            backgroundColor: const Color(0xFF006A4E),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          onPressed: () => Navigator.of(ctx).pop(),
                          child: const Text(
                            '✓ সম্পন্ন — ওয়ালেট লেজারে ফিরুন',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            );
          },
        );
      },
    );

    Future.delayed(const Duration(milliseconds: 400), () {
      accountController.dispose();
      otpController.dispose();
      pinController.dispose();
    });
  }

  Widget _buildStepChip({
    required String label,
    required bool active,
    required bool completed,
  }) {
    final bgColor = active
        ? const Color(0xFFE2136E)
        : completed
            ? const Color(0xFF006A4E)
            : Colors.grey.shade300;
    final textColor =
        (active || completed) ? Colors.white : Colors.black87;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: textColor,
          fontSize: 11,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Future<void> _executeTopup(
    BuildContext context,
    DriverSocketService socketService, {
    required double amountBdt,
    required String method,
  }) async {
    setState(() => _isRecharging = true);
    try {
      final tx = await socketService.topupWallet(
        amountBdt: amountBdt,
        method: method,
      );
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF006A4E),
            content: Text(
              '✓ ${tx.noteBangla} সফল! বর্তমান ব্যালেন্স: ৳${tx.balanceAfter.toStringAsFixed(2)}',
            ),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isRecharging = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final socketService = context.watch<DriverSocketService>();
    final wallet = socketService.wallet;
    final transactions = socketService.transactions;
    final thresholdProgress =
        (wallet.currentBalance / 250.0).clamp(0.0, 1.0);
    final timeFormatter = DateFormat('dd MMM, hh:mm a');

    return RefreshIndicator(
      onRefresh: socketService.refreshWallet,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // 1. Prepaid Balance Hero Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: wallet.isLockedOut
                    ? [const Color(0xFF991B1B), const Color(0xFFF42A41)]
                    : [const Color(0xFF006A4E), const Color(0xFF044E3A)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF006A4E).withOpacity(0.22),
                  blurRadius: 12,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'প্রিপেইড চালক ওয়ালেট ব্যালেন্স',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 13.5,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.18),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        wallet.isLockedOut
                            ? '🔒 বিডিং লকড (< ৳৫০)'
                            : '🟢 বিডিং সক্রিয় (≥ ৳৫০)',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11.5,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  '৳${wallet.currentBalance.toStringAsFixed(2)}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 36,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 12),

                // 50 BDT Minimum Threshold Progress Bar
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: LinearProgressIndicator(
                    value: thresholdProgress,
                    minHeight: 8,
                    backgroundColor: Colors.white24,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      wallet.isLockedOut
                          ? const Color(0xFFFDE047)
                          : const Color(0xFF34D399),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  wallet.isLockedOut
                      ? 'সতর্কতা: বিড করতে ন্যূনতম ৳৫০ ব্যালেন্স প্রয়োজন (আরও ৳${(50 - wallet.currentBalance).clamp(0, 50).toStringAsFixed(0)} যোগ করুন)'
                      : 'ন্যূনতম বিডিং সীমা: ৳৫০.০০ • প্রতিটি নগদ ট্রিপে মাত্র ৮% কমিশন স্বয়ংক্রিয়ভাবে কর্তন হয়',
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 2. 1-Tap bKash (#E2136E) & Nagad (#F7941D) Instant Top-Up Card
          Card(
            elevation: 2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.bolt, color: Color(0xFFE2136E)),
                      SizedBox(width: 6),
                      Text(
                        '১-ট্যাপ বিকাশ ও নগদ ইনস্ট্যান্ট রিচার্জ',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'আপনার প্রিপেইড ব্যালেন্স তাৎক্ষণিক রিচার্জ করতে নিচের পরিমাণ ট্যাপ করুন:',
                    style: TextStyle(fontSize: 12.5, color: Colors.black54),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [100.0, 200.0, 500.0].map((amount) {
                      return Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 4),
                          child: FilledButton(
                            style: FilledButton.styleFrom(
                              backgroundColor: const Color(0xFFE2136E),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            onPressed: _isRecharging
                                ? null
                                : () => _openTopupModal(
                                      context,
                                      socketService,
                                      initialMethod: 'BKASH',
                                      initialAmount: amount,
                                    ),
                            child: Text(
                              '+৳${amount.toStringAsFixed(0)}',
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 15,
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFFE2136E),
                            side: const BorderSide(
                              color: Color(0xFFE2136E),
                              width: 1.5,
                            ),
                          ),
                          onPressed: () => _openTopupModal(
                            context,
                            socketService,
                            initialMethod: 'BKASH',
                          ),
                          icon: const Icon(Icons.account_balance_wallet, size: 17),
                          label: const Text('bKash Tokenized Checkout'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFFD97706),
                            side: const BorderSide(
                              color: Color(0xFFF7941D),
                              width: 1.5,
                            ),
                          ),
                          onPressed: () => _openTopupModal(
                            context,
                            socketService,
                            initialMethod: 'NAGAD',
                          ),
                          icon: const Icon(Icons.payments_outlined, size: 17),
                          label: const Text('Nagad গেটওয়ে মডাল'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),

          // 3. 8% Commission Policy Explanation Banner
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFEFFAF5),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: const Color(0xFF006A4E).withOpacity(0.3),
              ),
            ),
            child: const Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.info_outline, color: Color(0xFF006A4E), size: 20),
                SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'কীভাবে ৮% প্রিপেইড কমিশন কাজ করে?',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13.5,
                          color: Color(0xFF006A4E),
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'যাত্রীর কাছ থেকে আপনি ১০০% ভাড়া নগদে (Cash) গ্রহণ করবেন। ট্রিপ সম্পন্ন হলে শুধু ৮% সার্ভিস কমিশন (যেমন ৳৯০ ভাড়ায় ৳৭) আপনার প্রিপেইড ওয়ালেট থেকে কাটা হয়।',
                        style: TextStyle(fontSize: 12, color: Colors.black87),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          // 4. Full Transaction Ledger List
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'লেনদেন ও কমিশন লেজার (Transaction Ledger)',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
              ),
              Text(
                'মোট ${transactions.length}টি',
                style: const TextStyle(fontSize: 12, color: Colors.black54),
              ),
            ],
          ),
          const SizedBox(height: 8),

          if (transactions.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: Text('কোনো লেনদেন পাওয়া যায়নি')),
              ),
            )
          else
            ...transactions.map((tx) {
              final isCredit = tx.isCredit;
              Color badgeColor;
              IconData iconData;
              switch (tx.type) {
                case 'BKASH_TOPUP':
                  badgeColor = const Color(0xFFE2136E);
                  iconData = Icons.add_card;
                  break;
                case 'NAGAD_TOPUP':
                  badgeColor = const Color(0xFFF7941D);
                  iconData = Icons.account_balance_wallet;
                  break;
                case 'PROMOTIONAL_BONUS':
                  badgeColor = const Color(0xFF006A4E);
                  iconData = Icons.card_giftcard;
                  break;
                default:
                  badgeColor = const Color(0xFFF42A41);
                  iconData = Icons.trending_down;
              }

              return Card(
                margin: const EdgeInsets.only(bottom: 10),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: badgeColor.withOpacity(0.12),
                    child: Icon(iconData, color: badgeColor, size: 20),
                  ),
                  title: Text(
                    tx.noteBangla,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 13.5,
                    ),
                  ),
                  subtitle: Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      '${tx.typeBadgeBangla} • ${timeFormatter.format(tx.createdAt)} • অবশিষ্ট: ৳${tx.balanceAfter.toStringAsFixed(0)}',
                      style: const TextStyle(fontSize: 11.5),
                    ),
                  ),
                  trailing: Text(
                    '${isCredit ? '+' : ''}৳${tx.amount.toStringAsFixed(0)}',
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 16,
                      color: isCredit
                          ? const Color(0xFF006A4E)
                          : const Color(0xFFF42A41),
                    ),
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }
}
