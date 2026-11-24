import { Controller, Get, Post, Body, Param, NotFoundException, Header } from '@nestjs/common';
import { RidesService } from './rides.service';
import { RidesGateway } from './rides.gateway';
import { renderTrackingPage } from './tracking-page';

@Controller('rides')
export class RidesController {
  constructor(
    private readonly ridesService: RidesService,
    private readonly ridesGateway: RidesGateway,
  ) {}

  @Get(':id')
  getRideDetails(@Param('id') id: string) {
    const ride = this.ridesService.getRide(id);
    if (!ride) throw new NotFoundException('Ride not found');
    return { success: true, ride };
  }

  @Post(':id/sos')
  triggerPassengerSos(
    @Param('id') id: string,
    @Body() body?: { resolved?: boolean },
  ) {
    const ride = this.ridesService.triggerRideSos(id, body?.resolved);
    this.ridesGateway.broadcastAdminEvent('SOS_ALERT', {
      rideId: ride.id,
      ride,
      resolved: !ride.sosActive,
      messageBangla: ride.sosActive
        ? `🚨 জরুরি ৯৯৯ SOS অ্যালার্ট: যাত্রী ${ride.passengerName} (${ride.pickupAddress} → ${ride.dropoffAddress})`
        : `✓ ৯৯৯ SOS অ্যালার্ট সমাধান করা হয়েছে (${ride.passengerName})`,
    });
    return {
      success: true,
      ride,
    };
  }

  /** Public live-tracking page for the link passengers share with family. */
  @Get('live/:token')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getLiveTrackingPage(@Param('token') token: string) {
    const ride = this.ridesService.getRideByTrackingToken(token);
    if (!ride) throw new NotFoundException('Invalid or expired tracking link');
    return renderTrackingPage({
      status: ride.status,
      driverName: ride.selectedDriverName,
      vehicleModel: ride.selectedVehicleModel,
      pickupAddress: ride.pickupAddress,
      dropoffAddress: ride.dropoffAddress,
      fare: ride.finalAgreedFare,
      driverPosition: this.ridesService.getDriverPosition(ride.selectedDriverId),
    });
  }

  @Get('track/:token')
  getPublicTracking(@Param('token') token: string) {
    const ride = this.ridesService.getRideByTrackingToken(token);
    if (!ride) throw new NotFoundException('Invalid or expired tracking link');
    return {
      success: true,
      ride: {
        id: ride.id,
        vehicleType: ride.vehicleType,
        pickupAddress: ride.pickupAddress,
        dropoffAddress: ride.dropoffAddress,
        status: ride.status,
        finalAgreedFare: ride.finalAgreedFare,
      },
    };
  }
}
