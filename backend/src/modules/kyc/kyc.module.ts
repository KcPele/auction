import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StrowalletProvider } from '../payments/providers/strowallet.provider';
import { User } from '../users/entities/user.entity';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { KycProfile } from './entities/kyc-profile.entity';
import { KycRequirementService } from './kyc-requirement.service';
import { AuthUserSyncService } from '../../common/services/auth-user-sync.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, KycProfile])],
  controllers: [KycController],
  providers: [
    KycService,
    KycRequirementService,
    StrowalletProvider,
    AuthUserSyncService,
  ],
  exports: [KycService, KycRequirementService],
})
export class KycModule {}
