import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { RidesModule } from '../rides/rides.module';
import { WalletModule } from '../wallet/wallet.module';
import { GeoModule } from '../geo/geo.module';

@Module({
  imports: [RidesModule, WalletModule, GeoModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
