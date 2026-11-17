import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/request')
  async requestOtp(@Body('phoneNumber') phoneNumber: string) {
    return this.authService.requestOtp(phoneNumber);
  }

  @Post('otp/verify')
  async verifyOtp(
    @Body('phoneNumber') phoneNumber: string,
    @Body('otp') otp: string,
    @Body('role') role?: 'PASSENGER' | 'DRIVER',
    @Body('fullName') fullName?: string,
  ) {
    const session = await this.authService.verifyOtp(
      phoneNumber,
      otp,
      role || 'PASSENGER',
      fullName,
    );
    return {
      success: true,
      session,
    };
  }

  @Post('driver/kyc')
  async submitKyc(
    @Body()
    body: {
      driverId: string;
      nidNumber: string;
      vehicleType: 'BIKE' | 'CNG' | 'EASYBIKE' | 'CAR_MICROBUS';
      vehicleModel: string;
      brtaLicenseNo?: string;
      unionCouncilorCertUrl?: string;
    },
  ) {
    return this.authService.submitDriverKyc(body.driverId, body);
  }
}
