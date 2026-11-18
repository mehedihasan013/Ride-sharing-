import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { RidesService, OnlineDriver } from './rides.service';
import { WalletService } from '../wallet/wallet.service';
import { isAdminKeyValid } from '../../common/admin-key.guard';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim()) : '*',
  },
})
export class RidesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RidesGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly ridesService: RidesService,
    private readonly walletService: WalletService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Public helper to broadcast real-time telemetry events to all connected Web Admin clients
   */
  broadcastAdminEvent(type: string, payload: any) {
    if (!this.server) return;
    this.server.to('admin:dashboard').emit('admin:event', {
      type,
      payload,
      timestamp: Date.now(),
    });
  }

  /**
   * Web Admin & Dispatch Command Center subscribes to real-time fleet & ride feed
   */
  @SubscribeMessage('admin:subscribe')
  handleAdminSubscribe(@ConnectedSocket() client: Socket) {
    if (!isAdminKeyValid(client.handshake.auth?.adminKey)) {
      return { success: false, error: 'unauthorized' };
    }
    client.join('admin:dashboard');
    this.logger.log(`Admin dashboard subscribed: ${client.id}`);

    const snapshot = {
      onlineDrivers: this.ridesService.getAllOnlineDrivers(),
      activeRides: this.ridesService.getAllRides(),
      wallets: this.walletService.getAllWallets(),
      timestamp: Date.now(),
    };

    client.emit('admin:snapshot', snapshot);
    return { success: true };
  }

  /**
   * Driver comes ONLINE with vehicle type and initial GPS coordinates
   */
  @SubscribeMessage('driver:go_online')
  handleDriverOnline(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      driverId: string;
      driverName: string;
      driverPhone: string;
      vehicleType: 'BIKE' | 'CNG' | 'EASYBIKE' | 'CAR_MICROBUS';
      vehicleModel: string;
      lat: number;
      lng: number;
      walletBalance: number;
      rating?: number;
    },
  ) {
    client.join(`driver:${data.driverId}`);
    client.join(`vehicle:${data.vehicleType}`);

    const driver: OnlineDriver = {
      driverId: data.driverId,
      socketId: client.id,
      vehicleType: data.vehicleType,
      lat: data.lat,
      lng: data.lng,
      walletBalance: data.walletBalance,
      rating: data.rating || 5.0,
      driverName: data.driverName,
      driverPhone: data.driverPhone,
      vehicleModel: data.vehicleModel,
    };

    this.ridesService.registerOnlineDriver(driver);

    client.emit('driver:online_confirmed', {
      success: true,
      messageBangla: 'আপনি অনলাইন আছেন। নতুন ট্রিপের জন্য অপেক্ষা করুন।',
    });

    this.broadcastAdminEvent('DRIVER_ONLINE', {
      driver,
      messageBangla: `${driver.driverName} (${driver.vehicleType}) অনলাইনে যুক্ত হয়েছেন`,
    });
  }

  /**
   * Driver updates GPS location periodically
   */
  @SubscribeMessage('driver:update_location')
  handleDriverLocation(
    @MessageBody()
    data: {
      driverId: string;
      lat: number;
      lng: number;
      activeRideId?: string;
    },
  ) {
    this.ridesService.updateDriverLocation(data.driverId, data.lat, data.lng);

    // If driver is on an active trip, stream directly to passenger room
    if (data.activeRideId) {
      this.server.to(`ride:${data.activeRideId}`).emit('ride:driver_location', {
        lat: data.lat,
        lng: data.lng,
        timestamp: Date.now(),
      });
    }

    this.broadcastAdminEvent('DRIVER_LOCATION', {
      driverId: data.driverId,
      lat: data.lat,
      lng: data.lng,
      activeRideId: data.activeRideId,
    });
  }

  /**
   * Passenger requests a ride with initial offer price
   */
  @SubscribeMessage('rider:request_ride')
  handleRideRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      passengerId: string;
      passengerName: string;
      passengerPhone: string;
      vehicleType: 'BIKE' | 'CNG' | 'EASYBIKE' | 'CAR_MICROBUS';
      pickupLat: number;
      pickupLng: number;
      pickupAddress: string;
      dropoffLat: number;
      dropoffLng: number;
      dropoffAddress: string;
      initialOfferFare: number;
    },
  ) {
    const ride = this.ridesService.createRideRequest(data);
    client.join(`ride:${ride.id}`);

    // Notify passenger that search has started
    client.emit('ride:created', {
      rideId: ride.id,
      status: ride.status,
      initialOfferFare: ride.initialOfferFare,
      liveTrackingToken: ride.liveTrackingToken,
    });

    // Find nearby eligible drivers in Bhairab
    const nearbyDrivers = this.ridesService.getNearbyDriversForRide(ride);
    this.logger.log(
      `Broadcasting ride ${ride.id} to ${nearbyDrivers.length} nearby ${ride.vehicleType} drivers`,
    );

    const audioPromptBangla =
      ride.audioPromptBangla ||
      `নতুন ট্রিপ রিকোয়েস্ট: ${ride.pickupAddress} থেকে ${ride.dropoffAddress}, প্রস্তাবিত ভাড়া ${ride.initialOfferFare} টাকা`;

    // Broadcast to eligible drivers
    for (const driver of nearbyDrivers) {
      this.server.to(`driver:${driver.driverId}`).emit('driver:ride_opportunity', {
        rideId: ride.id,
        passengerName: ride.passengerName,
        pickupAddress: ride.pickupAddress,
        pickupLat: ride.pickupLat,
        pickupLng: ride.pickupLng,
        dropoffAddress: ride.dropoffAddress,
        initialOfferFare: ride.initialOfferFare,
        audioPromptBangla,
        expiresInSeconds: 60,
      });
    }

    this.broadcastAdminEvent('RIDE_REQUESTED', {
      ride,
      audioPromptBangla,
      nearbyDriversCount: nearbyDrivers.length,
      messageBangla: audioPromptBangla,
    });
  }

  /**
   * Driver submits an accept or counter-bid
   */
  @SubscribeMessage('driver:submit_bid')
  handleDriverBid(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      rideId: string;
      driverId: string;
      bidAmount: number;
      etaMinutes: number;
    },
  ) {
    try {
      const bid = this.ridesService.submitDriverBid(data);
      const ride = this.ridesService.getRide(data.rideId);

      // Notify passenger of the new bid
      this.server.to(`ride:${data.rideId}`).emit('ride:new_bid', {
        bidId: bid.id,
        driverId: bid.driverId,
        driverName: bid.driverName,
        driverPhone: bid.driverPhone,
        ratingAvg: bid.ratingAvg,
        vehicleModel: bid.vehicleModel,
        bidAmount: bid.bidAmount,
        etaMinutes: bid.etaMinutes,
      });

      client.emit('driver:bid_submitted', { success: true, bidId: bid.id });

      this.broadcastAdminEvent('NEW_BID', {
        rideId: data.rideId,
        bid,
        ride,
        messageBangla: `${bid.driverName} পাল্টা বিড করেছেন: ${bid.bidAmount} টাকা (ETA: ${bid.etaMinutes} মিনিট)`,
      });
    } catch (err: any) {
      client.emit('driver:error', { message: err.message });
    }
  }

  /**
   * Passenger selects and accepts a specific driver bid
   */
  @SubscribeMessage('rider:accept_bid')
  handleAcceptBid(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { rideId: string; bidId: string },
  ) {
    try {
      const { ride, acceptedBid } = this.ridesService.acceptBid(data.rideId, data.bidId);

      // Notify winning driver
      this.server.to(`driver:${acceptedBid.driverId}`).emit('driver:bid_won', {
        rideId: ride.id,
        passengerName: ride.passengerName,
        passengerPhone: ride.passengerPhone,
        pickupAddress: ride.pickupAddress,
        pickupLat: ride.pickupLat,
        pickupLng: ride.pickupLng,
        dropoffAddress: ride.dropoffAddress,
        agreedFare: acceptedBid.bidAmount,
        messageBangla: 'রাইড কনফার্ম হয়েছে! যাত্রীর কাছে রওয়ানা হন।',
      });

      // Confirm to passenger
      this.server.to(`ride:${ride.id}`).emit('ride:driver_assigned', {
        rideId: ride.id,
        driverId: acceptedBid.driverId,
        driverName: acceptedBid.driverName,
        driverPhone: acceptedBid.driverPhone,
        vehicleModel: acceptedBid.vehicleModel,
        agreedFare: acceptedBid.bidAmount,
        etaMinutes: acceptedBid.etaMinutes,
      });

      this.broadcastAdminEvent('BID_ACCEPTED', {
        rideId: ride.id,
        ride,
        acceptedBid,
        messageBangla: `রাইড নিশ্চিত হয়েছে: ${acceptedBid.driverName} (${acceptedBid.bidAmount} টাকা)`,
      });
    } catch (err: any) {
      client.emit('rider:error', { message: err.message });
    }
  }

  /**
   * Driver marks ride completed at drop-off
   */
  @SubscribeMessage('driver:complete_ride')
  async handleCompleteRide(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { rideId: string; driverId: string },
  ) {
    try {
      const { ride, commissionDeducted } = await this.ridesService.completeRide(data.rideId);

      // Notify both parties
      this.server.to(`ride:${ride.id}`).emit('ride:completed', {
        rideId: ride.id,
        totalFare: ride.finalAgreedFare,
        messageBangla: 'ভ্রমণ সম্পন্ন হয়েছে। চলো ভৈরব সাথে থাকার জন্য ধন্যবাদ!',
      });

      client.emit('driver:ride_summary', {
        rideId: ride.id,
        cashCollected: ride.finalAgreedFare,
        commissionDeductedBdt: commissionDeducted,
        messageBangla: `নগদ গ্রহণ করুন: ${ride.finalAgreedFare} টাকা (৮% কমিশন কর্তন: ${commissionDeducted} টাকা)`,
      });

      this.broadcastAdminEvent('RIDE_COMPLETED', {
        rideId: ride.id,
        ride,
        commissionDeducted,
        messageBangla: `ট্রিপ সম্পন্ন! নগদ ভাড়া: ${ride.finalAgreedFare} টাকা | ৮% কমিশন কর্তন: ${commissionDeducted} টাকা`,
      });
    } catch (err: any) {
      client.emit('driver:error', { message: err.message });
    }
  }

  /**
   * Emergency 999 SOS triggered via Socket
   */
  @SubscribeMessage('ride:sos')
  handleRideSos(@MessageBody() data: { rideId: string; resolved?: boolean }) {
    const ride = this.ridesService.triggerRideSos(data.rideId || 'demo', data.resolved);
    this.broadcastAdminEvent('SOS_ALERT', {
      rideId: ride.id,
      ride,
      resolved: !ride.sosActive,
      messageBangla: ride.sosActive
        ? `🚨 জরুরি ৯৯৯ SOS অ্যালার্ট: ${ride.passengerName} (${ride.pickupAddress})`
        : `✓ SOS অ্যালার্ট সমাধান করা হয়েছে (${ride.id})`,
    });
    return { success: true, ride };
  }
}
