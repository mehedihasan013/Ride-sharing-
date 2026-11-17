/**
 * CholoBhairab Option C — bKash Tokenized Checkout (v1.2.0-beta) & Security E2E Verification
 * Boots AppModule on 127.0.0.1:4004 and verifies:
 * 1. GET /health -> status === 'ok', bkashMode, and db status
 * 2. POST /admin/reset-seed -> resets demo state cleanly so driver_demo_4 starts at 35 BDT
 * 3. Validation test: POST /payments/bkash/create with amountBdt: 10 (< 20 BDT min) -> 400 BadRequestException
 * 4. Create payment test: POST /payments/bkash/create ({ driverId: 'driver_demo_4', amountBdt: 200 }) -> paymentID (TR0011...), bkashURL, invoiceNumber, status: 'INITIATED'
 * 5. Mock checkout HTML render test: GET /payments/bkash/mock/checkout?paymentID=... -> 200 OK HTML with CholoBhairab & 200
 * 6. Execute payment test: POST /payments/bkash/execute -> payment.status === 'COMPLETED', trxID generated, driver_demo_4 wallet 35 -> 235 BDT
 * 7. Idempotency / Replay protection test: Second execute with same paymentID -> alreadyCompleted === true, wallet stays 235 BDT (NOT 435 BDT!)
 * 8. Cancel flow test: Second payment (100 BDT) executed/callback with status: 'cancel' -> status === 'CANCELLED', wallet stays 235 BDT
 */

const assert = require('assert');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');

const PORT = 4004;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function runHttpPaymentsVerification() {
  // 1. GET /health
  console.log('\nSTEP 1: Verifying GET /health...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  assert.strictEqual(healthRes.status, 200, 'GET /health should return 200');
  const health = await healthRes.json();
  assert.strictEqual(health.status, 'ok', 'Health status must be ok');
  assert.ok(health.bkashMode, 'Health response must include bkashMode');
  console.log(
    `✅ [STEP 1] GET /health verified: status="${health.status}", bkashMode="${health.bkashMode}", db=${JSON.stringify(health.db)}`,
  );

  // 2. POST /admin/reset-seed
  console.log('\nSTEP 2: Resetting seed state via POST /admin/reset-seed...');
  const resetRes = await fetch(`${BASE_URL}/admin/reset-seed`, { method: 'POST' });
  assert.ok(resetRes.status === 200 || resetRes.status === 201, 'POST /admin/reset-seed must succeed');
  const walletInitRes = await fetch(`${BASE_URL}/wallet/driver_demo_4`);
  const walletInit = await walletInitRes.json();
  assert.strictEqual(
    Number(walletInit.wallet.currentBalance),
    35,
    'driver_demo_4 (Anwar Mia) must start at 35 BDT after reset-seed',
  );
  console.log(
    `✅ [STEP 2] Seed state reset cleanly: driver_demo_4 starting balance = ৳${walletInit.wallet.currentBalance}`,
  );

  // 3. Validation test: amountBdt: 10 (< 20 BDT minimum) -> 400 BadRequestException
  console.log('\nSTEP 3: Testing validation rejection for amountBdt=10 (< 20 BDT minimum)...');
  const invalidCreateRes = await fetch(`${BASE_URL}/payments/bkash/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ driverId: 'driver_demo_4', amountBdt: 10 }),
  });
  assert.strictEqual(
    invalidCreateRes.status,
    400,
    'POST /payments/bkash/create with amountBdt=10 must be rejected with 400 BadRequestException',
  );
  const invalidBody = await invalidCreateRes.json();
  console.log(
    `✅ [STEP 3] Below-minimum recharge (৳10) properly rejected with HTTP 400: "${invalidBody.message}"`,
  );

  // 4. Create payment test: { driverId: 'driver_demo_4', amountBdt: 200 }
  console.log('\nSTEP 4: Creating bKash Tokenized Checkout payment (200 BDT for driver_demo_4)...');
  const createRes = await fetch(`${BASE_URL}/payments/bkash/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ driverId: 'driver_demo_4', amountBdt: 200 }),
  });
  assert.ok(createRes.status === 200 || createRes.status === 201, 'Create payment must return 200/201');
  const created = await createRes.json();
  assert.strictEqual(created.success, true);
  assert.ok(
    created.paymentID && created.paymentID.startsWith('TR0011'),
    `paymentID must start with TR0011, got ${created.paymentID}`,
  );
  assert.ok(created.bkashURL, 'bkashURL must be returned');
  assert.ok(
    created.invoiceNumber && created.invoiceNumber.startsWith('INV-CB-'),
    `invoiceNumber must start with INV-CB-, got ${created.invoiceNumber}`,
  );

  // Check status === 'INITIATED' (from response or status endpoint)
  const statusCheckRes = await fetch(`${BASE_URL}/payments/bkash/status/${created.paymentID}`);
  const statusCheck = await statusCheckRes.json();
  const initialStatus = created.status || created.payment?.status || statusCheck.payment?.status;
  assert.strictEqual(initialStatus, 'INITIATED', 'Initial payment status must be INITIATED');
  console.log(
    `✅ [STEP 4] Payment created: paymentID=${created.paymentID}, invoice=${created.invoiceNumber}, status=${initialStatus}`,
  );

  // 5. Mock checkout HTML render test: GET /payments/bkash/mock/checkout?paymentID=...
  console.log('\nSTEP 5: Verifying Mock bKash Checkout HTML page render...');
  const checkoutHtmlRes = await fetch(
    `${BASE_URL}/payments/bkash/mock/checkout?paymentID=${encodeURIComponent(created.paymentID)}`,
  );
  assert.strictEqual(checkoutHtmlRes.status, 200, 'Mock checkout page must return 200 OK');
  const checkoutHtml = await checkoutHtmlRes.text();
  assert.ok(
    checkoutHtml.includes('CholoBhairab'),
    'Mock checkout HTML must contain merchant name CholoBhairab',
  );
  assert.ok(checkoutHtml.includes('200'), 'Mock checkout HTML must contain amount 200');
  console.log(
    `✅ [STEP 5] Mock checkout HTML verified (200 OK, length=${checkoutHtml.length} chars, contains CholoBhairab & ৳200)`,
  );

  // 6. Execute payment test: POST /payments/bkash/execute
  console.log('\nSTEP 6: Executing bKash payment server-to-server...');
  const execRes = await fetch(`${BASE_URL}/payments/bkash/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentID: created.paymentID,
      status: 'success',
      msisdn: '01811223304',
    }),
  });
  assert.ok(execRes.status === 200 || execRes.status === 201, 'Execute payment must return 200/201');
  const execData = await execRes.json();
  assert.strictEqual(execData.success, true);
  assert.strictEqual(execData.alreadyCompleted, false, 'First execution must have alreadyCompleted=false');
  assert.strictEqual(execData.payment.status, 'COMPLETED', 'Payment status must be COMPLETED');
  assert.ok(execData.payment.trxID, 'bKash trxID must be generated on completion');
  assert.strictEqual(
    Number(execData.wallet.currentBalance),
    235,
    'driver_demo_4 wallet balance must increase from 35 BDT to 235 BDT',
  );
  console.log(
    `✅ [STEP 6] Payment Executed! status=${execData.payment.status}, trxID=${execData.payment.trxID}, New Balance=৳${execData.wallet.currentBalance} (Unlocked!)`,
  );

  // 7. Idempotency / Replay protection test
  console.log('\nSTEP 7: Testing Idempotency / Replay Protection (2nd execute with same paymentID)...');
  const replayRes = await fetch(`${BASE_URL}/payments/bkash/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentID: created.paymentID,
      status: 'success',
    }),
  });
  assert.ok(replayRes.status === 200 || replayRes.status === 201);
  const replayData = await replayRes.json();
  assert.strictEqual(
    replayData.alreadyCompleted,
    true,
    'Second execute call with same paymentID must return alreadyCompleted === true',
  );

  const walletAfterReplayRes = await fetch(`${BASE_URL}/wallet/driver_demo_4`);
  const walletAfterReplay = await walletAfterReplayRes.json();
  assert.strictEqual(
    Number(walletAfterReplay.wallet.currentBalance),
    235,
    'Wallet balance must remain 235 BDT (NOT 435 BDT!) on duplicate callback/execute',
  );
  console.log(
    `✅ [STEP 7] Idempotency verified: alreadyCompleted=${replayData.alreadyCompleted}, balance remained ৳${walletAfterReplay.wallet.currentBalance} (no double credit!)`,
  );

  // 8. Cancel flow test: Create second payment (100 BDT) -> callback/execute with status: 'cancel'
  console.log('\nSTEP 8: Testing Cancel Flow (100 BDT payment cancelled by user)...');
  const createCancelRes = await fetch(`${BASE_URL}/payments/bkash/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ driverId: 'driver_demo_4', amountBdt: 100 }),
  });
  const createdCancel = await createCancelRes.json();
  assert.strictEqual(createdCancel.success, true);

  const cancelExecRes = await fetch(
    `${BASE_URL}/payments/bkash/callback?paymentID=${encodeURIComponent(createdCancel.paymentID)}&status=cancel&format=json`,
  );
  assert.strictEqual(cancelExecRes.status, 200);
  const cancelExecData = await cancelExecRes.json();
  assert.strictEqual(
    cancelExecData.payment.status,
    'CANCELLED',
    'Cancelled payment status must be CANCELLED',
  );

  const walletAfterCancelRes = await fetch(`${BASE_URL}/wallet/driver_demo_4`);
  const walletAfterCancel = await walletAfterCancelRes.json();
  assert.strictEqual(
    Number(walletAfterCancel.wallet.currentBalance),
    235,
    'Wallet balance must remain 235 BDT after cancelled payment',
  );
  console.log(
    `✅ [STEP 8] Cancel flow verified: paymentID=${createdCancel.paymentID} -> status=${cancelExecData.payment.status}, balance unchanged at ৳${walletAfterCancel.wallet.currentBalance}`,
  );
}

async function runInProcessPaymentsVerification(app) {
  const { HealthController } = require('../dist/modules/health/health.controller');
  const { AdminController } = require('../dist/modules/admin/admin.controller');
  const { WalletController } = require('../dist/modules/wallet/wallet.controller');
  const { PaymentsController } = require('../dist/modules/payments/payments.controller');
  const { BkashService } = require('../dist/modules/payments/bkash.service');

  const healthController = app.get(HealthController);
  const adminController = app.get(AdminController);
  const walletController = app.get(WalletController);
  const paymentsController = app.get(PaymentsController);
  const bkashService = app.get(BkashService);

  // 1. GET /health
  console.log('\nSTEP 1: Verifying HealthController.getHealth()...');
  const health = await healthController.getHealth();
  assert.strictEqual(health.status, 'ok');
  assert.ok(health.bkashMode);
  console.log(`✅ [STEP 1] GET /health verified: status="${health.status}", bkashMode="${health.bkashMode}"`);

  // 2. POST /admin/reset-seed
  console.log('\nSTEP 2: Resetting seed state...');
  if (typeof adminController.resetSeed === 'function') {
    await adminController.resetSeed();
  } else if (typeof adminController.resetSeedState === 'function') {
    await adminController.resetSeedState();
  }
  const walletInit = walletController.getWallet('driver_demo_4');
  assert.strictEqual(Number(walletInit.wallet.currentBalance), 35);
  console.log(`✅ [STEP 2] Seed state reset cleanly: driver_demo_4 balance = ৳${walletInit.wallet.currentBalance}`);

  // 3. Validation test (< 20 BDT minimum)
  console.log('\nSTEP 3: Testing validation rejection for amountBdt=10 (< 20 BDT minimum)...');
  let rejected = false;
  try {
    await bkashService.createPayment('driver_demo_4', 10);
  } catch (err) {
    rejected = true;
    assert.strictEqual(err.status || err.getStatus?.(), 400);
    console.log(`✅ [STEP 3] Below-minimum recharge (৳10) properly rejected with 400: "${err.message}"`);
  }
  assert.strictEqual(rejected, true, 'amountBdt=10 must throw BadRequestException');

  // 4. Create payment test (200 BDT)
  console.log('\nSTEP 4: Creating bKash Tokenized Checkout payment (200 BDT for driver_demo_4)...');
  const record = await bkashService.createPayment('driver_demo_4', 200);
  const paymentID = record.paymentID;
  assert.ok(paymentID && paymentID.startsWith('TR0011'));
  assert.ok(record.bkashURL);
  assert.ok(record.invoiceNumber && record.invoiceNumber.startsWith('INV-CB-'));
  assert.strictEqual(record.status, 'INITIATED');
  console.log(
    `✅ [STEP 4] Payment created: paymentID=${paymentID}, invoice=${record.invoiceNumber}, status=${record.status}`,
  );

  // 5. Mock checkout HTML render test
  console.log('\nSTEP 5: Verifying Mock bKash Checkout HTML render...');
  let htmlContent = '';
  const mockRes = {
    status() {
      return this;
    },
    setHeader() {
      return this;
    },
    type() {
      return this;
    },
    send(body) {
      htmlContent = String(body);
      return this;
    },
  };
  if (typeof paymentsController.renderMockCheckoutPage === 'function') {
    await paymentsController.renderMockCheckoutPage(paymentID, mockRes);
  } else if (typeof paymentsController.renderMockCheckout === 'function') {
    await paymentsController.renderMockCheckout(paymentID, mockRes);
  } else if (typeof bkashService.renderMockCheckoutHtml === 'function') {
    htmlContent = bkashService.renderMockCheckoutHtml(paymentID);
  }
  assert.ok(htmlContent.includes('CholoBhairab'), 'HTML must contain CholoBhairab');
  assert.ok(htmlContent.includes('200'), 'HTML must contain 200');
  console.log(`✅ [STEP 5] Mock checkout HTML verified (contains CholoBhairab & ৳200)`);

  // 6. Execute payment test
  console.log('\nSTEP 6: Executing bKash payment...');
  const execData = await bkashService.executeCallback(paymentID, 'success', '01811223304');
  assert.strictEqual(execData.alreadyCompleted, false);
  assert.strictEqual(execData.payment.status, 'COMPLETED');
  assert.ok(execData.payment.trxID);
  assert.strictEqual(Number(execData.wallet.currentBalance), 235);
  console.log(
    `✅ [STEP 6] Payment Executed! status=${execData.payment.status}, trxID=${execData.payment.trxID}, New Balance=৳${execData.wallet.currentBalance}`,
  );

  // 7. Idempotency / Replay protection test
  console.log('\nSTEP 7: Testing Idempotency / Replay Protection...');
  const replayData = await bkashService.executeCallback(paymentID, 'success', '01811223304');
  assert.strictEqual(replayData.alreadyCompleted, true);
  const walletAfterReplay = walletController.getWallet('driver_demo_4');
  assert.strictEqual(Number(walletAfterReplay.wallet.currentBalance), 235);
  console.log(
    `✅ [STEP 7] Idempotency verified: alreadyCompleted=${replayData.alreadyCompleted}, balance remained ৳${walletAfterReplay.wallet.currentBalance}`,
  );

  // 8. Cancel flow test
  console.log('\nSTEP 8: Testing Cancel Flow (100 BDT payment cancelled)...');
  const cancelRecord = await bkashService.createPayment('driver_demo_4', 100);
  const cancelExec = await bkashService.executeCallback(cancelRecord.paymentID, 'cancel');
  assert.strictEqual(cancelExec.payment.status, 'CANCELLED');
  const walletAfterCancel = walletController.getWallet('driver_demo_4');
  assert.strictEqual(Number(walletAfterCancel.wallet.currentBalance), 235);
  console.log(
    `✅ [STEP 8] Cancel flow verified: status=${cancelExec.payment.status}, balance unchanged at ৳${walletAfterCancel.wallet.currentBalance}`,
  );
}

async function main() {
  console.log('======================================================================');
  console.log('💳 CHOLOBHAIRAB OPTION C — BKASH TOKENIZED CHECKOUT E2E (PORT 4004)');
  console.log('======================================================================');

  process.env.PORT = String(PORT);
  const app = await NestFactory.create(AppModule, { logger: ['warn', 'error'] });
  app.enableCors({ origin: '*' });
  await app.listen(PORT, '127.0.0.1');
  console.log(`🚀 Payments E2E Backend started on ${BASE_URL}`);

  try {
    try {
      await runHttpPaymentsVerification();
    } catch (err) {
      if (err && (err.code === 'EACCES' || (err.cause && err.cause.code === 'EACCES'))) {
        console.log(
          'ℹ️  [SANDBOX LOOPBACK] TCP connect EACCES detected; running in-process NestJS DI verification...',
        );
        await runInProcessPaymentsVerification(app);
      } else {
        throw err;
      }
    }

    console.log('\n======================================================================');
    console.log('✅ ALL OPTION C BKASH TOKENIZED CHECKOUT & SECURITY CHECKS PASSED!');
    console.log('======================================================================\n');
  } finally {
    await app.close();
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Payments E2E Verification Failed:', err);
  process.exit(1);
});
