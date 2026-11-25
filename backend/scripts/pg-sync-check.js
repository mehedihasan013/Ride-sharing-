// Runs the real Postgres mirror code against the real database inside one transaction, then rolls
// it back, so nothing is left behind. Usage: npm run build, then node scripts/pg-sync-check.js
const readline = require('node:readline/promises');

const ROLLBACK = new Error('rollback');
const now = new Date().toISOString();

// All ids and unique values start with "check", so they cannot collide with real rows.
const passenger = { id: 'check_passenger', phoneNumber: '00000000001', fullName: 'Check Passenger', role: 'PASSENGER' };
const wallet = { driverId: 'check_driver', driverName: 'Check Driver', driverPhone: '00000000002', currentBalance: 193.5, lastTopupAt: now };
const transactions = ['PROMOTIONAL_BONUS', 'BKASH_TOPUP', 'NAGAD_TOPUP', 'ADMIN_MANUAL_TOPUP', 'COMMISSION_DEDUCTION'].map((type) => ({
  id: `check_tx_${type}`, driverId: 'check_driver', type, amount: 10, balanceAfter: 193.5, noteBangla: 'পরীক্ষা', createdAt: now,
}));
const kyc = {
  id: 'check_kyc', driverId: 'check_driver', fullName: 'Check Driver', phoneNumber: '00000000002', nidNumber: 'check_nid',
  vehicleType: 'EASYBIKE', vehicleModel: 'Easybike', registrationNumber: 'R-1', brtaLicenseNo: 'B-1',
  unionCouncilorCert: 'C-1', wardNo: '4', status: 'APPROVED', submittedAt: now,
};
const ride = {
  id: 'check_ride', passengerId: 'check_passenger', selectedDriverId: 'check_driver', vehicleType: 'EASYBIKE',
  pickupLat: 24.05, pickupLng: 90.98, pickupAddress: 'ভৈরব', dropoffLat: 24.04, dropoffLng: 91, dropoffAddress: 'সেতু',
  initialOfferFare: 80, finalAgreedFare: 90, status: 'ARRIVING', liveTrackingToken: 'check_token',
};
const payment = {
  id: 'check_bkp', paymentID: 'check_payment', driverId: 'check_driver', amountBdt: 100,
  invoiceNumber: 'check_invoice', status: 'INITIATED', mode: 'MOCK', createdAt: now,
};
const sos = { id: 'check_sos', rideId: 'check_ride', resolved: false, createdAt: now };

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question('Paste the DIRECT_URL value (port 5432), then press Enter:\n');
  rl.close();
  const url = answer.trim().replace(/^DIRECT_URL=/, '').replace(/^"|"$/g, '');
  if (!/^postgres(ql)?:\/\//.test(url)) throw new Error('That does not start with postgresql://');
  process.env.DATABASE_URL = url;
  process.env.DIRECT_URL = url;

  const { PrismaClient } = require('@prisma/client');
  const { PrismaService } = require('../dist/prisma/prisma.service');
  // Prisma gives up after 5s by default, too short for a far-away region on a slow line.
  const slowUrl = `${url}${url.includes('?') ? '&' : '?'}connect_timeout=30`;
  const db = new PrismaClient({ datasources: { db: { url: slowUrl } } });
  const problems = [];

  try {
    await db.$transaction(async (tx) => {
      const svc = new PrismaService();
      svc.state = {
        users: [passenger], wallets: [wallet], transactions, kycApplications: [kyc],
        rides: [ride], bkashPayments: [payment], sosEvents: [sos],
      };
      svc.pgClient = tx;
      svc.isPostgresConnected = true;
      svc.logger.warn = (message) => problems.push(message);

      await svc.syncAllToPostgres();
      // Second pass exercises the update paths.
      await svc.syncRidesToPostgres([{ ...ride, status: 'COMPLETED' }]);
      await svc.syncBkashPaymentToPostgres({ ...payment, status: 'COMPLETED', trxID: 'check_trx', completedAt: now });
      if (problems.length) throw ROLLBACK;

      const mine = { where: { id: { startsWith: 'check' } } };
      const expected = { user: 2, driver: 1, driverWallet: 1, walletTransaction: 5, driverKycApplication: 1, ride: 1, bkashPayment: 1, sosEvent: 1 };
      for (const [table, want] of Object.entries(expected)) {
        const args = table === 'driverWallet' ? { where: { driverId: 'check_driver' } } : mine;
        const got = await tx[table].count(args);
        console.log(`${got === want ? 'ok  ' : 'FAIL'} ${table}: ${got} row(s)`);
        if (got !== want) problems.push(`${table}: expected ${want}, got ${got}`);
      }
      const saved = await tx.ride.findUnique({ where: { id: 'check_ride' } });
      const driver = await tx.driver.findUnique({ where: { id: 'check_driver' } });
      if (saved.status !== 'COMPLETED') problems.push('ride status was not updated');
      if (driver.nidNumber !== 'check_nid') problems.push('placeholder NID was not replaced');
      throw ROLLBACK;
    }, { maxWait: 20000, timeout: 120000 });
  } catch (err) {
    if (err !== ROLLBACK) problems.push(err.message);
  } finally {
    await db.$disconnect();
  }

  // Only the first problem matters: after one failed statement Postgres rejects the rest.
  if (problems.length) {
    console.log(`\nFAIL: ${problems[0]}`);
    process.exitCode = 1;
  } else {
    console.log('\nPASS: every table accepted the data. Rolled back, nothing was saved.');
  }
}

main().catch((err) => {
  console.log(`FAIL: ${err.message}`);
  process.exitCode = 1;
});
