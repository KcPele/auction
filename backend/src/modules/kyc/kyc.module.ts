import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StrowalletProvider } from '../payments/providers/strowallet.provider';
import { User } from '../users/entities/user.entity';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { KycProfile } from './entities/kyc-profile.entity';
import { KycRequirementService } from './kyc-requirement.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, KycProfile])],
  controllers: [KycController],
  providers: [KycService, KycRequirementService, StrowalletProvider],
  exports: [KycService, KycRequirementService],
})
export class KycModule {}
