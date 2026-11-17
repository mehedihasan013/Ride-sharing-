import { Module } from '@nestjs/common';
import { WalletModule } from '../wallet/wallet.module';
import { RidesModule } from '../rides/rides.module';
import { BkashService } from './bkash.service';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [WalletModule, RidesModule],
  controllers: [PaymentsController],
  providers: [BkashService],
  exports: [BkashService],
})
export class PaymentsModule {}
