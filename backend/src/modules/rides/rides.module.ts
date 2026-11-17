import { Module } from '@nestjs/common';
import { RidesGateway } from './rides.gateway';
import { RidesService } from './rides.service';
import { RidesController } from './rides.controller';
import { GeoModule } from '../geo/geo.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [GeoModule, WalletModule],
  controllers: [RidesController],
  providers: [RidesGateway, RidesService],
  exports: [RidesService, RidesGateway],
})
export class RidesModule {}
