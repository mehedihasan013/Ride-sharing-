import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { RidesService } from './rides.service';

@Controller('rides')
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Get(':id')
  getRideDetails(@Param('id') id: string) {
    const ride = this.ridesService.getRide(id);
    if (!ride) throw new NotFoundException('Ride not found');
    return { success: true, ride };
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
