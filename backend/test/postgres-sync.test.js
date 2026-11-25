// The Supabase mirror: drivers and passengers are created first, so wallets, KYC and rides are no
// longer skipped. A fake client enforces the real schema's unique keys and foreign keys.
// Runs against the compiled output: `npm test` builds first.
const { test } = require('node:test');
const assert = require('node:assert');
const { PrismaService } = require('../dist/prisma/prisma.service');

function fakeDb() {
  const tables = { user: [], driver: [], driverWallet: [], walletTransaction: [], driverKycApplication: [], ride: [], bkashPayment: [], sosEvent: [] };
  const unique = { user: ['id', 'phoneNumber'], driver: ['id', 'userId', 'nidNumber'], driverWallet: ['id', 'driverId'], driverKycApplication: ['id', 'driverId'], bkashPayment: ['paymentId'] };
  const links = {
    driver: [['userId', 'user']],
    driverWallet: [['driverId', 'driver']],
    walletTransaction: [['walletId', 'driverWallet']],
    driverKycApplication: [['driverId', 'driver']],
    ride: [['passengerId', 'user'], ['driverId', 'driver']],
    bkashPayment: [['driverId', 'driver']],
    sosEvent: [['rideId', 'ride']],
  };
  const find = (name, where) => tables[name].find((row) => Object.entries(where).every(([k, v]) => row[k] === v)) || null;
  const insert = (name, data) => {
    for (const key of unique[name] || ['id']) {
      if (data[key] !== undefined && find(name, { [key]: data[key] })) throw new Error(`unique ${name}.${key}`);
    }
    for (const [key, target] of links[name] || []) {
      if (data[key] != null && !find(target, { id: data[key] })) throw new Error(`foreign key ${name}.${key}`);
    }
    const row = { ...data };
    tables[name].push(row);
    return row;
  };
  const client = { tables };
  for (const name of Object.keys(tables)) {
    client[name] = {
      findUnique: async ({ where }) => find(name, where),
      create: async ({ data }) => insert(name, data),
      upsert: async ({ where, update, create }) => {
        const row = find(name, where);
        return row ? Object.assign(row, update) : insert(name, create);
      },
      updateMany: async ({ where, data }) => {
        for (const row of tables[name]) {
          const ok = Object.entries(where).every(([k, v]) => (typeof v === 'object' ?String(row[k]).startsWith(v.startsWith) : row[k] === v));
          if (ok) Object.assign(row, data);
        }
      },
    };
  }
  return client;
}

function connectedService(state) {
  const svc = new PrismaService();
  svc.state = { ...svc.createEmptyState(), ...state };
  svc.pgClient = fakeDb();
  svc.isPostgresConnected = true;
  return svc;
}

const wallet = { driverId: 'driver_demo_1', driverName: 'Rafiq', driverPhone: '01811223301', currentBalance: 193 };
const kyc = {
  id: 'kyc_1', driverId: 'driver_demo_1', fullName: 'Rafiq', phoneNumber: '01811223301', nidNumber: '19884811120001',
  vehicleType: 'EASYBIKE', vehicleModel: 'Easybike', registrationNumber: 'R-1', brtaLicenseNo: 'B-1',
  unionCouncilorCert: 'C-1', wardNo: '4', status: 'APPROVED', submittedAt: '2026-11-20T00:00:00.000Z',
};
const ride = {
  id: 'ride_1', passengerId: 'passenger_demo_1', passengerName: 'Karim', passengerPhone: '01700000001',
  selectedDriverId: 'driver_demo_2', bids: [{ driverId: 'driver_demo_2', driverName: 'Kamal', driverPhone: '01711223302' }],
  vehicleType: 'EASYBIKE', pickupLat: 24.05, pickupLng: 90.98, pickupAddress: 'A', dropoffLat: 24.04, dropoffLng: 91,
  dropoffAddress: 'B', initialOfferFare: 80, status: 'ACCEPTED', liveTrackingToken: 'track_1',
};

test('full sync creates the driver and passenger rows the other tables point at', async () => {
  const svc = connectedService({
    users: [{ id: 'passenger_demo_1', phoneNumber: '01700000001', fullName: 'Karim', role: 'PASSENGER' }],
    wallets: [wallet],
    transactions: [{ id: 'tx_1', driverId: 'driver_demo_1', type: 'ADMIN_MANUAL_TOPUP', amount: 50, balanceAfter: 193, noteBangla: 'x' }],
    kycApplications: [kyc],
    rides: [ride],
    sosEvents: [{ id: 'sos_1', rideId: 'ride_1', resolved: false, createdAt: '2026-11-25T00:00:00.000Z' }],
  });
  await svc.syncAllToPostgres();
  const t = svc.pgClient.tables;

  assert.deepStrictEqual(t.driver.map((d) => d.id).sort(), ['driver_demo_1', 'driver_demo_2']);
  assert.strictEqual(t.driverWallet.length, 1);
  assert.strictEqual(t.walletTransaction[0].type, 'BONUS');
  assert.strictEqual(t.driverKycApplication[0].status, 'APPROVED');
  // The wallet created the driver with a placeholder NID; the KYC sync replaced it.
  assert.strictEqual(t.driver.find((d) => d.id === 'driver_demo_1').nidNumber, '19884811120001');
  assert.strictEqual(t.ride[0].passengerId, 'passenger_demo_1');
  assert.strictEqual(t.ride[0].driverId, 'driver_demo_2');
  assert.strictEqual(t.sosEvent.length, 1);
});

test('a second sync updates rows instead of failing on duplicates', async () => {
  const svc = connectedService({ wallets: [wallet], rides: [ride] });
  await svc.syncAllToPostgres();
  await svc.syncRidesToPostgres([{ ...ride, status: 'COMPLETED', finalAgreedFare: 90 }]);
  const t = svc.pgClient.tables;
  assert.strictEqual(t.user.length, 3); // two drivers + one passenger
  assert.strictEqual(t.ride.length, 1);
  assert.strictEqual(t.ride[0].status, 'COMPLETED');
});

test('a passenger phone already saved under another id is reused, not duplicated', async () => {
  const svc = connectedService({
    users: [{ id: 'user_123', phoneNumber: '01700000001', fullName: 'Karim', role: 'PASSENGER' }],
    rides: [{ ...ride, selectedDriverId: undefined }],
  });
  await svc.syncAllToPostgres();
  assert.strictEqual(svc.pgClient.tables.ride[0].passengerId, 'user_123');
});

test('one bad row is skipped and the rest still sync', async () => {
  const svc = connectedService({
    wallets: [wallet, { ...wallet, driverId: 'driver_demo_3', driverPhone: '01711223303' }],
  });
  const create = svc.pgClient.driverWallet.upsert;
  svc.pgClient.driverWallet.upsert = async (args) => {
    if (args.where.driverId === 'driver_demo_1') throw new Error('boom');
    return create(args);
  };
  await svc.syncAllToPostgres();
  assert.deepStrictEqual(svc.pgClient.tables.driverWallet.map((w) => w.driverId), ['driver_demo_3']);
});

test('saves queue a sync only while Postgres is connected', async () => {
  const svc = connectedService({});
  svc.isPostgresConnected = false;
  let ran = false;
  svc.queueSync(async () => { ran = true; });
  await svc.syncQueue;
  assert.strictEqual(ran, false);
});
