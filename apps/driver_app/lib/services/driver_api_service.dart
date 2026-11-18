import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/driver_models.dart';

/// Backend base URL; override at build time with --dart-define=API_URL=https://api.example.com
const String kApiUrl =
    String.fromEnvironment('API_URL', defaultValue: 'http://localhost:4000');

class WalletFetchResult {
  final DriverWalletModel wallet;
  final List<WalletTransactionModel> transactions;
  final bool isLiveBackend;

  const WalletFetchResult({
    required this.wallet,
    required this.transactions,
    required this.isLiveBackend,
  });
}

class KycSubmissionResult {
  final bool success;
  final String status;
  final String messageBangla;
  final bool isLiveBackend;

  const KycSubmissionResult({
    required this.success,
    required this.status,
    required this.messageBangla,
    required this.isLiveBackend,
  });
}

class BkashCreatePaymentResult {
  final bool success;
  final String paymentID;
  final String invoiceNumber;
  final String bkashURL;
  final double amountBdt;
  final String mode;
  final bool isLiveBackend;

  const BkashCreatePaymentResult({
    required this.success,
    required this.paymentID,
    required this.invoiceNumber,
    required this.bkashURL,
    required this.amountBdt,
    required this.mode,
    required this.isLiveBackend,
  });
}

class BkashExecutePaymentResult {
  final bool success;
  final bool alreadyCompleted;
  final String paymentID;
  final String trxID;
  final String status;
  final double newBalance;
  final WalletTransactionModel transaction;
  final bool isLiveBackend;

  const BkashExecutePaymentResult({
    required this.success,
    required this.alreadyCompleted,
    required this.paymentID,
    required this.trxID,
    required this.status,
    required this.newBalance,
    required this.transaction,
    required this.isLiveBackend,
  });
}

class DriverApiService {
  final String baseUrl;
  final http.Client _client;

  DriverApiService({
    this.baseUrl = kApiUrl,
    http.Client? client,
  }) : _client = client ?? http.Client();

  /// GET /wallet/:driverId
  Future<WalletFetchResult> fetchDriverWallet(
    String driverId, {
    double fallbackBalance = 193.0,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/wallet/$driverId');
      final response = await _client
          .get(uri, headers: {'Accept': 'application/json'})
          .timeout(const Duration(seconds: 4));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final decoded = jsonDecode(response.body) as Map<String, dynamic>;
        final walletJson =
            (decoded['wallet'] as Map<String, dynamic>?) ?? <String, dynamic>{};
        final txListRaw = (decoded['transactions'] as List<dynamic>?) ?? const [];

        final wallet = DriverWalletModel.fromJson(walletJson);
        final transactions = txListRaw
            .whereType<Map<String, dynamic>>()
            .map(WalletTransactionModel.fromJson)
            .toList()
          ..sort((a, b) => b.createdAt.compareTo(a.createdAt));

        return WalletFetchResult(
          wallet: wallet,
          transactions: transactions,
          isLiveBackend: true,
        );
      }
    } catch (_) {
      // Fallback to local Bhairab seed below when backend is unreachable
    }

    final now = DateTime.now();
    return WalletFetchResult(
      wallet: DriverWalletModel(
        driverId: driverId,
        currentBalance: fallbackBalance,
        isLockedOut: fallbackBalance < DriverWalletModel.minimumBidBalanceBdt,
        lastTopupAt: now.subtract(const Duration(hours: 2)),
      ),
      transactions: [
        WalletTransactionModel(
          id: 'tx_seed_comm_1',
          type: 'COMMISSION_DEDUCTION',
          amount: -7.0,
          balanceAfter: fallbackBalance,
          noteBangla: 'ট্রিপ কমিশন কর্তন (৮%): ৭ টাকা (ভাড়া ৯০ টাকা)',
          referenceRideId: 'ride_seed_completed_1',
          createdAt: now.subtract(const Duration(minutes: 30)),
        ),
        WalletTransactionModel(
          id: 'tx_seed_bonus_1',
          type: 'PROMOTIONAL_BONUS',
          amount: 200.0,
          balanceAfter: 200.0,
          noteBangla: 'চলো ভৈরব উদ্বোধনী স্বাগতম বোনাস',
          createdAt: now.subtract(const Duration(hours: 5)),
        ),
      ],
      isLiveBackend: false,
    );
  }

  /// POST /wallet/topup/bkash
  Future<WalletTransactionModel> topupWallet({
    required String driverId,
    required double amountBdt,
    required String method, // 'BKASH' | 'NAGAD'
    required double currentBalance,
    String? trxId,
  }) async {
    final generatedTrxId = trxId ??
        '${method == 'NAGAD' ? 'NGD' : 'BKH'}${DateTime.now().millisecondsSinceEpoch.toString().substring(6)}';

    try {
      final uri = Uri.parse('$baseUrl/wallet/topup/bkash');
      final response = await _client
          .post(
            uri,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: jsonEncode({
              'driverId': driverId,
              'amountBdt': amountBdt,
              'trxId': generatedTrxId,
              'method': method,
            }),
          )
          .timeout(const Duration(seconds: 4));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final decoded = jsonDecode(response.body) as Map<String, dynamic>;
        final txJson = (decoded['transaction'] as Map<String, dynamic>?) ??
            <String, dynamic>{};
        return WalletTransactionModel.fromJson(txJson);
      }
    } catch (_) {
      // Offline fallback below
    }

    final isNagad = method.toUpperCase() == 'NAGAD';
    final updatedBalance = currentBalance + amountBdt;
    return WalletTransactionModel(
      id: 'tx_${isNagad ? 'nagad' : 'bkash'}_${DateTime.now().millisecondsSinceEpoch}',
      type: isNagad ? 'NAGAD_TOPUP' : 'BKASH_TOPUP',
      amount: amountBdt,
      balanceAfter: updatedBalance,
      gatewayTrxId: generatedTrxId,
      noteBangla:
          '${isNagad ? 'নগদ' : 'বিকাশ'} ওয়ালেট রিচার্জ: ${amountBdt.toStringAsFixed(0)} টাকা (TrxID: $generatedTrxId)',
      createdAt: DateTime.now(),
    );
  }

  /// POST /payments/bkash/create (Step 1 of Tokenized Checkout v1.2.0-beta)
  Future<BkashCreatePaymentResult> createBkashTokenizedPayment(
    String driverId,
    double amountBdt,
  ) async {
    try {
      final uri = Uri.parse('$baseUrl/payments/bkash/create');
      final response = await _client
          .post(
            uri,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: jsonEncode({
              'driverId': driverId,
              'amountBdt': amountBdt,
            }),
          )
          .timeout(const Duration(seconds: 4));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final decoded = jsonDecode(response.body) as Map<String, dynamic>;
        final paymentId = (decoded['paymentID'] ?? '').toString();
        return BkashCreatePaymentResult(
          success: decoded['success'] == true,
          paymentID: paymentId,
          invoiceNumber: (decoded['invoiceNumber'] ?? '').toString(),
          bkashURL: (decoded['bkashURL'] ??
                  '$baseUrl/payments/bkash/mock/checkout?paymentID=$paymentId')
              .toString(),
          amountBdt: (decoded['amountBdt'] as num?)?.toDouble() ?? amountBdt,
          mode: (decoded['mode'] ?? 'MOCK').toString(),
          isLiveBackend: true,
        );
      }
    } catch (_) {
      // Offline fallback below
    }

    final ts = DateTime.now().millisecondsSinceEpoch;
    final fallbackPid = 'TR0011$ts';
    return BkashCreatePaymentResult(
      success: true,
      paymentID: fallbackPid,
      invoiceNumber: 'INV-CB-$ts-204',
      bkashURL: '$baseUrl/payments/bkash/mock/checkout?paymentID=$fallbackPid',
      amountBdt: amountBdt,
      mode: 'MOCK',
      isLiveBackend: false,
    );
  }

  /// POST /payments/bkash/execute (Step 3 of Tokenized Checkout v1.2.0-beta)
  Future<BkashExecutePaymentResult> executeBkashTokenizedPayment(
    String paymentID, {
    String status = 'success',
    String msisdn = '01811223304',
    double fallbackAmountBdt = 200,
    double currentBalance = 35,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/payments/bkash/execute');
      final response = await _client
          .post(
            uri,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: jsonEncode({
              'paymentID': paymentID,
              'status': status,
              'msisdn': msisdn,
            }),
          )
          .timeout(const Duration(seconds: 4));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final decoded = jsonDecode(response.body) as Map<String, dynamic>;
        final paymentMap =
            (decoded['payment'] as Map<String, dynamic>?) ?? <String, dynamic>{};
        final walletMap =
            (decoded['wallet'] as Map<String, dynamic>?) ?? <String, dynamic>{};
        final txMap = (decoded['transaction'] as Map<String, dynamic>?) ??
            <String, dynamic>{};

        final trxId = (paymentMap['trxID'] ??
                txMap['gatewayTrxId'] ??
                'BKH${DateTime.now().millisecondsSinceEpoch.toString().substring(6)}M')
            .toString();
        final newBal = (walletMap['currentBalance'] as num?)?.toDouble() ??
            (currentBalance + fallbackAmountBdt);
        final txModel = txMap.isNotEmpty
            ? WalletTransactionModel.fromJson(txMap)
            : WalletTransactionModel(
                id: 'tx_bkash_${DateTime.now().millisecondsSinceEpoch}',
                type: 'BKASH_TOPUP',
                amount: fallbackAmountBdt,
                balanceAfter: newBal,
                gatewayTrxId: trxId,
                noteBangla:
                    'বিকাশ টোকেনাইজড রিচার্জ: ${fallbackAmountBdt.toStringAsFixed(0)} টাকা (TrxID: $trxId)',
                createdAt: DateTime.now(),
              );

        return BkashExecutePaymentResult(
          success: decoded['success'] == true,
          alreadyCompleted: decoded['alreadyCompleted'] == true,
          paymentID: paymentID,
          trxID: trxId,
          status: (paymentMap['status'] ?? 'COMPLETED').toString(),
          newBalance: newBal,
          transaction: txModel,
          isLiveBackend: true,
        );
      }
    } catch (_) {
      // Offline fallback below
    }

    final fallbackTrxId =
        'BKH${DateTime.now().millisecondsSinceEpoch.toString().substring(6)}M';
    final updatedBalance = currentBalance + fallbackAmountBdt;
    final txModel = WalletTransactionModel(
      id: 'tx_bkash_${DateTime.now().millisecondsSinceEpoch}',
      type: 'BKASH_TOPUP',
      amount: fallbackAmountBdt,
      balanceAfter: updatedBalance,
      gatewayTrxId: fallbackTrxId,
      noteBangla:
          'বিকাশ টোকেনাইজড রিচার্জ: ${fallbackAmountBdt.toStringAsFixed(0)} টাকা (TrxID: $fallbackTrxId)',
      createdAt: DateTime.now(),
    );

    return BkashExecutePaymentResult(
      success: true,
      alreadyCompleted: false,
      paymentID: paymentID,
      trxID: fallbackTrxId,
      status: 'COMPLETED',
      newBalance: updatedBalance,
      transaction: txModel,
      isLiveBackend: false,
    );
  }

  /// POST /auth/driver/kyc
  Future<KycSubmissionResult> submitDriverKyc({
    required String driverId,
    required String nidNumber,
    required String vehicleType,
    required String vehicleModel,
    String? brtaLicenseNo,
    String? unionCouncilorCertUrl,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/auth/driver/kyc');
      final response = await _client
          .post(
            uri,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: jsonEncode({
              'driverId': driverId,
              'nidNumber': nidNumber,
              'vehicleType': vehicleType,
              'vehicleModel': vehicleModel,
              if (brtaLicenseNo != null && brtaLicenseNo.isNotEmpty)
                'brtaLicenseNo': brtaLicenseNo,
              if (unionCouncilorCertUrl != null &&
                  unionCouncilorCertUrl.isNotEmpty)
                'unionCouncilorCertUrl': unionCouncilorCertUrl,
            }),
          )
          .timeout(const Duration(seconds: 4));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final decoded = jsonDecode(response.body) as Map<String, dynamic>;
        return KycSubmissionResult(
          success: decoded['success'] == true,
          status: (decoded['status'] ?? 'APPROVED').toString(),
          messageBangla: (decoded['messageBangla'] ??
                  'আপনার চালক আবেদন অনুমোদিত হয়েছে। এখন আপনি ট্রিপ শুরু করতে পারবেন!')
              .toString(),
          isLiveBackend: true,
        );
      }
    } catch (_) {
      // Offline fallback below
    }

    return const KycSubmissionResult(
      success: true,
      status: 'APPROVED',
      messageBangla:
          'আপনার চালক আবেদন অনুমোদিত হয়েছে (ভৈরব পাইলট ভেরিফাইড)। এখন আপনি ট্রিপ শুরু করতে পারবেন!',
      isLiveBackend: false,
    );
  }

  /// GET /geo/landmarks
  Future<List<BhairabLandmark>> fetchBhairabLandmarks({String query = ''}) async {
    try {
      final uri = Uri.parse('$baseUrl/geo/landmarks').replace(
        queryParameters: query.isEmpty ? null : {'q': query},
      );
      final response = await _client
          .get(uri, headers: {'Accept': 'application/json'})
          .timeout(const Duration(seconds: 4));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final decoded = jsonDecode(response.body) as Map<String, dynamic>;
        final rawList = (decoded['landmarks'] as List<dynamic>?) ?? const [];
        final parsed = rawList
            .whereType<Map<String, dynamic>>()
            .map(BhairabLandmark.fromJson)
            .toList();
        if (parsed.isNotEmpty) {
          return parsed;
        }
      }
    } catch (_) {
      // Return default landmarks below
    }
    return BhairabLandmark.defaultLandmarks;
  }
}
