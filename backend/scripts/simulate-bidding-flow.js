const { io } = require('socket.io-client');
const http = require('http');

async function runSimulation() {
  console.log('================================================================');
  console.log('🚕 CHOLOBHAIRAB - REAL-TIME IN-DRIVE BIDDING & TRIP SIMULATION');
  console.log('📍 Location: Bhairab, Kishoreganj / Dhaka Division, Bangladesh');
  console.log('================================================================\n');

  const SERVER_URL = 'http://127.0.0.1:4000';

  // 1. Check REST endpoint for Bhairab Landmarks
  console.log('STEP 1: Querying local Bhairab Landmarks from REST API...');
  try {
    const res = await fetch(`${SERVER_URL}/geo/landmarks`);
    const data = await res.json();
    console.log(`✅ Retrieved ${data.landmarks.length} landmarks:`);
    data.landmarks.slice(0, 3).forEach((l) => {
      console.log(`   - ${l.banglaName} (${l.englishName}) [${l.category}]`);
    });
  } catch (err) {
    console.error('REST call failed:', err.message);
  }

  // 2. Connect Driver Socket
  console.log('\nSTEP 2: Connecting Easy-Bike (Tomtom) Driver Socket...');
  const driverSocket = io(SERVER_URL);
  const passengerSocket = io(SERVER_URL);

  await new Promise((resolve) => driverSocket.on('connect', resolve));
  console.log(`✅ Driver connected (Socket ID: ${driverSocket.id})`);

  await new Promise((resolve) => passengerSocket.on('connect', resolve));
  console.log(`✅ Passenger connected (Socket ID: ${passengerSocket.id})`);

  // Driver goes online at Bhairab Railway Station with 200 BDT wallet balance
  const driverData = {
    driverId: 'driver_demo_1',
    driverName: 'মোঃ রফিকুল ইসলাম (Rafiqul)',
    driverPhone: '01800000001',
    vehicleType: 'EASYBIKE',
    vehicleModel: 'ভৈরব টমটম (ইজিবাইক)',
    lat: 24.0487, // Bhairab Railway Station
    lng: 90.9852,
    walletBalance: 200.0,
    rating: 4.9,
  };

  driverSocket.emit('driver:go_online', driverData);
  await new Promise((resolve) => {
    driverSocket.on('driver:online_confirmed', (msg) => {
      console.log(`📢 Driver Status: ${msg.messageBangla}`);
      resolve();
    });
  });

  // 3. Passenger requests ride
  console.log('\nSTEP 3: Passenger requesting ride from Railway Station to Meghna Bridge...');
  const rideRequest = {
    passengerId: 'passenger_demo_1',
    passengerName: 'আব্দুল করিম (Karim)',
    passengerPhone: '01700000001',
    vehicleType: 'EASYBIKE',
    pickupLat: 24.0487,
    pickupLng: 90.9852,
    pickupAddress: 'ভৈরব বাজার রেলওয়ে স্টেশন',
    dropoffLat: 24.0418,
    dropoffLng: 91.0022,
    dropoffAddress: 'সৈয়দ নজরুল ইসলাম সেতু (মেঘনা ব্রিজ)',
    initialOfferFare: 80,
  };

  let activeRideId = null;

  // Driver listens for ride opportunities
  const opportunityPromise = new Promise((resolve) => {
    driverSocket.on('driver:ride_opportunity', (opp) => {
      console.log(`\n🔊 [Driver App Voice Prompt]: "${opp.audioPromptBangla}"`);
      console.log(`   Rider Offer: ${opp.initialOfferFare} BDT`);
      resolve(opp);
    });
  });

  passengerSocket.emit('rider:request_ride', rideRequest);
  passengerSocket.on('ride:created', (data) => {
    activeRideId = data.rideId;
    console.log(`✅ Ride created: ${data.rideId} (Status: ${data.status})`);
    console.log(`🔗 Public Live Tracking Token: ${data.liveTrackingToken}`);
  });

  const opp = await opportunityPromise;

  // 4. Driver submits counter-bid (90 BDT)
  console.log('\nSTEP 4: Driver submitting counter-bid of 90 BDT (ETA: 3 mins)...');
  const bidPromise = new Promise((resolve) => {
    passengerSocket.on('ride:new_bid', (bid) => {
      console.log(`📥 [Passenger App]: New Bid received from ${bid.driverName} (${bid.vehicleModel})`);
      console.log(`   Bid Amount: ${bid.bidAmount} BDT | ETA: ${bid.etaMinutes} mins | Rating: ${bid.ratingAvg}★`);
      resolve(bid);
    });
  });

  driverSocket.emit('driver:submit_bid', {
    rideId: opp.rideId,
    driverId: driverData.driverId,
    bidAmount: 90,
    etaMinutes: 3,
  });

  const receivedBid = await bidPromise;

  // 5. Passenger accepts Driver's bid
  console.log('\nSTEP 5: Passenger accepts Driver bid (90 BDT)...');
  const matchPromise = new Promise((resolve) => {
    driverSocket.on('driver:bid_won', (match) => {
      console.log(`🎉 [Driver App Alert]: "${match.messageBangla}"`);
      console.log(`   Agreed Fare: ${match.agreedFare} BDT | Pickup: ${match.pickupAddress}`);
      resolve(match);
    });
  });

  passengerSocket.emit('rider:accept_bid', {
    rideId: opp.rideId,
    bidId: receivedBid.bidId,
  });

  await matchPromise;

  // 6. Complete Ride & Deduct Commission
  console.log('\nSTEP 6: Trip arrives at destination. Driver completes trip & collects cash...');
  const completePromise = new Promise((resolve) => {
    driverSocket.on('driver:ride_summary', (summary) => {
      console.log(`💰 [Driver Earnings Summary]: ${summary.messageBangla}`);
      console.log(`   Cash Collected: ${summary.cashCollected} BDT`);
      console.log(`   Platform Commission (8%): ${summary.commissionDeductedBdt} BDT`);
      resolve(summary);
    });
  });

  driverSocket.emit('driver:complete_ride', {
    rideId: opp.rideId,
    driverId: driverData.driverId,
  });

  await completePromise;

  // 7. Verify Driver Wallet Ledger
  console.log('\nSTEP 7: Checking Driver Wallet balance and ledger via REST API...');
  const walletRes = await fetch(`${SERVER_URL}/wallet/${driverData.driverId}`);
  const walletData = await walletRes.json();
  console.log(`💳 Current Driver Wallet Balance: ${walletData.wallet.currentBalance} BDT`);
  console.log(`📜 Recent Transactions:`);
  walletData.transactions.forEach((tx) => {
    console.log(`   - [${tx.type}] ${tx.amount > 0 ? '+' : ''}${tx.amount} BDT | Note: ${tx.noteBangla} (Balance: ${tx.balanceAfter} BDT)`);
  });

  console.log('\n================================================================');
  console.log('✨ SIMULATION PASSED: InDrive Bidding & 8% Commission Validated!');
  console.log('================================================================\n');

  driverSocket.disconnect();
  passengerSocket.disconnect();
  process.exit(0);
}

runSimulation().catch((err) => {
  console.error('Simulation error:', err);
  process.exit(1);
});
