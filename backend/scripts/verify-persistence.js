/**
 * CholoBhairab Option C — Durable State & Server Restart Persistence Verification
 * Verifies that wallet balances, bKash payments, and KYC approvals survive a full
 * NestJS server shutdown (`await app1.close()`) and fresh reboot (`app2`):
 * 1. Boot NestJS AppModule Instance #1 (Port 4005)
 * 2. Reset seed state so driver_demo_4 starts at 35 BDT and kyc_4 is PENDING_VERIFICATION
 * 3. Execute a 200 BDT bKash top-up for driver_demo_4 (35 -> 235 BDT) and approve kyc_4
 * 4. Shut down Instance #1 completely (`await app1.close()`)
 * 5. Boot a brand-new NestJS AppModule Instance #2 from scratch (Port 4006)
 * 6. Query GET /wallet/driver_demo_4 and GET /admin/kyc on Instance #2 and verify:
 *    - driver_demo_4 still has 235 BDT across restarts
 *    - kyc_4 is still APPROVED across restarts
 * 7. Call resetSeedState() at the end so the workspace is left in a clean state.
 */

const assert = require('assert');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');

const PORT_1 = 4005;
const PORT_2 = 4006;

async function main() {
  console.log('======================================================================');
  console.log('🗄️  CHOLOBHAIRAB OPTION C — SERVER RESTART PERSISTENCE VERIFICATION');
  console.log('======================================================================\n');

  let persistedPaymentId = null;
  let persistedTrxId = null;

  // ---------------------------------------------------------------------------
  // INSTANCE #1: Boot, Reset Seed, Mutate Wallet (35 -> 235 BDT) & KYC (kyc_4 -> APPROVED), Close
  // ---------------------------------------------------------------------------
  console.log('STEP 1: Booting NestJS AppModule Instance #1...');
  const app1 = await NestFactory.create(AppModule, { logger: ['warn', 'error'] });
  app1.enableCors({ origin: '*' });
  await app1.listen(PORT_1, '127.0.0.1');
  const url1 = `http://127.0.0.1:${PORT_1}`;
  console.log(`✅ Instance #1 listening on ${url1}`);

  try {
    try {
      // Try HTTP calls against Instance #1
      const resetRes = await fetch(`${url1}/admin/reset-seed`, { method: 'POST' });
      assert.ok(resetRes.status === 200 || resetRes.status === 201, 'reset-seed on app1 must succeed');

      const initWalletRes = await fetch(`${url1}/wallet/driver_demo_4`);
      const initWallet = await initWalletRes.json();
      assert.strictEqual(Number(initWallet.wallet.currentBalance), 35, 'Initial balance must be 35 BDT');
      console.log(`   • Seed reset verified on Instance #1: driver_demo_4 = ৳${initWallet.wallet.currentBalance}`);

      // Execute 200 BDT bKash top-up via Tokenized Checkout
      const createRes = await fetch(`${url1}/payments/bkash/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: 'driver_demo_4', amountBdt: 200 }),
      });
      const created = await createRes.json();
      assert.strictEqual(created.success, true);

      const execRes = await fetch(`${url1}/payments/bkash/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentID: created.paymentID, status: 'success' }),
      });
      const execData = await execRes.json();
      assert.strictEqual(execData.payment.status, 'COMPLETED');
      assert.strictEqual(Number(execData.wallet.currentBalance), 235);
      persistedPaymentId = created.paymentID;
      persistedTrxId = execData.payment.trxID;
      console.log(
        `   • Executed ৳200 bKash Top-Up on Instance #1 (paymentID=${persistedPaymentId}, trxID=${persistedTrxId}): ৳35 -> ৳${execData.wallet.currentBalance}`,
      );

      // Approve kyc_4
      const kycApproveRes = await fetch(`${url1}/admin/kyc/kyc_4/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'APPROVED',
          note: 'পৌরসভা ওয়ার্ড কাউন্সিলর সনদ যাচাইকৃত (Persistence Test)',
        }),
      });
      const kycApproveData = await kycApproveRes.json();
      assert.strictEqual(kycApproveData.success, true);
      assert.strictEqual(kycApproveData.application.status, 'APPROVED');
      console.log(`   • Approved kyc_4 (${kycApproveData.application.fullName}) on Instance #1`);
    } catch (err) {
      if (err && (err.code === 'EACCES' || (err.cause && err.cause.code === 'EACCES'))) {
        console.log('ℹ️  [SANDBOX LOOPBACK] Using NestJS DI controllers on Instance #1...');
        const { AdminController } = require('../dist/modules/admin/admin.controller');
        const { WalletController } = require('../dist/modules/wallet/wallet.controller');
        const { BkashService } = require('../dist/modules/payments/bkash.service');
        const adminCtrl1 = app1.get(AdminController);
        const walletCtrl1 = app1.get(WalletController);
        const bkashSvc1 = app1.get(BkashService);

        if (typeof adminCtrl1.resetSeed === 'function') {
          await adminCtrl1.resetSeed();
        } else if (typeof adminCtrl1.resetSeedState === 'function') {
          await adminCtrl1.resetSeedState();
        }
        assert.strictEqual(Number(walletCtrl1.getWallet('driver_demo_4').wallet.currentBalance), 35);
        const rec = await bkashSvc1.createPayment('driver_demo_4', 200);
        const execData = await bkashSvc1.executeCallback(rec.paymentID, 'success');
        assert.strictEqual(Number(execData.wallet.currentBalance), 235);
        persistedPaymentId = rec.paymentID;
        persistedTrxId = execData.payment.trxID;
        const kycRes = await adminCtrl1.updateKycStatus('kyc_4', {
          status: 'APPROVED',
          note: 'পৌরসভা ওয়ার্ড কাউন্সিলর সনদ যাচাইকৃত (Persistence Test)',
        });
        assert.strictEqual(kycRes.application.status, 'APPROVED');
      } else {
        throw err;
      }
    }
  } finally {
    console.log('\nSTEP 2: Shutting down Instance #1 completely (await app1.close())...');
    await app1.close();
    console.log('✅ Instance #1 stopped and closed.');
  }

  // ---------------------------------------------------------------------------
  // INSTANCE #2: Boot fresh AppModule, verify 235 BDT & kyc_4 === APPROVED, then resetSeedState()
  // ---------------------------------------------------------------------------
  console.log('\nSTEP 3: Booting brand-new NestJS AppModule Instance #2 from scratch...');
  const app2 = await NestFactory.create(AppModule, { logger: ['warn', 'error'] });
  app2.enableCors({ origin: '*' });
  await app2.listen(PORT_2, '127.0.0.1');
  const url2 = `http://127.0.0.1:${PORT_2}`;
  console.log(`✅ Instance #2 listening on ${url2}`);

  try {
    try {
      const walletRes2 = await fetch(`${url2}/wallet/driver_demo_4`);
      const walletData2 = await walletRes2.json();
      assert.strictEqual(
        Number(walletData2.wallet.currentBalance),
        235,
        `Expected driver_demo_4 balance to persist at 235 BDT across restart, got ${walletData2.wallet.currentBalance}`,
      );
      console.log(
        `✅ [PERSISTENCE VERIFIED] Instance #2 GET /wallet/driver_demo_4 balance = ৳${walletData2.wallet.currentBalance} (survived full server restart!)`,
      );

      const kycRes2 = await fetch(`${url2}/admin/kyc`);
      const kycData2 = await kycRes2.json();
      const kyc4 = kycData2.applications.find((a) => a.id === 'kyc_4');
      assert.ok(kyc4, 'kyc_4 must exist in GET /admin/kyc');
      assert.strictEqual(
        kyc4.status,
        'APPROVED',
        `Expected kyc_4 status to persist as APPROVED across restart, got ${kyc4.status}`,
      );
      console.log(
        `✅ [PERSISTENCE VERIFIED] Instance #2 GET /admin/kyc -> kyc_4 (${kyc4.fullName}) status = "${kyc4.status}" (survived full server restart!)`,
      );

      if (persistedPaymentId) {
        const payRes2 = await fetch(`${url2}/payments/bkash/status/${encodeURIComponent(persistedPaymentId)}`);
        assert.strictEqual(payRes2.status, 200, 'Persisted bKash payment must be found after restart');
        const payData2 = await payRes2.json();
        assert.strictEqual(payData2.payment.status, 'COMPLETED');
        assert.strictEqual(payData2.payment.trxID, persistedTrxId);
        console.log(
          `✅ [PERSISTENCE VERIFIED] Instance #2 GET /payments/bkash/status/${persistedPaymentId} -> status="${payData2.payment.status}", trxID="${payData2.payment.trxID}" (survived full server restart!)`,
        );
      }

      // Clean up seed state at the end
      console.log('\nSTEP 4: Calling resetSeedState() so workspace is left in a clean state...');
      const finalResetRes = await fetch(`${url2}/admin/reset-seed`, { method: 'POST' });
      assert.ok(finalResetRes.status === 200 || finalResetRes.status === 201);
      const cleanWalletRes = await fetch(`${url2}/wallet/driver_demo_4`);
      const cleanWallet = await cleanWalletRes.json();
      assert.strictEqual(Number(cleanWallet.wallet.currentBalance), 35);
      console.log(`✅ Clean seed state restored (driver_demo_4 = ৳${cleanWallet.wallet.currentBalance}).`);
    } catch (err) {
      if (err && (err.code === 'EACCES' || (err.cause && err.cause.code === 'EACCES'))) {
        console.log('ℹ️  [SANDBOX LOOPBACK] Using NestJS DI controllers on Instance #2...');
        const { AdminController } = require('../dist/modules/admin/admin.controller');
        const { WalletController } = require('../dist/modules/wallet/wallet.controller');
        const { PrismaService } = require('../dist/prisma/prisma.service');
        const adminCtrl2 = app2.get(AdminController);
        const walletCtrl2 = app2.get(WalletController);
        const prismaSvc2 = app2.get(PrismaService);

        const walletData2 = walletCtrl2.getWallet('driver_demo_4');
        assert.strictEqual(Number(walletData2.wallet.currentBalance), 235);
        console.log(
          `✅ [PERSISTENCE VERIFIED] Instance #2 driver_demo_4 balance = ৳${walletData2.wallet.currentBalance}`,
        );

        const kycData2 = adminCtrl2.getKycApplications();
        const kyc4 = kycData2.applications.find((a) => a.id === 'kyc_4');
        assert.strictEqual(kyc4.status, 'APPROVED');
        console.log(`✅ [PERSISTENCE VERIFIED] Instance #2 kyc_4 status = "${kyc4.status}"`);

        if (persistedPaymentId) {
          const { BkashService } = require('../dist/modules/payments/bkash.service');
          const bkashSvc2 = app2.get(BkashService);
          const payData2 = bkashSvc2.getPaymentStatus(persistedPaymentId);
          assert.strictEqual(payData2.payment.status, 'COMPLETED');
          assert.strictEqual(payData2.payment.trxID, persistedTrxId);
          console.log(
            `✅ [PERSISTENCE VERIFIED] Instance #2 bKash payment ${persistedPaymentId} status="${payData2.payment.status}", trxID="${payData2.payment.trxID}"`,
          );
        }

        if (typeof adminCtrl2.resetSeed === 'function') {
          await adminCtrl2.resetSeed();
        } else if (typeof prismaSvc2.resetSeedState === 'function') {
          await prismaSvc2.resetSeedState();
        }
        console.log('✅ Clean seed state restored.');
      } else {
        throw err;
      }
    }
  } finally {
    await app2.close();
  }

  console.log('\n======================================================================');
  console.log('✅ ALL SERVER RESTART & DURABLE PERSISTENCE CHECKS PASSED!');
  console.log('======================================================================\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Persistence Verification Failed:', err);
  process.exit(1);
});
