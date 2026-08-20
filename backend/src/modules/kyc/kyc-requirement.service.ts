import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { KycProfile } from './entities/kyc-profile.entity';

@Injectable()
export class KycRequirementService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(KycProfile)
    private readonly profiles: Repository<KycProfile>,
  ) {}

  async assertCanBid(userId: string) {
    const { user, profile } = await this.getIdentity(userId);
    if (!user?.ninVerifiedAt || !profile?.bvnVerifiedAt) {
      throw new BadRequestException(
        'Complete NIN and BVN verification before placing a bid',
      );
    }
  }

  async assertCanWithdraw(userId: string) {
    const { user, profile } = await this.getIdentity(userId);
    if (
      !user?.ninVerifiedAt ||
      !profile?.bvnVerifiedAt ||
      !profile.strowalletSubaccountId
    ) {
      throw new BadRequestException(
        'Complete KYC and payment account setup before withdrawing',
      );
    }
  }

  private async getIdentity(userId: string) {
    const [user, profile] = await Promise.all([
      this.users.findOneBy({ id: userId }),
      this.profiles.findOneBy({ userId }),
    ]);
    return { user, profile };
  }
}
