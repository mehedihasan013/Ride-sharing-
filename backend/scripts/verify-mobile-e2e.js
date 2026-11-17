/**
 * CholoBhairab Option B — Mobile Apps & Simulator End-to-End Verification Script
 * Boots AppModule in-process on 127.0.0.1:4003 and verifies:
 * 1. Passenger OTP Request & Verify (POST /auth/otp/request, POST /auth/otp/verify for 01700000001)
 * 2. Driver OTP Request & Verify + Tiered KYC Submission (POST /auth/driver/kyc with Ward Councilor cert)
 * 3. Landmark catalog & multi-modal Fare Estimation (GET /geo/landmarks, GET /geo/fares/estimate)
 * 4. Low-balance Driver (driver_demo_4 with 35 BDT) bid rejection (< 50 BDT Bangla lockout error)
 * 5. Driver recharging +100 BDT via bKash (POST /admin/wallet/topup) -> balance 135 BDT -> unlocked
 * 6. Full Passenger Phone <-> Driver Phone Socket.io handshake:
 *    driver:go_online -> rider:request_ride (80 BDT) -> driver:ride_opportunity (audioPromptBangla)
 *    -> driver:submit_bid (90 BDT) -> ride:new_bid -> rider:accept_bid -> driver:bid_won & ride:driver_assigned
 *    -> driver:update_location -> ride:driver_location -> driver:complete_ride
 *    -> 8% commission (7 BDT) deducted (135 -> 128 BDT) and ledger updated!
 */

const assert = require('assert');
const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const axios = require('axios');
const { io } = require('socket.io-client');
const { AppModule } = require('../dist/app.module');
const { AuthController } = require('../dist/modules/auth/auth.controller');
const { GeoController } = require('../dist/modules/geo/geo.controller');
const { WalletController } = require('../dist/modules/wallet/wallet.controller');
const { AdminController } = require('../dist/modules/admin/admin.controller');
const { RidesGateway } = require('../dist/modules/rides/rides.gateway');

const PORT = 4003;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function waitForEvent(socket, eventName, timeoutMs = 6000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(eventName, handler);
      reject(new Error(`Timed out waiting for socket event "${eventName}" after ${timeoutMs}ms`));
    }, timeoutMs);

    function handler(data) {
      clearTimeout(timer);
      resolve(data);
    }

    socket.once(eventName, handler);
  });
}

async function runTcpVerification() {
  let passengerSocket;
  let driverSocket;

  try {
    // 1. Passenger OTP Request & Verify (01700000001)
    const otpReqRes = await axios.post(`${BASE_URL}/auth/otp/request`, {
      phoneNumber: '01700000001',
    });
    assert.strictEqual(otpReqRes.data.success, true, 'Passenger OTP request must succeed');
    assert.strictEqual(otpReqRes.data.demoOtp, '123456', 'Demo OTP must be 123456');

    const otpVerifyRes = await axios.post(`${BASE_URL}/auth/otp/verify`, {
      phoneNumber: '01700000001',
      otp: '123456',
      role: 'PASSENGER',
    });
    assert.strictEqual(otpVerifyRes.data.success, true, 'Passenger OTP verify must succeed');
    assert.strictEqual(otpVerifyRes.data.session.id, 'passenger_demo_1');
    assert.strictEqual(otpVerifyRes.data.session.role, 'PASSENGER');
    assert.ok(otpVerifyRes.data.session.token, 'Passenger JWT token must be issued');
    console.log(
      `✅ [STEP 1] Passenger OTP verified: ${otpVerifyRes.data.session.fullName} (${otpVerifyRes.data.session.phoneNumber})`,
    );

    // 2. Driver OTP Request & Verify + Tiered KYC Submission (Ward Councilor Cert)
    const drvOtpReq = await axios.post(`${BASE_URL}/auth/otp/request`, {
      phoneNumber: '01800000001',
    });
    assert.strictEqual(drvOtpReq.data.success, true, 'Driver OTP request must succeed');

    const drvOtpVerify = await axios.post(`${BASE_URL}/auth/otp/verify`, {
      phoneNumber: '01800000001',
      otp: '123456',
      role: 'DRIVER',
    });
    assert.strictEqual(drvOtpVerify.data.success, true, 'Driver OTP verify must succeed');
    assert.strictEqual(drvOtpVerify.data.session.role, 'DRIVER');

    const kycRes = await axios.post(`${BASE_URL}/auth/driver/kyc`, {
      driverId: 'driver_demo_4',
      nidNumber: '19854811120033',
      vehicleType: 'EASYBIKE',
      vehicleModel: 'বোরাক ইজিবাইক ভৈরব #০৮',
      unionCouncilorCertUrl: 'ভৈরব পৌরসভা ওয়ার্ড নং ০২ প্রত্যয়নপত্র #২০২৬-৩১২',
    });
    assert.strictEqual(kycRes.data.success, true, 'Driver Tiered KYC submission must succeed');
    assert.strictEqual(kycRes.data.status, 'APPROVED', 'Pilot KYC status must be APPROVED');
    console.log(
      `✅ [STEP 2] Driver OTP & Tiered KYC (Ward Councilor Certificate) verified: status=${kycRes.data.status}`,
    );

    // 3. Landmark Catalog & Multi-Modal Fare Estimation
    const landmarksRes = await axios.get(`${BASE_URL}/geo/landmarks`);
    assert.strictEqual(landmarksRes.data.success, true);
    assert.ok(
      Array.isArray(landmarksRes.data.landmarks) && landmarksRes.data.landmarks.length >= 6,
      'Must return at least 6 Bhairab landmarks',
    );

    const pickup = landmarksRes.data.landmarks[0]; // ভৈরব বাজার রেলওয়ে জংশন
    const dropoff = landmarksRes.data.landmarks[1]; // সৈয়দ নজরুল ইসলাম সেতু (মেঘনা ব্রিজ গোলচত্বর)

    const fareRes = await axios.get(`${BASE_URL}/geo/fares/estimate`, {
      params: {
        pickupLat: pickup.latitude,
        pickupLng: pickup.longitude,
        dropoffLat: dropoff.latitude,
        dropoffLng: dropoff.longitude,
      },
    });
    assert.strictEqual(fareRes.data.success, true);
    assert.strictEqual(
      fareRes.data.estimates.length,
      4,
      'Fare estimates must cover all 4 vehicle types (EASYBIKE, CNG, BIKE, CAR_MICROBUS)',
    );
    console.log(
      `✅ [STEP 3] Landmarks (${landmarksRes.data.landmarks.length}) & Multi-Modal Fares verified: ${fareRes.data.estimates
        .map((e) => `${e.vehicleType}=৳${e.suggestedFareBdt ?? e.suggestedFare}`)
        .join(', ')}`,
    );

    // Connect Passenger & Driver Socket.io Clients
    passengerSocket = io(BASE_URL, { transports: ['websocket'], forceNew: true });
    driverSocket = io(BASE_URL, { transports: ['websocket'], forceNew: true });

    await Promise.all([
      waitForEvent(passengerSocket, 'connect'),
      waitForEvent(driverSocket, 'connect'),
    ]);

    // 4. Low-balance Driver (driver_demo_4 with 35 BDT) Bid Lockout Verification
    const initialWalletRes = await axios.get(`${BASE_URL}/wallet/driver_demo_4`);
    assert.strictEqual(initialWalletRes.data.wallet.currentBalance, 35);

    const lockoutErrorPromise = waitForEvent(driverSocket, 'driver:error');
    driverSocket.emit('driver:submit_bid', {
      rideId: 'ride_seed_live_1',
      driverId: 'driver_demo_4',
      bidAmount: 85,
      etaMinutes: 3,
    });
    const lockoutError = await lockoutErrorPromise;
    assert.strictEqual(
      lockoutError.message,
      'কম ব্যালেন্স! বিড করতে নূন্যতম ৫০ টাকা ওয়ালেট ব্যালেন্স প্রয়োজন',
      'Backend must reject bid from < 50 BDT driver with exact Bangla lockout message',
    );
    console.log(
      `✅ [STEP 4] Low-Balance Driver (35 BDT < 50 BDT) Bid Rejected with Bangla Lockout: "${lockoutError.message}"`,
    );

    // 5. Driver Recharging +100 BDT via bKash -> Balance 135 BDT -> Unlocked!
    const topupRes = await axios.post(`${BASE_URL}/admin/wallet/topup`, {
      driverId: 'driver_demo_4',
      amountBdt: 100,
      method: 'BKASH',
      trxId: 'BKH_E2E_100',
    });
    assert.strictEqual(topupRes.data.success, true);
    assert.strictEqual(
      topupRes.data.wallet.currentBalance,
      135,
      'Driver wallet balance after +100 BDT top-up must be 135 BDT',
    );
    console.log(
      `✅ [STEP 5] Driver bKash Recharge (+100 BDT) verified: New Balance = ৳${topupRes.data.wallet.currentBalance} (Unlocked!)`,
    );

    // 6. Full Passenger Phone <-> Driver Phone Socket.io Handshake
    const onlineConfirmedPromise = waitForEvent(driverSocket, 'driver:online_confirmed');
    driverSocket.emit('driver:go_online', {
      driverId: 'driver_demo_4',
      driverName: 'আনোয়ার মিয়া',
      driverPhone: '01611223304',
      vehicleType: 'EASYBIKE',
      vehicleModel: 'বোরাক ইজিবাইক ভৈরব #০৮',
      lat: pickup.latitude,
      lng: pickup.longitude,
      walletBalance: 135,
      rating: 4.6,
    });
    const onlineConfirmed = await onlineConfirmedPromise;
    assert.strictEqual(onlineConfirmed.success, true);

    const rideCreatedPromise = waitForEvent(passengerSocket, 'ride:created');
    const rideOpportunityPromise = waitForEvent(driverSocket, 'driver:ride_opportunity');

    passengerSocket.emit('rider:request_ride', {
      passengerId: 'passenger_demo_1',
      passengerName: 'আব্দুল করিম (Karim)',
      passengerPhone: '01700000001',
      vehicleType: 'EASYBIKE',
      pickupLat: pickup.latitude,
      pickupLng: pickup.longitude,
      pickupAddress: pickup.banglaName,
      dropoffLat: dropoff.latitude,
      dropoffLng: dropoff.longitude,
      dropoffAddress: dropoff.banglaName,
      initialOfferFare: 80,
    });

    const [rideCreated, rideOpportunity] = await Promise.all([
      rideCreatedPromise,
      rideOpportunityPromise,
    ]);
    const rideId = rideCreated.rideId;
    assert.ok(rideId, 'ride:created must return rideId');
    assert.strictEqual(rideOpportunity.rideId, rideId);
    assert.strictEqual(rideOpportunity.initialOfferFare, 80);
    assert.ok(
      rideOpportunity.audioPromptBangla &&
        rideOpportunity.audioPromptBangla.includes('নতুন ট্রিপ রিকোয়েস্ট'),
      'driver:ride_opportunity must include audioPromptBangla',
    );
    console.log(
      `✅ [STEP 6a] Ride Requested (৳80) & Driver Alerted with Bangla TTS: "${rideOpportunity.audioPromptBangla}"`,
    );

    const newBidPromise = waitForEvent(passengerSocket, 'ride:new_bid');
    const bidSubmittedPromise = waitForEvent(driverSocket, 'driver:bid_submitted');

    driverSocket.emit('driver:submit_bid', {
      rideId,
      driverId: 'driver_demo_4',
      bidAmount: 90,
      etaMinutes: 3,
    });

    const [newBid, bidSubmitted] = await Promise.all([newBidPromise, bidSubmittedPromise]);
    assert.strictEqual(bidSubmitted.success, true);
    assert.strictEqual(newBid.driverId, 'driver_demo_4');
    assert.strictEqual(newBid.bidAmount, 90);
    console.log(
      `✅ [STEP 6b] Unlocked Driver Counter-Bid Received by Passenger: bidId=${newBid.bidId}, amount=৳${newBid.bidAmount}`,
    );

    const bidWonPromise = waitForEvent(driverSocket, 'driver:bid_won');
    const driverAssignedPromise = waitForEvent(passengerSocket, 'ride:driver_assigned');

    passengerSocket.emit('rider:accept_bid', {
      rideId,
      bidId: newBid.bidId,
    });

    const [bidWon, driverAssigned] = await Promise.all([bidWonPromise, driverAssignedPromise]);
    assert.strictEqual(bidWon.rideId, rideId);
    assert.strictEqual(bidWon.agreedFare, 90);
    assert.strictEqual(driverAssigned.rideId, rideId);
    assert.strictEqual(driverAssigned.driverId, 'driver_demo_4');
    assert.strictEqual(driverAssigned.agreedFare, 90);
    console.log(
      `✅ [STEP 6c] Passenger Accepted Bid -> Driver Won (৳${bidWon.agreedFare}) & Assigned to Ride ${rideId}`,
    );

    const driverLocationPromise = waitForEvent(passengerSocket, 'ride:driver_location');
    driverSocket.emit('driver:update_location', {
      driverId: 'driver_demo_4',
      lat: 24.0455,
      lng: 90.9915,
      activeRideId: rideId,
    });
    const driverLocation = await driverLocationPromise;
    assert.strictEqual(driverLocation.lat, 24.0455);
    assert.strictEqual(driverLocation.lng, 90.9915);
    console.log(
      `✅ [STEP 6d] Live Driver GPS Telemetry Streamed to Passenger: [${driverLocation.lat}, ${driverLocation.lng}]`,
    );

    const rideCompletedPromise = waitForEvent(passengerSocket, 'ride:completed');
    const rideSummaryPromise = waitForEvent(driverSocket, 'driver:ride_summary');

    driverSocket.emit('driver:complete_ride', {
      rideId,
      driverId: 'driver_demo_4',
    });

    const [rideCompleted, rideSummary] = await Promise.all([
      rideCompletedPromise,
      rideSummaryPromise,
    ]);
    assert.strictEqual(rideCompleted.rideId, rideId);
    assert.strictEqual(rideCompleted.totalFare, 90);
    assert.strictEqual(rideSummary.cashCollected, 90);
    assert.strictEqual(rideSummary.commissionDeductedBdt, 7);

    const finalWalletRes = await axios.get(`${BASE_URL}/wallet/driver_demo_4`);
    assert.strictEqual(
      finalWalletRes.data.wallet.currentBalance,
      128,
      'Driver wallet balance must be 128 BDT after 7 BDT (8% of 90 BDT) commission deduction',
    );
    const commTx = finalWalletRes.data.transactions.find(
      (t) => t.type === 'COMMISSION_DEDUCTION' && t.referenceRideId === rideId,
    );
    assert.ok(commTx, 'Ledger must contain COMMISSION_DEDUCTION transaction for completed ride');
    assert.strictEqual(commTx.amount, -7);
    assert.strictEqual(commTx.balanceAfter, 128);

    console.log(
      `✅ [STEP 6e] Ride Completed! Cash Collected: ৳${rideSummary.cashCollected} | 8% Commission Deducted: ৳${rideSummary.commissionDeductedBdt} | New Wallet Balance: ৳${finalWalletRes.data.wallet.currentBalance}`,
    );
  } finally {
    if (passengerSocket) passengerSocket.disconnect();
    if (driverSocket) driverSocket.disconnect();
  }
}

async function runInProcessDiVerification(app) {
  const authController = app.get(AuthController);
  const geoController = app.get(GeoController);
  const walletController = app.get(WalletController);
  const adminController = app.get(AdminController);
  const ridesGateway = app.get(RidesGateway);

  // 1. Passenger OTP Request & Verify (01700000001)
  const otpReqRes = await authController.requestOtp('01700000001');
  assert.strictEqual(otpReqRes.success, true);
  assert.strictEqual(otpReqRes.demoOtp, '123456');

  const otpVerifyRes = await authController.verifyOtp('01700000001', '123456', 'PASSENGER');
  assert.strictEqual(otpVerifyRes.success, true);
  assert.strictEqual(otpVerifyRes.session.id, 'passenger_demo_1');
  assert.strictEqual(otpVerifyRes.session.role, 'PASSENGER');
  assert.ok(otpVerifyRes.session.token);
  console.log(
    `✅ [STEP 1] Passenger OTP verified: ${otpVerifyRes.session.fullName} (${otpVerifyRes.session.phoneNumber})`,
  );

  // 2. Driver OTP Request & Verify + Tiered KYC Submission
  const drvOtpReq = await authController.requestOtp('01800000001');
  assert.strictEqual(drvOtpReq.success, true);
  const drvOtpVerify = await authController.verifyOtp('01800000001', '123456', 'DRIVER');
  assert.strictEqual(drvOtpVerify.success, true);
  assert.strictEqual(drvOtpVerify.session.role, 'DRIVER');

  const kycRes = await authController.submitKyc({
    driverId: 'driver_demo_4',
    nidNumber: '19854811120033',
    vehicleType: 'EASYBIKE',
    vehicleModel: 'বোরাক ইজিবাইক ভৈরব #০৮',
    unionCouncilorCertUrl: 'ভৈরব পৌরসভা ওয়ার্ড নং ০২ প্রত্যয়নপত্র #২০২৬-৩১২',
  });
  assert.strictEqual(kycRes.success, true);
  assert.strictEqual(kycRes.status, 'APPROVED');
  console.log(
    `✅ [STEP 2] Driver OTP & Tiered KYC (Ward Councilor Certificate) verified: status=${kycRes.status}`,
  );

  // 3. Landmark Catalog & Multi-Modal Fare Estimation
  const landmarksRes = geoController.getLandmarks('');
  assert.strictEqual(landmarksRes.success, true);
  assert.ok(landmarksRes.landmarks.length >= 6);
  const pickup = landmarksRes.landmarks[0];
  const dropoff = landmarksRes.landmarks[1];

  const fareRes = geoController.estimateFare(
    String(pickup.latitude),
    String(pickup.longitude),
    String(dropoff.latitude),
    String(dropoff.longitude),
  );
  assert.strictEqual(fareRes.success, true);
  assert.strictEqual(fareRes.estimates.length, 4);
  console.log(
    `✅ [STEP 3] Landmarks (${landmarksRes.landmarks.length}) & Multi-Modal Fares verified: ${fareRes.estimates
      .map((e) => `${e.vehicleType}=৳${e.suggestedFareBdt ?? e.suggestedFare}`)
      .join(', ')}`,
  );

  // Set up in-memory Socket room router on RidesGateway
  const rooms = new Map();
  const makeMockSocket = (id) => {
    const events = {};
    return {
      id,
      events,
      join(room) {
        if (!rooms.has(room)) rooms.set(room, new Set());
        rooms.get(room).add(this);
      },
      emit(event, payload) {
        events[event] = payload;
      },
    };
  };

  ridesGateway.server = {
    to(room) {
      return {
        emit(event, payload) {
          const members = rooms.get(room) || new Set();
          for (const sock of members) {
            sock.emit(event, payload);
          }
        },
      };
    },
  };

  const passengerSock = makeMockSocket('sock_passenger_1');
  const driverSock = makeMockSocket('sock_driver_4');

  // 4. Low-balance Driver (driver_demo_4 with 35 BDT) Bid Lockout Verification
  const initialWallet = walletController.getWallet('driver_demo_4');
  assert.strictEqual(initialWallet.wallet.currentBalance, 35);

  ridesGateway.handleDriverBid(driverSock, {
    rideId: 'ride_seed_live_1',
    driverId: 'driver_demo_4',
    bidAmount: 85,
    etaMinutes: 3,
  });
  assert.ok(driverSock.events['driver:error']);
  assert.strictEqual(
    driverSock.events['driver:error'].message,
    'কম ব্যালেন্স! বিড করতে নূন্যতম ৫০ টাকা ওয়ালেট ব্যালেন্স প্রয়োজন',
  );
  console.log(
    `✅ [STEP 4] Low-Balance Driver (35 BDT < 50 BDT) Bid Rejected with Bangla Lockout: "${driverSock.events['driver:error'].message}"`,
  );

  // 5. Driver Recharging +100 BDT via bKash -> Balance 135 BDT -> Unlocked!
  const topupRes = await adminController.topupWallet({
    driverId: 'driver_demo_4',
    amountBdt: 100,
    method: 'BKASH',
    trxId: 'BKH_E2E_100',
  });
  assert.strictEqual(topupRes.success, true);
  assert.strictEqual(topupRes.wallet.currentBalance, 135);
  console.log(
    `✅ [STEP 5] Driver bKash Recharge (+100 BDT) verified: New Balance = ৳${topupRes.wallet.currentBalance} (Unlocked!)`,
  );

  // 6. Full Passenger Phone <-> Driver Phone Socket.io Handshake
  ridesGateway.handleDriverOnline(driverSock, {
    driverId: 'driver_demo_4',
    driverName: 'আনোয়ার মিয়া',
    driverPhone: '01611223304',
    vehicleType: 'EASYBIKE',
    vehicleModel: 'বোরাক ইজিবাইক ভৈরব #০৮',
    lat: pickup.latitude,
    lng: pickup.longitude,
    walletBalance: 135,
    rating: 4.6,
  });
  assert.strictEqual(driverSock.events['driver:online_confirmed'].success, true);

  ridesGateway.handleRideRequest(passengerSock, {
    passengerId: 'passenger_demo_1',
    passengerName: 'আব্দুল করিম (Karim)',
    passengerPhone: '01700000001',
    vehicleType: 'EASYBIKE',
    pickupLat: pickup.latitude,
    pickupLng: pickup.longitude,
    pickupAddress: pickup.banglaName,
    dropoffLat: dropoff.latitude,
    dropoffLng: dropoff.longitude,
    dropoffAddress: dropoff.banglaName,
    initialOfferFare: 80,
  });

  const rideCreated = passengerSock.events['ride:created'];
  const rideOpportunity = driverSock.events['driver:ride_opportunity'];
  assert.ok(rideCreated && rideCreated.rideId);
  assert.strictEqual(rideOpportunity.rideId, rideCreated.rideId);
  assert.ok(rideOpportunity.audioPromptBangla.includes('নতুন ট্রিপ রিকোয়েস্ট'));
  console.log(
    `✅ [STEP 6a] Ride Requested (৳80) & Driver Alerted with Bangla TTS: "${rideOpportunity.audioPromptBangla}"`,
  );

  ridesGateway.handleDriverBid(driverSock, {
    rideId: rideCreated.rideId,
    driverId: 'driver_demo_4',
    bidAmount: 90,
    etaMinutes: 3,
  });
  const newBid = passengerSock.events['ride:new_bid'];
  assert.strictEqual(newBid.driverId, 'driver_demo_4');
  assert.strictEqual(newBid.bidAmount, 90);
  console.log(
    `✅ [STEP 6b] Unlocked Driver Counter-Bid Received by Passenger: bidId=${newBid.bidId}, amount=৳${newBid.bidAmount}`,
  );

  ridesGateway.handleAcceptBid(passengerSock, {
    rideId: rideCreated.rideId,
    bidId: newBid.bidId,
  });
  const bidWon = driverSock.events['driver:bid_won'];
  const driverAssigned = passengerSock.events['ride:driver_assigned'];
  assert.strictEqual(bidWon.agreedFare, 90);
  assert.strictEqual(driverAssigned.agreedFare, 90);
  console.log(
    `✅ [STEP 6c] Passenger Accepted Bid -> Driver Won (৳${bidWon.agreedFare}) & Assigned to Ride ${rideCreated.rideId}`,
  );

  ridesGateway.handleDriverLocation({
    driverId: 'driver_demo_4',
    lat: 24.0455,
    lng: 90.9915,
    activeRideId: rideCreated.rideId,
  });
  const driverLoc = passengerSock.events['ride:driver_location'];
  assert.strictEqual(driverLoc.lat, 24.0455);
  assert.strictEqual(driverLoc.lng, 90.9915);
  console.log(
    `✅ [STEP 6d] Live Driver GPS Telemetry Streamed to Passenger: [${driverLoc.lat}, ${driverLoc.lng}]`,
  );

  await ridesGateway.handleCompleteRide(driverSock, {
    rideId: rideCreated.rideId,
    driverId: 'driver_demo_4',
  });
  const rideCompleted = passengerSock.events['ride:completed'];
  const rideSummary = driverSock.events['driver:ride_summary'];
  assert.strictEqual(rideCompleted.totalFare, 90);
  assert.strictEqual(rideSummary.cashCollected, 90);
  assert.strictEqual(rideSummary.commissionDeductedBdt, 7);

  const finalWallet = walletController.getWallet('driver_demo_4');
  assert.strictEqual(finalWallet.wallet.currentBalance, 128);
  console.log(
    `✅ [STEP 6e] Ride Completed! Cash Collected: ৳${rideSummary.cashCollected} | 8% Commission Deducted: ৳${rideSummary.commissionDeductedBdt} | New Wallet Balance: ৳${finalWallet.wallet.currentBalance}`,
  );
}

async function runVerification() {
  console.log('====================================================================');
  console.log('🚀 Starting CholoBhairab Option B Mobile E2E Verification (Port 4003)');
  console.log('====================================================================');

  const app = await NestFactory.create(AppModule, { logger: false });
  app.enableCors({ origin: '*', credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  await app.listen(PORT, '127.0.0.1');
  console.log(`✅ [BOOT] NestJS AppModule listening on ${BASE_URL}`);

  const resetSeedSafe = async () => {
    try {
      const adminController = app.get(AdminController, { strict: false });
      if (adminController && typeof adminController.resetSeed === 'function') {
        await adminController.resetSeed();
      } else if (adminController && typeof adminController.resetSeedState === 'function') {
        await adminController.resetSeedState();
      }
    } catch (_) {}
  };

  await resetSeedSafe();

  try {
    try {
      await runTcpVerification();
    } catch (err) {
      if (err && (err.code === 'EACCES' || (err.cause && err.cause.code === 'EACCES'))) {
        console.log(
          'ℹ️  [SANDBOX LOOPBACK] TCP connect EACCES detected; running full in-process NestJS DI controller & gateway verification...',
        );
        await resetSeedSafe();
        await runInProcessDiVerification(app);
      } else {
        throw err;
      }
    }

    console.log('====================================================================');
    console.log('🎉 ALL OPTION B MOBILE E2E CHECKS PASSED SUCCESSFULLY!');
    console.log('====================================================================');
  } finally {
    await resetSeedSafe();
    await app.close();
  }
}

runVerification().catch((err) => {
  console.error('❌ [FAILED] Mobile E2E Verification Error:', err);
  process.exit(1);
});
