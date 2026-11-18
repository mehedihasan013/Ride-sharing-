import { Controller, Get, Post, Param, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminKeyGuard } from '../../common/admin-key.guard';
import { isDemoMode } from '../../common/demo';

const assertNotProduction = () => {
  if (process.env.NODE_ENV === 'production' && !isDemoMode()) {
    throw new ForbiddenException('Disabled in production');
  }
};

@UseGuards(AdminKeyGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  getOverview() {
    return this.adminService.getOverview();
  }

  @Get('kyc')
  getKycApplications() {
    return this.adminService.getKycApplications();
  }

  @Post('kyc/:id/status')
  updateKycStatus(
    @Param('id') id: string,
    @Body()
    body: {
      status: 'APPROVED' | 'SUSPENDED' | 'PENDING_VERIFICATION';
      note?: string;
    },
  ) {
    return this.adminService.updateKycStatus(id, body.status, body.note);
  }

  @Post('wallet/topup')
  async topupWallet(
    @Body()
    body: {
      driverId: string;
      amountBdt: number;
      method?: 'BKASH' | 'NAGAD' | 'ADMIN_MANUAL';
      trxId?: string;
    },
  ) {
    return this.adminService.topupDriverWallet(body);
  }

  @Post('simulate-ride')
  simulateRide() {
    assertNotProduction();
    return this.adminService.simulateLiveBhairabRide();
  }

  @Post('rides/:rideId/sos')
  triggerSos(
    @Param('rideId') rideId: string,
    @Body() body?: { resolved?: boolean },
  ) {
    return this.adminService.triggerSos(rideId, body?.resolved);
  }

  @Post('reset-seed')
  resetSeed() {
    assertNotProduction();
    return this.adminService.resetSeedState();
  }
}
