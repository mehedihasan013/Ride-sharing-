import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { GeoModule } from './modules/geo/geo.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { RidesModule } from './modules/rides/rides.module';
import { AdminModule } from './modules/admin/admin.module';
import { PaymentsModule } from './modules/payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    GeoModule,
    WalletModule,
    RidesModule,
    AdminModule,
    PaymentsModule,
  ],
})
export class AppModule {}
