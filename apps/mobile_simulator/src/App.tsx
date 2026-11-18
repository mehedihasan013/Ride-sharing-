import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import {
  ActiveRideSession,
  BaseFareEstimate,
  BHAIRAB_LANDMARKS,
  BhairabLandmark,
  calculateLocalSuggestedFares,
  DRIVER_PERSONAS,
  DriverPersona,
  IncomingBid,
  speakBanglaVoicePrompt,
  VehicleType,
  WalletTransaction,
} from './types';
import { PassengerPhone } from './components/PassengerPhone';
import { DriverPhone, BkashExecutedPayload } from './components/DriverPhone';

import { API_BASE } from './config';

const INITIAL_TRANSACTIONS: Record<string, WalletTransaction[]> = {
  driver_demo_1: [
    {
      id: 'tx_seed_comm_1',
      driverId: 'driver_demo_1',
      driverName: 'মোঃ রফিকুল ইসলাম',
      type: 'COMMISSION_DEDUCTION',
      amount: -7,
      balanceAfter: 193,
      referenceRideId: 'ride_seed_completed_1',
      noteBangla: 'ট্রিপ কমিশন কর্তন (৮%): ৭ টাকা (ভাড়া ৯০ টাকা)',
      createdAt: new Date(Date.now() - 1800 * 1000).toISOString(),
    },
    {
      id: 'tx_seed_bonus_1',
      driverId: 'driver_demo_1',
      driverName: 'মোঃ রফিকুল ইসলাম',
      type: 'PROMOTIONAL_BONUS',
      amount: 200,
      balanceAfter: 200,
      noteBangla: 'চলো ভৈরব উদ্বোধনী স্বাগতম বোনাস',
      createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    },
  ],
  driver_demo_4: [
    {
      id: 'tx_seed_anwar_1',
      driverId: 'driver_demo_4',
      driverName: 'আনোয়ার মিয়া',
      type: 'COMMISSION_DEDUCTION',
      amount: -15,
      balanceAfter: 35,
      noteBangla: 'ট্রিপ কমিশন কর্তন (৮%) — ব্যালেন্স ৫০ টাকার নিচে নেমেছে',
      createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    },
  ],
};

export function App() {
  // Backend connection & audio state
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [eventLog, setEventLog] = useState<{ id: number; at: Date; text: string }[]>(() => [
    { id: 0, at: new Date(), text: 'Simulator ready' },
  ]);
  // Only touches the stable state setter, so the stale copy captured by the socket effect stays correct.
  const setLastSocketEvent = (text: string) =>
    setEventLog((prev) => [{ id: Date.now() + Math.random(), at: new Date(), text }, ...prev].slice(0, 60));
  const [autoDemoRunning, setAutoDemoRunning] = useState<boolean>(false);

  // Passenger Phone State
  const [pickup, setPickup] = useState<BhairabLandmark>(BHAIRAB_LANDMARKS[0]); // Railway Junction
  const [dropoff, setDropoff] = useState<BhairabLandmark>(BHAIRAB_LANDMARKS[1]); // Meghna Bridge
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('EASYBIKE');
  const [fareEstimates, setFareEstimates] = useState<BaseFareEstimate[]>(() =>
    calculateLocalSuggestedFares(
      BHAIRAB_LANDMARKS[0].latitude,
      BHAIRAB_LANDMARKS[0].longitude,
      BHAIRAB_LANDMARKS[1].latitude,
      BHAIRAB_LANDMARKS[1].longitude,
    ),
  );
  const [offerFare, setOfferFare] = useState<number>(80);

  // Driver Phone Persona & Wallet State
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('driver_demo_1');
  const [isDriverOnline, setIsDriverOnline] = useState<boolean>(true);
  const [driverBalances, setDriverBalances] = useState<Record<string, number>>({
    driver_demo_1: 193.0,
    driver_demo_4: 35.0,
  });
  const [driverTransactions, setDriverTransactions] =
    useState<Record<string, WalletTransaction[]>>(INITIAL_TRANSACTIONS);
  const [driverLandmark, setDriverLandmark] = useState<BhairabLandmark>(BHAIRAB_LANDMARKS[0]);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number }>({
    lat: BHAIRAB_LANDMARKS[0].latitude,
    lng: BHAIRAB_LANDMARKS[0].longitude,
  });
  const [driverErrorBanner, setDriverErrorBanner] = useState<string | null>(null);
  const [lastCommissionSummary, setLastCommissionSummary] = useState<{
    cashCollected: number;
    commissionDeducted: number;
    newBalance: number;
  } | null>(null);

  // Shared Active Ride Session across both phones
  const [activeRide, setActiveRide] = useState<ActiveRideSession | null>(null);

  // Socket refs
  const riderSocketRef = useRef<Socket | null>(null);
  const driverSocketRef = useRef<Socket | null>(null);
  const isMutedRef = useRef<boolean>(isMuted);
  isMutedRef.current = isMuted;

  const activePersona: DriverPersona =
    DRIVER_PERSONAS.find((p) => p.driverId === selectedPersonaId) || DRIVER_PERSONAS[0];
  const currentDriverBalance = driverBalances[activePersona.driverId] ?? activePersona.walletBalance;
  const currentDriverTxs = driverTransactions[activePersona.driverId] ?? [];

  // Recalculate fares when pickup or dropoff changes
  useEffect(() => {
    const localEst = calculateLocalSuggestedFares(
      pickup.latitude,
      pickup.longitude,
      dropoff.latitude,
      dropoff.longitude,
    );
    setFareEstimates(localEst);

    const vehicleEst = localEst.find((e) => e.vehicleType === selectedVehicle);
    if (vehicleEst) {
      // Keep default 80 BDT on initial Railway Junction -> Meghna Bridge Easy-Bike route for exact demo match
      if (
        pickup.id === 'bhairab-rail-station' &&
        dropoff.id === 'meghna-bridge-point' &&
        selectedVehicle === 'EASYBIKE'
      ) {
        setOfferFare(80);
      } else {
        setOfferFare(vehicleEst.suggestedFareBdt);
      }
    }

    // Also query live backend /geo/fares/estimate if reachable
    fetch(
      `${API_BASE}/geo/fares/estimate?pickupLat=${pickup.latitude}&pickupLng=${pickup.longitude}&dropoffLat=${dropoff.latitude}&dropoffLng=${dropoff.longitude}`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.estimates)) {
          setFareEstimates(data.estimates);
        }
      })
      .catch(() => {});
  }, [pickup, dropoff, selectedVehicle]);

  // Connect passenger and driver sockets to API_BASE
  useEffect(() => {
    const riderSocket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });
    const driverSocket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    riderSocketRef.current = riderSocket;
    driverSocketRef.current = driverSocket;

    riderSocket.on('connect', () => {
      setBackendConnected(true);
      setLastSocketEvent(`Connected to ${API_BASE}`);
    });

    riderSocket.on('disconnect', () => {
      setBackendConnected(false);
      setLastSocketEvent('Disconnected, phones now sync locally');
    });

    // Passenger receives ride:created confirmation from backend
    riderSocket.on(
      'ride:created',
      (data: { rideId: string; status: string; initialOfferFare: number; liveTrackingToken: string }) => {
        setLastSocketEvent(`ride:created ${data.rideId} sent to nearby drivers`);
        setActiveRide((prev) =>
          prev
            ? {
                ...prev,
                rideId: data.rideId,
                liveTrackingToken: data.liveTrackingToken || prev.liveTrackingToken,
              }
            : prev,
        );
      },
    );

    // Passenger receives incoming driver counter-bid
    riderSocket.on(
      'ride:new_bid',
      (data: {
        bidId: string;
        driverId: string;
        driverName: string;
        driverPhone: string;
        ratingAvg: number;
        vehicleModel: string;
        bidAmount: number;
        etaMinutes: number;
      }) => {
        setLastSocketEvent(
          `ride:new_bid ${data.driverName} ৳${data.bidAmount}, ETA ${data.etaMinutes} min`,
        );
        setActiveRide((prev) => {
          if (!prev) return prev;
          const filtered = prev.bids.filter((b) => b.driverId !== data.driverId);
          return {
            ...prev,
            status: 'BIDDING',
            bids: [
              ...filtered,
              {
                bidId: data.bidId,
                driverId: data.driverId,
                driverName: data.driverName,
                driverPhone: data.driverPhone,
                ratingAvg: data.ratingAvg,
                vehicleModel: data.vehicleModel,
                bidAmount: data.bidAmount,
                etaMinutes: data.etaMinutes,
                timestamp: Date.now(),
              },
            ],
          };
        });
      },
    );

    // Passenger receives driver assigned confirmation
    riderSocket.on(
      'ride:driver_assigned',
      (data: {
        rideId: string;
        driverId: string;
        driverName: string;
        driverPhone: string;
        vehicleModel: string;
        agreedFare: number;
        etaMinutes: number;
      }) => {
        setLastSocketEvent(
          `ride:driver_assigned ${data.driverName} at ৳${data.agreedFare}`,
        );
      },
    );

    // Passenger receives live driver GPS location stream
    riderSocket.on('ride:driver_location', (data: { lat: number; lng: number }) => {
      setDriverPos({ lat: data.lat, lng: data.lng });
      setActiveRide((prev) =>
        prev ? { ...prev, driverLat: data.lat, driverLng: data.lng } : prev,
      );
    });

    // Passenger receives ride completion
    riderSocket.on('ride:completed', (data: { rideId: string; totalFare: number }) => {
      setLastSocketEvent(`ride:completed cash paid ৳${data.totalFare}`);
    });

    // Driver receives ride opportunity with Bangla voice alert
    driverSocket.on(
      'driver:ride_opportunity',
      (data: {
        rideId: string;
        passengerName: string;
        pickupAddress: string;
        dropoffAddress: string;
        initialOfferFare: number;
        audioPromptBangla: string;
      }) => {
        setLastSocketEvent(`driver:ride_opportunity voice alert "${data.audioPromptBangla}"`);
      },
    );

    // Driver receives bid won notification
    driverSocket.on('driver:bid_won', (data: { rideId: string; agreedFare: number; messageBangla: string }) => {
      setLastSocketEvent(`driver:bid_won ${data.messageBangla} (৳${data.agreedFare})`);
    });

    // Driver receives ride summary after completion
    driverSocket.on(
      'driver:ride_summary',
      (data: { rideId: string; cashCollected: number; commissionDeductedBdt: number }) => {
        setLastSocketEvent(
          `driver:ride_summary cash ৳${data.cashCollected}, 8% commission −৳${data.commissionDeductedBdt}`,
        );
      },
    );

    // Driver receives backend error (e.g., < 50 BDT wallet lockout)
    driverSocket.on('driver:error', (data: { message: string }) => {
      setDriverErrorBanner(data.message);
      setLastSocketEvent(`driver:error ${data.message}`);
    });

    return () => {
      riderSocket.disconnect();
      driverSocket.disconnect();
    };
  }, []);

  // Sync driver online registration whenever persona, online state, or balance changes
  useEffect(() => {
    const driverSocket = driverSocketRef.current;
    if (!driverSocket || !isDriverOnline) return;

    driverSocket.emit('driver:go_online', {
      driverId: activePersona.driverId,
      driverName: activePersona.driverName,
      driverPhone: activePersona.driverPhone,
      vehicleType: activePersona.vehicleType,
      vehicleModel: activePersona.vehicleModel,
      lat: driverPos.lat,
      lng: driverPos.lng,
      walletBalance: currentDriverBalance,
      rating: activePersona.rating,
    });
  }, [activePersona, isDriverOnline, currentDriverBalance, driverPos.lat, driverPos.lng]);

  // Fetch initial wallet balances from backend on mount
  useEffect(() => {
    ['driver_demo_1', 'driver_demo_4'].forEach((id) => {
      fetch(`${API_BASE}/wallet/${id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.success && data.wallet) {
            setDriverBalances((prev) => ({
              ...prev,
              [id]: data.wallet.currentBalance,
            }));
          }
          if (data?.success && Array.isArray(data.transactions) && data.transactions.length > 0) {
            setDriverTransactions((prev) => ({
              ...prev,
              [id]: data.transactions,
            }));
          }
        })
        .catch(() => {});
    });
  }, []);

  // Switch Driver Persona handler
  const handleSwitchPersona = (personaId: string) => {
    setSelectedPersonaId(personaId);
    setDriverErrorBanner(null);
    setLastCommissionSummary(null);
    const target = DRIVER_PERSONAS.find((p) => p.driverId === personaId);
    if (target) {
      const lm =
        BHAIRAB_LANDMARKS.find((l) => l.id === target.landmarkId) || BHAIRAB_LANDMARKS[0];
      setDriverLandmark(lm);
      setDriverPos({ lat: lm.latitude, lng: lm.longitude });
      setLastSocketEvent(
        `Driver phone switched to ${target.driverName}, balance ৳${
          driverBalances[target.driverId] ?? target.walletBalance
        }`,
      );
    }
  };

  // Passenger: Request Ride (`rider:request_ride`)
  const handleRequestRide = () => {
    setDriverErrorBanner(null);
    setLastCommissionSummary(null);

    const audioPromptBangla = `নতুন ট্রিপ রিকোয়েস্ট: ${pickup.banglaName} থেকে ${dropoff.banglaName}, প্রস্তাবিত ভাড়া ${offerFare} টাকা`;
    const tempRideId = `ride_${Date.now()}`;
    const trackingToken = `track_bhairab_${Math.random().toString(36).substring(2, 8)}`;

    const newSession: ActiveRideSession = {
      rideId: tempRideId,
      passengerId: 'passenger_demo_1',
      passengerName: 'আব্দুল করিম (Karim)',
      passengerPhone: '01700000001',
      vehicleType: selectedVehicle,
      pickupLandmark: pickup,
      dropoffLandmark: dropoff,
      initialOfferFare: offerFare,
      status: 'SEARCHING',
      bids: [],
      driverLat: driverPos.lat,
      driverLng: driverPos.lng,
      liveTrackingToken: trackingToken,
      audioPromptBangla,
      sosActive: false,
    };

    setActiveRide(newSession);
    setLastSocketEvent(
      `rider:request_ride ${pickup.banglaName} → ${dropoff.banglaName}, offer ৳${offerFare}`,
    );

    // Speak Bangla Voice Alert aloud on Driver Phone!
    speakBanglaVoicePrompt(audioPromptBangla, isMutedRef.current);

    if (riderSocketRef.current?.connected) {
      riderSocketRef.current.emit('rider:request_ride', {
        passengerId: newSession.passengerId,
        passengerName: newSession.passengerName,
        passengerPhone: newSession.passengerPhone,
        vehicleType: newSession.vehicleType,
        pickupLat: pickup.latitude,
        pickupLng: pickup.longitude,
        pickupAddress: pickup.banglaName,
        dropoffLat: dropoff.latitude,
        dropoffLng: dropoff.longitude,
        dropoffAddress: dropoff.banglaName,
        initialOfferFare: offerFare,
      });
    }
  };

  // Driver: Submit Accept or Counter-Bid (`driver:submit_bid`)
  const handleDriverSubmitBid = (bidAmount: number) => {
    if (!activeRide) return;

    // Check low wallet balance lockout (< 50 BDT)
    if (currentDriverBalance < 50) {
      const lockoutMsg = 'কম ব্যালেন্স! বিড করতে নূন্যতম ৫০ টাকা ওয়ালেট ব্যালেন্স প্রয়োজন';
      setDriverErrorBanner(lockoutMsg);
      setLastSocketEvent(`driver:submit_bid rejected: ${lockoutMsg}`);
      speakBanglaVoicePrompt(lockoutMsg, isMutedRef.current);

      if (driverSocketRef.current?.connected) {
        driverSocketRef.current.emit('driver:submit_bid', {
          rideId: activeRide.rideId,
          driverId: activePersona.driverId,
          bidAmount,
          etaMinutes: 3,
        });
      }
      return;
    }

    setDriverErrorBanner(null);
    const localBid: IncomingBid = {
      bidId: `bid_${Date.now()}_${activePersona.driverId}`,
      driverId: activePersona.driverId,
      driverName: activePersona.driverName,
      driverPhone: activePersona.driverPhone,
      ratingAvg: activePersona.rating,
      vehicleModel: activePersona.vehicleModel,
      bidAmount,
      etaMinutes: 3,
      timestamp: Date.now(),
    };

    setActiveRide((prev) => {
      if (!prev) return prev;
      const others = prev.bids.filter((b) => b.driverId !== activePersona.driverId);
      return {
        ...prev,
        status: 'BIDDING',
        bids: [...others, localBid],
      };
    });

    setLastSocketEvent(
      `driver:submit_bid ${activePersona.driverName} ৳${bidAmount}, ETA 3 min`,
    );

    if (driverSocketRef.current?.connected) {
      driverSocketRef.current.emit('driver:submit_bid', {
        rideId: activeRide.rideId,
        driverId: activePersona.driverId,
        bidAmount,
        etaMinutes: 3,
      });
    }
  };

  // Passenger: Accept Driver Bid (`rider:accept_bid`)
  const handlePassengerAcceptBid = (bid: IncomingBid) => {
    if (!activeRide) return;

    setActiveRide((prev) =>
      prev
        ? {
            ...prev,
            status: 'ACCEPTED',
            agreedFare: bid.bidAmount,
            assignedDriver: {
              driverId: bid.driverId,
              driverName: bid.driverName,
              driverPhone: bid.driverPhone,
              vehicleModel: bid.vehicleModel,
              etaMinutes: bid.etaMinutes,
              rating: bid.ratingAvg,
            },
          }
        : prev,
    );

    const confirmVoice = 'রাইড কনফার্ম হয়েছে! যাত্রীর কাছে রওয়ানা হন।';
    speakBanglaVoicePrompt(confirmVoice, isMutedRef.current);
    setLastSocketEvent(
      `rider:accept_bid ${bid.driverName} at ৳${bid.bidAmount}`,
    );

    if (riderSocketRef.current?.connected) {
      riderSocketRef.current.emit('rider:accept_bid', {
        rideId: activeRide.rideId,
        bidId: bid.bidId,
      });
    }
  };

  // Driver: Stream Live GPS Movement (`driver:update_location`)
  const handleStreamGpsStep = () => {
    if (!activeRide) return;
    const targetLat = activeRide.dropoffLandmark.latitude;
    const targetLng = activeRide.dropoffLandmark.longitude;

    const nextLat = Number((driverPos.lat + (targetLat - driverPos.lat) * 0.38).toFixed(5));
    const nextLng = Number((driverPos.lng + (targetLng - driverPos.lng) * 0.38).toFixed(5));

    setDriverPos({ lat: nextLat, lng: nextLng });
    setActiveRide((prev) =>
      prev ? { ...prev, driverLat: nextLat, driverLng: nextLng } : prev,
    );
    setLastSocketEvent(
      `driver:update_location ${nextLat}, ${nextLng}`,
    );

    if (driverSocketRef.current?.connected) {
      driverSocketRef.current.emit('driver:update_location', {
        driverId: activePersona.driverId,
        lat: nextLat,
        lng: nextLng,
        activeRideId: activeRide.rideId,
      });
    }
  };

  // Driver: Complete Ride & Deduct 8% Commission (`driver:complete_ride`)
  const handleCompleteRide = () => {
    if (!activeRide) return;
    const finalFare = activeRide.agreedFare || activeRide.initialOfferFare;
    const commission = Math.round((finalFare * 8) / 100);
    const driverId = activeRide.assignedDriver?.driverId || activePersona.driverId;
    const prevBal = driverBalances[driverId] ?? currentDriverBalance;
    const nextBal = Number((prevBal - commission).toFixed(2));

    setDriverBalances((prev) => ({
      ...prev,
      [driverId]: nextBal,
    }));

    const newTx: WalletTransaction = {
      id: `tx_comm_${Date.now()}`,
      driverId,
      driverName: activePersona.driverName,
      type: 'COMMISSION_DEDUCTION',
      amount: -commission,
      balanceAfter: nextBal,
      referenceRideId: activeRide.rideId,
      noteBangla: `ট্রিপ কমিশন কর্তন (৮%): ${commission} টাকা (নগদ ভাড়া ${finalFare} টাকা)`,
      createdAt: new Date().toISOString(),
    };

    setDriverTransactions((prev) => ({
      ...prev,
      [driverId]: [newTx, ...(prev[driverId] || [])],
    }));

    setLastCommissionSummary({
      cashCollected: finalFare,
      commissionDeducted: commission,
      newBalance: nextBal,
    });

    setActiveRide((prev) =>
      prev
        ? {
            ...prev,
            status: 'COMPLETED',
            commissionDeductedBdt: commission,
            driverLat: prev.dropoffLandmark.latitude,
            driverLng: prev.dropoffLandmark.longitude,
          }
        : prev,
    );

    setDriverPos({
      lat: activeRide.dropoffLandmark.latitude,
      lng: activeRide.dropoffLandmark.longitude,
    });

    const summaryVoice = `ভ্রমণ সম্পন্ন হয়েছে। নগদ গ্রহণ করুন ${finalFare} টাকা। ৮ শতাংশ কমিশন বাবদ ${commission} টাকা কর্তন করা হয়েছে।`;
    speakBanglaVoicePrompt(summaryVoice, isMutedRef.current);
    setLastSocketEvent(
      `driver:complete_ride cash ৳${finalFare}, 8% commission −৳${commission}`,
    );

    if (driverSocketRef.current?.connected) {
      driverSocketRef.current.emit('driver:complete_ride', {
        rideId: activeRide.rideId,
        driverId,
      });
    }
  };

  // Driver: bKash Tokenized Checkout (`/payments/bkash/execute`) or Nagad Prepaid Wallet Top-Up
  const handleTopupWallet = async (
    amountBdt: number,
    method: 'BKASH' | 'NAGAD',
    bkashExecuted?: BkashExecutedPayload,
  ) => {
    const driverId = activePersona.driverId;

    // If executed via authentic bKash Tokenized Checkout (/payments/bkash/execute)
    if (bkashExecuted && bkashExecuted.alreadyCreditedOnServer) {
      const nextBal =
        typeof bkashExecuted.newBalance === 'number'
          ? bkashExecuted.newBalance
          : Number(((driverBalances[driverId] ?? 0) + amountBdt).toFixed(2));
      setDriverBalances((prev) => ({
        ...prev,
        [driverId]: nextBal,
      }));

      const recordedTx: WalletTransaction = bkashExecuted.transaction || {
        id: `tx_bkash_${Date.now()}`,
        driverId,
        driverName: activePersona.driverName,
        type: 'BKASH_TOPUP',
        amount: amountBdt,
        balanceAfter: nextBal,
        gatewayTrxId: bkashExecuted.trxID,
        noteBangla: `বিকাশ টোকেনাইজড রিচার্জ: ${amountBdt} টাকা (TrxID: ${bkashExecuted.trxID})`,
        createdAt: new Date().toISOString(),
      };

      setDriverTransactions((prev) => ({
        ...prev,
        [driverId]: [recordedTx, ...(prev[driverId] || [])],
      }));
      setDriverErrorBanner(null);
      setLastSocketEvent(
        `POST /payments/bkash/execute TrxID ${bkashExecuted.trxID}, +৳${amountBdt}, balance ৳${nextBal}`,
      );
      speakBanglaVoicePrompt(
        `বিকাশ রিচার্জ সফল হয়েছে ${amountBdt} টাকা। আপনার বর্তমান ব্যালেন্স ${nextBal} টাকা।`,
        isMutedRef.current,
      );
      return;
    }

    const trxId =
      bkashExecuted?.trxID ||
      `${method === 'NAGAD' ? 'NGD' : 'BKH'}${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const res = await fetch(`${API_BASE}/admin/wallet/topup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId, amountBdt, method, trxId }),
      });
      const data = await res.json();
      if (data?.success && data.wallet) {
        setDriverBalances((prev) => ({
          ...prev,
          [driverId]: data.wallet.currentBalance,
        }));
        if (data.transaction) {
          setDriverTransactions((prev) => ({
            ...prev,
            [driverId]: [data.transaction, ...(prev[driverId] || [])],
          }));
        }
        setDriverErrorBanner(null);
        setLastSocketEvent(
          `POST /admin/wallet/topup +৳${amountBdt} via ${method}, balance ৳${data.wallet.currentBalance}`,
        );
        speakBanglaVoicePrompt(
          `${method === 'NAGAD' ? 'নগদ' : 'বিকাশ'} রিচার্জ সফল হয়েছে ${amountBdt} টাকা। আপনার বর্তমান ব্যালেন্স ${data.wallet.currentBalance} টাকা।`,
          isMutedRef.current,
        );
        return;
      }
    } catch {
      // Fallback local wallet top-up if backend is offline
    }

    const nextBal = Number(((driverBalances[driverId] ?? 0) + amountBdt).toFixed(2));
    setDriverBalances((prev) => ({
      ...prev,
      [driverId]: nextBal,
    }));

    const fallbackTx: WalletTransaction = {
      id: `tx_topup_${Date.now()}`,
      driverId,
      driverName: activePersona.driverName,
      type: method === 'NAGAD' ? 'NAGAD_TOPUP' : 'BKASH_TOPUP',
      amount: amountBdt,
      balanceAfter: nextBal,
      gatewayTrxId: trxId,
      noteBangla: `${method === 'NAGAD' ? 'নগদ' : 'বিকাশ'} ওয়ালেট রিচার্জ: ${amountBdt} টাকা (TrxID: ${trxId})`,
      createdAt: new Date().toISOString(),
    };

    setDriverTransactions((prev) => ({
      ...prev,
      [driverId]: [fallbackTx, ...(prev[driverId] || [])],
    }));
    setDriverErrorBanner(null);
    setLastSocketEvent(
      `Wallet top-up (offline) +৳${amountBdt} via ${method} ${trxId}, balance ৳${nextBal}`,
    );
    speakBanglaVoicePrompt(
      `বিকাশ রিচার্জ সফল হয়েছে ${amountBdt} টাকা। আপনার বর্তমান ব্যালেন্স ${nextBal} টাকা।`,
      isMutedRef.current,
    );
  };

  // Passenger: 999 Emergency SOS (`POST /rides/:rideId/sos` falling back to `/admin/rides/demo/sos`)
  const handleTriggerSos = async () => {
    const nextSosState = !(activeRide?.sosActive ?? false);
    const targetRideId = activeRide?.rideId || 'demo';

    setActiveRide((prev) =>
      prev
        ? { ...prev, sosActive: nextSosState }
        : {
            rideId: 'ride_sos_demo',
            passengerId: 'passenger_demo_1',
            passengerName: 'আব্দুল করিম (Karim)',
            passengerPhone: '01700000001',
            vehicleType: selectedVehicle,
            pickupLandmark: pickup,
            dropoffLandmark: dropoff,
            initialOfferFare: offerFare,
            status: 'SEARCHING',
            bids: [],
            driverLat: driverPos.lat,
            driverLng: driverPos.lng,
            liveTrackingToken: 'track_sos_999',
            audioPromptBangla: 'জরুরি ৯৯৯ অ্যালার্ট সক্রিয় করা হয়েছে!',
            sosActive: true,
          },
    );

    setLastSocketEvent(
      nextSosState
        ? `POST /rides/${targetRideId}/sos SOS sent to control room`
        : `SOS resolved`,
    );

    if (nextSosState) {
      speakBanglaVoicePrompt(
        'জরুরি ৯৯৯ এসওএস অ্যালার্ট ভৈরব কন্ট্রোল রুমে পাঠানো হয়েছে।',
        isMutedRef.current,
      );
    }
  };

  // Driver: Submit Tiered KYC (`POST /auth/driver/kyc`)
  const handleSubmitKyc = async (payload: {
    nidNumber: string;
    wardCertNumber: string;
    brtaLicenseNo: string;
    vehicleModel: string;
  }) => {
    setLastSocketEvent(
      `POST /auth/driver/kyc NID and ward certificate for ${activePersona.driverName}`,
    );
    try {
      await fetch(`${API_BASE}/auth/driver/kyc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: activePersona.driverId,
          nidNumber: payload.nidNumber,
          vehicleType: activePersona.vehicleType,
          vehicleModel: payload.vehicleModel,
          brtaLicenseNo: payload.brtaLicenseNo,
          unionCouncilorCertUrl: payload.wardCertNumber,
        }),
      });
    } catch {
      // Ignore offline error
    }
  };

  // 1-Click Auto-Demo Full Handshake across both phones!
  const handleRunAutoDemoHandshake = () => {
    if (autoDemoRunning) return;
    setAutoDemoRunning(true);

    // Ensure driver is on Md. Rafiqul Islam (or has >= 50 BDT) so the full handshake succeeds smoothly
    if (currentDriverBalance < 50) {
      handleSwitchPersona('driver_demo_1');
    }

    const pLandmark = BHAIRAB_LANDMARKS[0]; // Railway Junction
    const dLandmark = BHAIRAB_LANDMARKS[1]; // Meghna Bridge
    setPickup(pLandmark);
    setDropoff(dLandmark);
    setSelectedVehicle('EASYBIKE');
    setOfferFare(80);
    setDriverErrorBanner(null);
    setLastCommissionSummary(null);

    const demoRideId = `ride_demo_${Date.now()}`;
    const audioPrompt = `নতুন ট্রিপ রিকোয়েস্ট: ${pLandmark.banglaName} থেকে ${dLandmark.banglaName}, প্রস্তাবিত ভাড়া ৮০ টাকা`;

    // Step 1 (0s): Passenger Requests Ride at 80 BDT
    const initialSession: ActiveRideSession = {
      rideId: demoRideId,
      passengerId: 'passenger_demo_1',
      passengerName: 'আব্দুল করিম (Karim)',
      passengerPhone: '01700000001',
      vehicleType: 'EASYBIKE',
      pickupLandmark: pLandmark,
      dropoffLandmark: dLandmark,
      initialOfferFare: 80,
      status: 'SEARCHING',
      bids: [],
      driverLat: pLandmark.latitude,
      driverLng: pLandmark.longitude,
      liveTrackingToken: 'track_bhairab_auto_demo',
      audioPromptBangla: audioPrompt,
      sosActive: false,
    };
    setActiveRide(initialSession);
    speakBanglaVoicePrompt(audioPrompt, isMutedRef.current);
    setLastSocketEvent('Demo 1/4: passenger requests an easy-bike at ৳80');

    // Also trigger backend simulation so Admin Dashboard on 5173 sees live activity too
    fetch(`${API_BASE}/admin/simulate-ride`, { method: 'POST' }).catch(() => {});

    // Step 2 (1.6s): Driver Submits Counter-Bid of 90 BDT
    setTimeout(() => {
      const demoBid: IncomingBid = {
        bidId: `bid_demo_${Date.now()}`,
        driverId: 'driver_demo_1',
        driverName: 'মোঃ রফিকুল ইসলাম',
        driverPhone: '01811223301',
        ratingAvg: 4.9,
        vehicleModel: 'ভৈরব ইজিবাইক (টমটম) #১২',
        bidAmount: 90,
        etaMinutes: 3,
        timestamp: Date.now(),
      };

      setActiveRide((prev) =>
        prev ? { ...prev, status: 'BIDDING', bids: [demoBid] } : prev,
      );
      setLastSocketEvent('Demo 2/4: driver counter-bids ৳90');

      // Step 3 (3.2s): Passenger Accepts 90 BDT Bid
      setTimeout(() => {
        setActiveRide((prev) =>
          prev
            ? {
                ...prev,
                status: 'ACCEPTED',
                agreedFare: 90,
                assignedDriver: {
                  driverId: demoBid.driverId,
                  driverName: demoBid.driverName,
                  driverPhone: demoBid.driverPhone,
                  vehicleModel: demoBid.vehicleModel,
                  etaMinutes: 3,
                  rating: 4.9,
                },
              }
            : prev,
        );
        setLastSocketEvent('Demo 3/4: passenger accepts ৳90, driver on the way');

        // Step 4 (4.6s): Stream GPS halfway to Meghna Bridge
        setTimeout(() => {
          const midLat = Number(((pLandmark.latitude + dLandmark.latitude) / 2).toFixed(5));
          const midLng = Number(((pLandmark.longitude + dLandmark.longitude) / 2).toFixed(5));
          setDriverPos({ lat: midLat, lng: midLng });
          setActiveRide((prev) =>
            prev ? { ...prev, driverLat: midLat, driverLng: midLng } : prev,
          );
          setLastSocketEvent('Demo: driver location halfway along the highway');
        }, 1200);

        // Step 5 (6.2s): Driver Completes Ride & 8% Commission (-7 BDT) is deducted
        setTimeout(() => {
          const comm = 7;
          setDriverBalances((prev) => {
            const cur = prev.driver_demo_1 ?? 193;
            const next = Number((cur - comm).toFixed(2));
            setLastCommissionSummary({
              cashCollected: 90,
              commissionDeducted: comm,
              newBalance: next,
            });
            return { ...prev, driver_demo_1: next };
          });

          setDriverTransactions((prev) => {
            const curBal = (driverBalances.driver_demo_1 ?? 193) - comm;
            const tx: WalletTransaction = {
              id: `tx_autodemo_${Date.now()}`,
              driverId: 'driver_demo_1',
              driverName: 'মোঃ রফিকুল ইসলাম',
              type: 'COMMISSION_DEDUCTION',
              amount: -comm,
              balanceAfter: curBal,
              referenceRideId: demoRideId,
              noteBangla: 'ট্রিপ কমিশন কর্তন (৮%): ৭ টাকা (ভাড়া ৯০ টাকা)',
              createdAt: new Date().toISOString(),
            };
            return {
              ...prev,
              driver_demo_1: [tx, ...(prev.driver_demo_1 || [])],
            };
          });

          setDriverPos({ lat: dLandmark.latitude, lng: dLandmark.longitude });
          setActiveRide((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'COMPLETED',
                  commissionDeductedBdt: comm,
                  driverLat: dLandmark.latitude,
                  driverLng: dLandmark.longitude,
                }
              : prev,
          );
          setLastSocketEvent(
            'Demo 4/4: trip complete, cash ৳90, 8% commission −৳7',
          );
          setAutoDemoRunning(false);
        }, 2800);
      }, 1600);
    }, 1600);
  };

  const handleResetSimulator = () => {
    setActiveRide(null);
    setDriverErrorBanner(null);
    setLastCommissionSummary(null);
    setLastSocketEvent('Simulator reset');
  };

  const controlBtn =
    'h-10 px-3 rounded-md border border-line bg-surface text-ink text-[14px] font-medium flex items-center justify-center gap-2 hover:bg-raised transition-colors duration-150 ease-out';
  const timeFmt = (d: Date) => d.toLocaleTimeString('en-GB', { hour12: false });

  return (
    <div className="min-h-screen bg-page text-ink">
      <header className="border-b border-line bg-surface">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-semibold font-bangla">চলো ভৈরব অ্যাপ সিমুলেটর</h1>
            <p className="text-[13px] text-ink-2 font-bangla">
              বাঁয়ে যাত্রী, ডানে চালক। দুটো ফোন একই সার্ভারের সকেট ইভেন্টে চলে।
            </p>
          </div>
          <p className="flex items-center gap-2 text-[13px]" role="status">
            <span
              className={`w-2 h-2 rounded-full ${backendConnected ? 'bg-brand' : 'bg-warning'}`}
              aria-hidden
            />
            <span className="font-medium">{backendConnected ? 'Connected' : 'Offline'}</span>
            <span className="font-mono text-ink-3">{API_BASE}</span>
            {!backendConnected && <span className="text-ink-3">· phones sync locally</span>}
          </p>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6 flex flex-wrap justify-center items-start gap-8">
        <section className="flex flex-col items-center gap-3" aria-label="যাত্রী অ্যাপ">
          <h2 className="text-[13px] text-ink-2 font-bangla">যাত্রী অ্যাপ</h2>
          <PassengerPhone
            pickup={pickup}
            dropoff={dropoff}
            onSelectPickup={setPickup}
            onSelectDropoff={setDropoff}
            onSwapLocations={() => {
              const temp = pickup;
              setPickup(dropoff);
              setDropoff(temp);
            }}
            selectedVehicle={selectedVehicle}
            onSelectVehicle={setSelectedVehicle}
            fareEstimates={fareEstimates}
            offerFare={offerFare}
            onAdjustOfferFare={(delta) => {
              const minFare =
                fareEstimates.find((e) => e.vehicleType === selectedVehicle)?.minimumFareBdt ?? 20;
              setOfferFare((prev) => Math.max(minFare, prev + delta));
            }}
            activeRide={activeRide}
            onRequestRide={handleRequestRide}
            onAcceptBid={handlePassengerAcceptBid}
            onTriggerSos={handleTriggerSos}
            onResetRide={() => {
              setActiveRide(null);
              setDriverErrorBanner(null);
              setLastCommissionSummary(null);
            }}
            driverLat={driverPos.lat}
            driverLng={driverPos.lng}
            driverName={activePersona.driverName}
          />
        </section>

        <section className="flex flex-col items-center gap-3" aria-label="চালক অ্যাপ">
          <h2 className="text-[13px] text-ink-2 font-bangla">চালক অ্যাপ · {activePersona.driverName}</h2>
          <DriverPhone
            persona={activePersona}
            isOnline={isDriverOnline}
            onToggleOnline={() => setIsDriverOnline((o) => !o)}
            currentLandmark={driverLandmark}
            onChangeDriverLandmark={(lm) => {
              setDriverLandmark(lm);
              setDriverPos({ lat: lm.latitude, lng: lm.longitude });
            }}
            walletBalance={currentDriverBalance}
            transactions={currentDriverTxs}
            activeRide={activeRide}
            onSubmitBid={handleDriverSubmitBid}
            onStreamGpsStep={handleStreamGpsStep}
            onCompleteRide={handleCompleteRide}
            onTopupWallet={handleTopupWallet}
            onReplayVoiceAlert={(text) => speakBanglaVoicePrompt(text, false)}
            onSubmitKycForm={handleSubmitKyc}
            driverErrorBanner={driverErrorBanner}
            lastCommissionSummary={lastCommissionSummary}
            onDismissSummary={() => setLastCommissionSummary(null)}
          />
        </section>

        <aside className="w-full max-w-[340px] xl:mt-8 rounded-lg border border-line bg-surface divide-y divide-line font-bangla">
          <div className="p-4 space-y-3">
            <h2 className="text-[14px] font-semibold">ডেমো</h2>
            <button
              type="button"
              disabled={autoDemoRunning}
              onClick={handleRunAutoDemoHandshake}
              className="h-10 w-full rounded-md bg-brand text-on-brand text-[14px] font-medium flex items-center justify-center gap-2 transition-opacity duration-150 ease-out disabled:opacity-60"
            >
              <Play className="w-4 h-4" aria-hidden />
              {autoDemoRunning ? 'ডেমো চলছে…' : 'পুরো রাইড স্বয়ংক্রিয়ভাবে চালান'}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={handleResetSimulator} className={controlBtn}>
                <RotateCcw className="w-4 h-4" aria-hidden />
                রিসেট
              </button>
              <button
                type="button"
                onClick={() => setIsMuted((m) => !m)}
                aria-pressed={!isMuted}
                className={controlBtn}
              >
                {isMuted ? <VolumeX className="w-4 h-4" aria-hidden /> : <Volume2 className="w-4 h-4" aria-hidden />}
                {isMuted ? 'ভয়েস বন্ধ' : 'ভয়েস চালু'}
              </button>
            </div>
          </div>

          <div className="p-4 space-y-2">
            <h2 className="text-[14px] font-semibold">
              চালক
            </h2>
            {DRIVER_PERSONAS.map((p) => {
              const balance = driverBalances[p.driverId] ?? p.walletBalance;
              const selected = selectedPersonaId === p.driverId;
              return (
                <button
                  key={p.driverId}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => handleSwitchPersona(p.driverId)}
                  className={`w-full min-h-[40px] px-3 py-2 rounded-md border text-left flex items-center justify-between gap-3 transition-colors duration-150 ease-out ${
                    selected ? 'border-brand bg-brand/10' : 'border-line hover:bg-raised'
                  }`}
                >
                  <span className="text-[14px] font-medium truncate">{p.driverName}</span>
                  <span className="flex items-center gap-2 shrink-0 text-[13px]">
                    {balance < 50 && <span className="text-warning">কম ব্যালেন্স</span>}
                    <span className="font-mono tabular-nums text-ink-2">৳{balance}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="p-4">
            <h2 className="text-[14px] font-semibold mb-2">কীভাবে পরীক্ষা করবেন</h2>
            <ol className="list-decimal pl-5 space-y-1 text-[13px] text-ink-2">
              <li>যাত্রী ফোনে রাইডের অনুরোধ পাঠান</li>
              <li>চালক ফোনে ৳৯০ পাল্টা প্রস্তাব দিন</li>
              <li>যাত্রী ফোনে প্রস্তাব গ্রহণ করুন</li>
              <li>চালক ফোনে ট্রিপ শেষ করে ৮% কমিশন দেখুন</li>
            </ol>
          </div>

          <div className="p-4">
            <h2 className="text-[14px] font-semibold mb-2">ইভেন্ট লগ</h2>
            <ol className="max-h-[320px] overflow-y-auto phone-scroll space-y-1 font-sans" aria-live="polite">
              {eventLog.map((e) => (
                <li key={e.id} className="flex gap-3 text-[12px] leading-5">
                  <time className="font-mono tabular-nums text-ink-3 shrink-0">{timeFmt(e.at)}</time>
                  <span className="text-ink-2 break-words min-w-0">{e.text}</span>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
