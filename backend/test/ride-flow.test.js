// Ride lifecycle (cancel / arrived / start) and the public tracking page.
// Runs against the compiled output: `npm test` builds first.
const { test } = require('node:test');
const assert = require('node:assert');
const { RidesService } = require('../dist/modules/rides/rides.service');
const { renderTrackingPage } = require('../dist/modules/rides/tracking-page');

process.env.SEED_DEMO = 'false'; // start with an empty fleet

function newService() {
  const prisma = {
    getRides: () => [],
    getOnlineDrivers: () => [],
    registerResetListener: () => {},
    saveRidesAndDrivers: () => {},
    recordSosEvent: () => {},
  };
  const wallet = { getWallet: () => ({ currentBalance: 193 }), deductCommission: async () => ({ balanceAfter: 185 }) };
  const geo = { calculateDistanceKm: () => 1 };
  return new RidesService(geo, wallet, prisma);
}

function rideWithDriver(svc) {
  svc.registerOnlineDriver({
    driverId: 'd1', socketId: 's', vehicleType: 'EASYBIKE', lat: 24.05, lng: 90.98,
    walletBalance: 193, rating: 4.9, driverName: 'Rafiq', driverPhone: '01811223301', vehicleModel: 'Easybike #12',
  });
  const ride = svc.createRideRequest({
    passengerId: 'p1', passengerName: 'Karim', passengerPhone: '01700000001', vehicleType: 'EASYBIKE',
    pickupLat: 24.05, pickupLng: 90.98, pickupAddress: 'Rail Junction',
    dropoffLat: 24.04, dropoffLng: 91.0, dropoffAddress: 'Meghna Bridge', initialOfferFare: 80,
  });
  const bid = svc.submitDriverBid({ rideId: ride.id, driverId: 'd1', bidAmount: 90, etaMinutes: 3 });
  return { ride, bid };
}

test('tracking token is long and random', () => {
  const svc = newService();
  const { ride } = rideWithDriver(svc);
  assert.match(ride.liveTrackingToken, /^track_[0-9a-f]{24}$/);
});

test('cancel works while searching and is refused after completion', async () => {
  const svc = newService();
  const { ride } = rideWithDriver(svc);
  assert.strictEqual(svc.cancelRide(ride.id).status, 'CANCELLED');

  const second = rideWithDriver(svc);
  svc.acceptBid(second.ride.id, second.bid.id);
  await svc.completeRide(second.ride.id);
  assert.throws(() => svc.cancelRide(second.ride.id), /no longer be cancelled/);
});

test('only the assigned driver can mark arrived and start the trip', () => {
  const svc = newService();
  const { ride, bid } = rideWithDriver(svc);
  svc.acceptBid(ride.id, bid.id);
  assert.throws(() => svc.markDriverArrived(ride.id, 'someone_else'), /Not your ride/);
  assert.strictEqual(svc.markDriverArrived(ride.id, 'd1').status, 'ARRIVING');
  assert.strictEqual(svc.startTrip(ride.id, 'd1').status, 'IN_PROGRESS');
  assert.throws(() => svc.markDriverArrived(ride.id, 'd1'), /not waiting/);
});

test('tracking page escapes names and never shows phone numbers', () => {
  const html = renderTrackingPage({
    status: 'ACCEPTED',
    driverName: '<script>alert(1)</script>',
    vehicleModel: 'Easybike "12"',
    pickupAddress: 'Rail & Junction',
    dropoffAddress: 'Meghna',
    fare: 90,
    driverPosition: { lat: 24.05, lng: 90.98 },
  });
  assert.ok(!html.includes('<script>'), 'raw script tag must not appear');
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('Rail &amp; Junction'));
  assert.ok(!/01\d{9}/.test(html), 'no phone numbers');
  assert.ok(html.includes('http-equiv="refresh"'));
});

test('ended trips stop refreshing and hide the driver position', () => {
  const html = renderTrackingPage({
    status: 'COMPLETED',
    pickupAddress: 'A',
    dropoffAddress: 'B',
    driverPosition: { lat: 1, lng: 2 },
  });
  assert.ok(!html.includes('http-equiv="refresh"'));
  assert.ok(!html.includes('openstreetmap.org/?mlat'));
});
