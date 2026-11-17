import { Injectable, Logger } from '@nestjs/common';
import { BHAIRAB_LANDMARKS, BhairabLandmarkData } from './bhairab-landmarks';
import axios from 'axios';

export interface BaseFareEstimate {
  vehicleType: 'BIKE' | 'CNG' | 'EASYBIKE' | 'CAR_MICROBUS';
  distanceKm: number;
  estimatedMinutes: number;
  suggestedFareBdt: number;
  minimumFareBdt: number;
}

@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);
  private readonly barikoiApiKey = process.env.BARIKOI_API_KEY;

  /**
   * Search local landmarks in Bhairab by Bengali or English queries
   */
  searchLandmarks(query: string): BhairabLandmarkData[] {
    if (!query || query.trim() === '') {
      return BHAIRAB_LANDMARKS;
    }
    const q = query.toLowerCase().trim();
    return BHAIRAB_LANDMARKS.filter(
      (l) =>
        l.englishName.toLowerCase().includes(q) ||
        l.banglaName.includes(q) ||
        l.category.toLowerCase().includes(q),
    );
  }

  /**
   * Calculate distance between two coordinates in Kilometers (Haversine Formula)
   */
  calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Suggest realistic baseline fare in BDT for Bhairab local routes
   */
  calculateSuggestedFares(
    pickupLat: number,
    pickupLng: number,
    dropoffLat: number,
    dropoffLng: number,
  ): BaseFareEstimate[] {
    const distanceKm = Math.max(
      0.8,
      this.calculateDistanceKm(pickupLat, pickupLng, dropoffLat, dropoffLng),
    );
    const estimatedMinutes = Math.round(distanceKm * 3.5); // Average town speed ~17 km/h

    return [
      {
        vehicleType: 'EASYBIKE',
        distanceKm,
        estimatedMinutes,
        minimumFareBdt: 20,
        suggestedFareBdt: Math.round(Math.max(20, 15 + distanceKm * 18)),
      },
      {
        vehicleType: 'BIKE',
        distanceKm,
        estimatedMinutes: Math.round(distanceKm * 2.5),
        minimumFareBdt: 30,
        suggestedFareBdt: Math.round(Math.max(30, 25 + distanceKm * 22)),
      },
      {
        vehicleType: 'CNG',
        distanceKm,
        estimatedMinutes,
        minimumFareBdt: 40,
        suggestedFareBdt: Math.round(Math.max(40, 35 + distanceKm * 30)),
      },
      {
        vehicleType: 'CAR_MICROBUS',
        distanceKm,
        estimatedMinutes,
        minimumFareBdt: 250,
        suggestedFareBdt: Math.round(Math.max(250, 200 + distanceKm * 50)),
      },
    ];
  }

  /**
   * Reverse Geocode using Barikoi API (Bangladesh specialized)
   */
  async reverseGeocodeBarikoi(lat: number, lon: number): Promise<string> {
    if (!this.barikoiApiKey || this.barikoiApiKey.includes('your_')) {
      // Fallback nearest landmark
      return this.findClosestLandmark(lat, lon);
    }

    try {
      const response = await axios.get(
        `https://barikoi.openapi.bd/v1/api/search/reverse/geocode`,
        {
          params: {
            api_key: this.barikoiApiKey,
            latitude: lat,
            longitude: lon,
            district: 'true',
            post_code: 'true',
          },
          timeout: 4000,
        },
      );
      if (response.data && response.data.place) {
        return response.data.place.address || response.data.place.name;
      }
    } catch (err) {
      this.logger.warn(`Barikoi reverse geocode failed, using landmark fallback`);
    }

    return this.findClosestLandmark(lat, lon);
  }

  private findClosestLandmark(lat: number, lon: number): string {
    let closest = BHAIRAB_LANDMARKS[0];
    let minDistance = Infinity;

    for (const l of BHAIRAB_LANDMARKS) {
      const d = this.calculateDistanceKm(lat, lon, l.latitude, l.longitude);
      if (d < minDistance) {
        minDistance = d;
        closest = l;
      }
    }

    if (minDistance < 0.5) {
      return `${closest.banglaName} এর নিকটে`;
    }
    return `${closest.banglaName} থেকে প্রায় ${minDistance} কিমি`;
  }
}
