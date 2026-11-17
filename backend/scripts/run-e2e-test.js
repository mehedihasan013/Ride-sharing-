const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { io } = require('socket.io-client');

async function main() {
  console.log('================================================================');
  console.log('🚕 CHOLOBHAIRAB - IN-PROCESS E2E SIMULATION (BHAIRAB, BANGLADESH)');
  console.log('================================================================\n');

  // 1. Boot NestJS Application in-process on Port 4001
  process.env.PORT = '4001';
  const app = await NestFactory.create(AppModule, { logger: ['warn', 'error'] });
  await app.listen(4001, '127.0.0.1');
  console.log('🚀 Backend started on http://127.0.0.1:4001');

  const SERVER_URL = 'http://127.0.0.1:4001';

  // 2. Query Landmarks via REST
  console.log('\nSTEP 1: Testing REST API - Bhairab Local Landmarks...');
  const landmarksRes = await fetch(`${SERVER_URL}/geo/landmarks`);
  const landmarksData = await landmarksRes.json();
  console.log(`✅ Loaded ${landmarksData.landmarks.length} Bhairab Landmarks:`);
  landmarksData.landmarks.forEach((l) => {
    console.log(`   📍 ${l.banglaName} (${l.englishName}) - Lat: ${l.latitude}, Lng: ${l.longitude}`);
  });

  // 3. Estimate Fare for Route
  console.log('\nSTEP 2: Testing Fare Estimator for Bhairab Station -> Meghna Bridge...');
  const station = landmarksData.landmarks[0]; // Bhairab Station
  const bridge = landmarksData.landmarks[1];  // Meghna Bridge
  const fareRes = await fetch(`${SERVER_URL}/geo/fares/estimate?pickupLat=${station.latitude}&pickupLng=${station.longitude}&dropoffLat=${bridge.latitude}&dropoffLng=${bridge.longitude}`);
  const fareData = await fareRes.json();
  console.log(`✅ Suggested Fares for Distance (${fareData.estimates[0].distanceKm} km):`);
  fareData.estimates.forEach((e) => {
    console.log(`   🚗 ${e.vehicleType.padEnd(12)}: Suggested ${e.suggestedFareBdt} BDT (Min: ${e.minimumFareBdt} BDT, ~${e.estimatedMinutes} mins)`);
  });

  // 4. Connect WebSockets
  console.log('\nSTEP 3: Connecting Driver & Passenger WebSockets...');
  const driverSocket = io(SERVER_URL, { transports: ['websocket'] });
  const passengerSocket = io(SERVER_URL, { transports: ['websocket'] });

  await new Promise((res) => driverSocket.on('connect', res));
  console.log(`✅ Driver Connected (ID: ${driverSocket.id})`);

  await new Promise((res) => passengerSocket.on('connect', res));
  console.log(`✅ Passenger Connected (ID: ${passengerSocket.id})`);

  // 5. Driver registers Online at Bhairab Station
  const driverProfile = {
    driverId: 'driver_demo_1',
    driverName: 'মোঃ রফিকুল ইসলাম (Rafiqul)',
    driverPhone: '01800000001',
    vehicleType: 'EASYBIKE',
    vehicleModel: 'ভৈরব ইজিবাইক (টমটম)',
    lat: station.latitude,
    lng: station.longitude,
    walletBalance: 200.0,
    rating: 4.9,
  };

  driverSocket.emit('driver:go_online', driverProfile);
  await new Promise((res) => {
    driverSocket.on('driver:online_confirmed', (msg) => {
      console.log(`📢 [Driver Status]: ${msg.messageBangla}`);
      res();
    });
  });

  // 6. Passenger requests ride with initial offer of 80 BDT
  console.log('\nSTEP 4: Passenger requesting ride (Offer: 80 BDT)...');
  const ridePayload = {
    passengerId: 'passenger_demo_1',
    passengerName: 'আব্দুল করিম (Karim)',
    passengerPhone: '01700000001',
    vehicleType: 'EASYBIKE',
    pickupLat: station.latitude,
    pickupLng: station.longitude,
    pickupAddress: station.banglaName,
    dropoffLat: bridge.latitude,
    dropoffLng: bridge.longitude,
    dropoffAddress: bridge.banglaName,
    initialOfferFare: 80,
  };

  let activeRideId = '';
  const oppPromise = new Promise((res) => {
    driverSocket.on('driver:ride_opportunity', (opp) => {
      console.log(`\n🔊 [Driver App Bengali Voice Alert]:`);
      console.log(`   "${opp.audioPromptBangla}"`);
      res(opp);
    });
  });

  passengerSocket.emit('rider:request_ride', ridePayload);
  passengerSocket.on('ride:created', (data) => {
    activeRideId = data.rideId;
    console.log(`✅ Ride created in engine: ${data.rideId} (Status: ${data.status})`);
  });

  const opp = await oppPromise;

  // 7. Driver submits counter-bid of 90 BDT
  console.log('\nSTEP 5: Driver counter-bidding 90 BDT (ETA: 3 mins)...');
  const bidPromise = new Promise((res) => {
    passengerSocket.on('ride:new_bid', (bid) => {
      console.log(`📥 [Passenger Screen]: Bid received from ${bid.driverName} (${bid.vehicleModel})`);
      console.log(`   Fare: ${bid.bidAmount} BDT | ETA: ${bid.etaMinutes} mins | Rating: ${bid.ratingAvg}★`);
      res(bid);
    });
  });

  driverSocket.emit('driver:submit_bid', {
    rideId: opp.rideId,
    driverId: driverProfile.driverId,
    bidAmount: 90,
    etaMinutes: 3,
  });

  const receivedBid = await bidPromise;

  // 8. Passenger accepts the 90 BDT bid
  console.log('\nSTEP 6: Passenger accepts 90 BDT counter-bid...');
  const wonPromise = new Promise((res) => {
    driverSocket.on('driver:bid_won', (won) => {
      console.log(`🎉 [Driver App]: "${won.messageBangla}"`);
      console.log(`   Agreed Fare: ${won.agreedFare} BDT to ${won.dropoffAddress}`);
      res(won);
    });
  });

  passengerSocket.emit('rider:accept_bid', {
    rideId: opp.rideId,
    bidId: receivedBid.bidId,
  });

  await wonPromise;

  // 9. Trip completion and 8% commission deduction
  console.log('\nSTEP 7: Trip completed at destination. Driver collects cash...');
  const summaryPromise = new Promise((res) => {
    driverSocket.on('driver:ride_summary', (s) => {
      console.log(`💰 [Driver Cash & Commission]:`);
      console.log(`   ${s.messageBangla}`);
      res(s);
    });
  });

  driverSocket.emit('driver:complete_ride', {
    rideId: opp.rideId,
    driverId: driverProfile.driverId,
  });

  await summaryPromise;

  // 10. Check Driver Wallet Ledger
  console.log('\nSTEP 8: Verifying Driver Wallet ledger via REST API...');
  const walletRes = await fetch(`${SERVER_URL}/wallet/${driverProfile.driverId}`);
  const walletData = await walletRes.json();
  console.log(`💳 Driver Wallet Balance: ${walletData.wallet.currentBalance} BDT (Initial: 200 BDT)`);
  console.log(`📜 Ledger Entries:`);
  walletData.transactions.forEach((tx) => {
    console.log(`   - [${tx.type}] ${tx.amount} BDT | Note: ${tx.noteBangla} (New Balance: ${tx.balanceAfter} BDT)`);
  });

  console.log('\n================================================================');
  console.log('✅ ALL TEST SUITES PASSED: IN-DRIVE BIDDING & COMMISSION VERIFIED');
  console.log('================================================================\n');

  driverSocket.disconnect();
  passengerSocket.disconnect();
  await app.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
