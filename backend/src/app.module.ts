import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from './modules/admin/admin.module';
import { AuctionsModule } from './modules/auctions/auctions.module';
import { AuthModule } from './modules/auth/auth.module';
import { BidsModule } from './modules/bids/bids.module';
import { CarsModule } from './modules/cars/cars.module';
import { GadgetsModule } from './modules/gadgets/gadgets.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { HealthModule } from './modules/health/health.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { UsersModule } from './modules/users/users.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { validateEnv } from './config/env.validation';
import { buildBullConfig } from './config/bull.config';
import { buildTypeOrmConfig } from './config/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: buildTypeOrmConfig,
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: buildBullConfig,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    HealthModule,
    AuthModule,
    UsersModule,
    AdminModule,
    UploadsModule,
    CarsModule,
    GadgetsModule,
    AuctionsModule,
    BidsModule,
    WalletsModule,
    PaymentsModule,
    NotificationsModule,
    JobsModule,
    GatewayModule,
  ],
})
export class AppModule {}

