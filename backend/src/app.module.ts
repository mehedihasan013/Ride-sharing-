import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { GeoModule } from './modules/geo/geo.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { RidesModule } from './modules/rides/rides.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    GeoModule,
    WalletModule,
    RidesModule,
    AdminModule,
  ],
})
export class AppModule {}
