const assert = require('assert');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { io } = require('socket.io-client');

async function main() {
  console.log('======================================================================');
  console.log('🛡️ CHOLOBHAIRAB ADMIN & TELEMETRY E2E VERIFICATION (PORT 4002)');
  console.log('======================================================================\n');

  process.env.PORT = '4002';
  const app = await NestFactory.create(AppModule, { logger: ['warn', 'error'] });
  app.enableCors({ origin: '*' });
  await app.listen(4002, '127.0.0.1');
  const SERVER_URL = 'http://127.0.0.1:4002';
  console.log(`🚀 Admin Test Backend started on ${SERVER_URL}`);

  const receivedAdminEvents = [];
  let snapshotData = null;

  // 1. Connect Admin WebSocket & subscribe to 'admin:dashboard'
  console.log('\nSTEP 1: Connecting Admin WebSocket & subscribing to admin:dashboard...');
  const adminSocket = io(SERVER_URL, { transports: ['websocket'] });

  await new Promise((resolve) => adminSocket.on('connect', resolve));
  console.log(`✅ Admin Socket connected (ID: ${adminSocket.id})`);

  adminSocket.on('admin:event', (evt) => {
    receivedAdminEvents.push(evt);
    console.log(
      `   📡 [WS admin:event] ${evt.type} -> ${evt.payload?.messageBangla || JSON.stringify(evt.payload).slice(0, 80)}`,
    );
  });

  const snapshotPromise = new Promise((resolve) => {
    adminSocket.once('admin:snapshot', (data) => {
      snapshotData = data;
      resolve(data);
    });
  });

  adminSocket.emit('admin:subscribe');
  await snapshotPromise;
  assert(snapshotData, 'Should receive admin:snapshot');
  assert.strictEqual(snapshotData.onlineDrivers.length, 6, 'Should have 6 pre-seeded online drivers');
  console.log(
    `✅ Received admin:snapshot: ${snapshotData.onlineDrivers.length} online drivers, ${snapshotData.activeRides.length} rides`,
  );

  // 2. Test GET /admin/overview
  console.log('\nSTEP 2: Testing GET /admin/overview...');
  const overviewRes = await fetch(`${SERVER_URL}/admin/overview`);
  const overview = await overviewRes.json();
  assert.strictEqual(overview.success, true);
  assert.strictEqual(overview.stats.onlineDriversCount, 6);
  assert.strictEqual(overview.stats.lowBalanceDriversCount, 1);
  assert.strictEqual(overview.stats.pendingKycCount, 3);
  assert.strictEqual(overview.wallets.length, 6);
  assert.strictEqual(overview.landmarks.length, 6);
  console.log(
    `✅ Overview verified: Online=${overview.stats.onlineDriversCount}, ActiveRides=${overview.stats.activeRidesCount}, Completed=${overview.stats.completedRidesCount}, Commission=${overview.stats.totalCommissionBdt} BDT, LowBalance=${overview.stats.lowBalanceDriversCount}`,
  );

  // 3. Test GET /admin/kyc & POST /admin/kyc/:id/status
  console.log('\nSTEP 3: Testing GET /admin/kyc & POST /admin/kyc/kyc_3/status...');
  const kycRes = await fetch(`${SERVER_URL}/admin/kyc`);
  const kycData = await kycRes.json();
  assert.strictEqual(kycData.success, true);
  assert.strictEqual(kycData.applications.length, 6);

  const approveRes = await fetch(`${SERVER_URL}/admin/kyc/kyc_3/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'APPROVED', note: 'বিআরটিএ লাইসেন্স যাচাই সম্পন্ন' }),
  });
  const approveData = await approveRes.json();
  assert.strictEqual(approveData.success, true);
  assert.strictEqual(approveData.application.status, 'APPROVED');
  console.log(`✅ Approved KYC for ${approveData.application.fullName}`);

  // 4. Test POST /admin/wallet/topup (Unlock low-balance driver_demo_4 who has 35 BDT)
  console.log('\nSTEP 4: Testing POST /admin/wallet/topup for low-balance driver_demo_4...');
  const topupRes = await fetch(`${SERVER_URL}/admin/wallet/topup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      driverId: 'driver_demo_4',
      amountBdt: 100,
      method: 'BKASH',
      trxId: 'BKH_TEST_100',
    }),
  });
  const topupData = await topupRes.json();
  assert.strictEqual(topupData.success, true);
  assert.strictEqual(topupData.wallet.currentBalance, 135);
  console.log(
    `✅ Topped up driver_demo_4 via bKash (+100 BDT) -> New Balance: ${topupData.wallet.currentBalance} BDT (Unlocked!)`,
  );

  // 5. Test POST /admin/rides/demo/sos
  console.log('\nSTEP 5: Testing POST /admin/rides/demo/sos (999 Emergency SOS)...');
  const sosRes = await fetch(`${SERVER_URL}/admin/rides/demo/sos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resolved: false }),
  });
  const sosData = await sosRes.json();
  assert.strictEqual(sosData.success, true);
  assert.strictEqual(sosData.ride.sosActive, true);
  console.log(`✅ SOS Alert triggered on ride ${sosData.ride.id} (sosActive=${sosData.ride.sosActive})`);

  // Resolve SOS
  const sosResolveRes = await fetch(`${SERVER_URL}/admin/rides/${sosData.ride.id}/sos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resolved: true }),
  });
  const sosResolveData = await sosResolveRes.json();
  assert.strictEqual(sosResolveData.ride.sosActive, false);
  console.log(`✅ SOS Alert resolved on ride ${sosResolveData.ride.id}`);

  // 6. Test POST /admin/simulate-ride (4-second automated Bhairab InDrive bidding & completion)
  console.log('\nSTEP 6: Testing POST /admin/simulate-ride (4s live lifecycle)...');
  const rideCompletedPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out waiting for RIDE_COMPLETED')), 7000);
    adminSocket.on('admin:event', (evt) => {
      if (evt.type === 'RIDE_COMPLETED') {
        clearTimeout(timer);
        resolve(evt);
      }
    });
  });

  const simRes = await fetch(`${SERVER_URL}/admin/simulate-ride`, {
    method: 'POST',
  });
  const simData = await simRes.json();
  assert.strictEqual(simData.success, true);
  console.log(`✅ Simulation started for ride ${simData.ride.id}: "${simData.messageBangla}"`);

  // Wait for RIDE_COMPLETED event
  await rideCompletedPromise;

  const eventTypes = receivedAdminEvents.map((e) => e.type);
  console.log(`\n📊 Total WebSocket admin:event messages received: ${receivedAdminEvents.length}`);
  console.log(`   Event sequence: ${eventTypes.join(' -> ')}`);

  assert(eventTypes.includes('KYC_UPDATED'), 'Should emit KYC_UPDATED');
  assert(eventTypes.includes('WALLET_TOPUP'), 'Should emit WALLET_TOPUP');
  assert(eventTypes.includes('SOS_ALERT'), 'Should emit SOS_ALERT');
  assert(eventTypes.includes('RIDE_REQUESTED'), 'Should emit RIDE_REQUESTED');
  assert(eventTypes.includes('NEW_BID'), 'Should emit NEW_BID');
  assert(eventTypes.includes('BID_ACCEPTED'), 'Should emit BID_ACCEPTED');
  assert(eventTypes.includes('RIDE_COMPLETED'), 'Should emit RIDE_COMPLETED');

  // Verify final overview metrics updated after simulation
  const finalOverviewRes = await fetch(`${SERVER_URL}/admin/overview`);
  const finalOverview = await finalOverviewRes.json();
  assert(
    finalOverview.stats.completedRidesCount >= 2,
    'Completed rides count should increment after simulation',
  );
  assert(
    finalOverview.stats.totalCommissionBdt > overview.stats.totalCommissionBdt,
    'Total 8% commission revenue should increase after simulation',
  );
  console.log(
    `✅ Final Overview verified: CompletedRides=${finalOverview.stats.completedRidesCount}, TotalCommission=${finalOverview.stats.totalCommissionBdt} BDT, TotalGMV=${finalOverview.stats.totalGmvBdt} BDT`,
  );

  console.log('\n======================================================================');
  console.log('✅ ALL ADMIN BACKEND & WEBSOCKET TELEMETRY CHECKS PASSED!');
  console.log('======================================================================\n');

  adminSocket.disconnect();
  await app.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Admin E2E Verification Failed:', err);
  process.exit(1);
});
