import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StrowalletProvider } from '../payments/providers/strowallet.provider';
import { User } from '../users/entities/user.entity';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [KycController],
  providers: [KycService, StrowalletProvider],
  exports: [KycService],
})
export class KycModule {}
