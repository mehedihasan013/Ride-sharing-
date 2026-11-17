import { Controller, Get, Query } from '@nestjs/common';
import { GeoService } from './geo.service';

@Controller('geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Get('landmarks')
  getLandmarks(@Query('q') query?: string) {
    return {
      success: true,
      landmarks: this.geoService.searchLandmarks(query || ''),
    };
  }

  @Get('fares/estimate')
  estimateFare(
    @Query('pickupLat') pickupLat: string,
    @Query('pickupLng') pickupLng: string,
    @Query('dropoffLat') dropoffLat: string,
    @Query('dropoffLng') dropoffLng: string,
  ) {
    const estimates = this.geoService.calculateSuggestedFares(
      parseFloat(pickupLat),
      parseFloat(pickupLng),
      parseFloat(dropoffLat),
      parseFloat(dropoffLng),
    );
    return {
      success: true,
      estimates,
    };
  }

  @Get('reverse')
  async reverseGeocode(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    const address = await this.geoService.reverseGeocodeBarikoi(
      parseFloat(lat),
      parseFloat(lng),
    );
    return {
      success: true,
      address,
    };
  }
}
