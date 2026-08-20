import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac } from 'crypto';
import { Repository } from 'typeorm';
import { StrowalletProvider } from '../payments/providers/strowallet.provider';
import { User } from '../users/entities/user.entity';
import { ConfirmBvnDto } from './dto/confirm-bvn.dto';
import { CreateSubaccountDto } from './dto/create-subaccount.dto';
import { VerifyBvnDto } from './dto/verify-bvn.dto';
import { VerifyNinDto } from './dto/verify-nin.dto';
import { KycProfile } from './entities/kyc-profile.entity';

@Injectable()
export class KycService {
  constructor(
    private readonly strowalletProvider: StrowalletProvider,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(KycProfile)
    private readonly profilesRepository: Repository<KycProfile>,
    private readonly config: ConfigService,
  ) {}

  async getStatus(userId: string) {
    const [user, profile] = await Promise.all([
      this.findUser(userId),
      this.profilesRepository.findOneBy({ userId }),
    ]);
    return {
      ninVerifiedAt: user.ninVerifiedAt,
      bvnVerifiedAt: profile?.bvnVerifiedAt ?? null,
      phoneVerifiedAt: profile?.phoneVerifiedAt ?? null,
      subaccountCreated: Boolean(profile?.strowalletSubaccountId),
    };
  }

  async verifyBvn(userId: string, dto: VerifyBvnDto) {
    const user = await this.findUser(userId);
    if (this.normalizePhone(dto.phoneNumber) !== this.normalizePhone(user.phone)) {
      throw new BadRequestException('Use the phone number registered to your account');
    }

    const result = await this.strowalletProvider.verifyBvn(dto);
    const transactionId = this.readString(result, 'trx');
    if (!transactionId) {
      throw new ServiceUnavailableException(
        'BVN provider did not return a confirmation transaction',
      );
    }

    const profile = await this.ensureProfile(userId);
    profile.pendingBvnTransactionId = transactionId;
    profile.pendingBvnHash = this.hashBvn(dto.number);
    await this.profilesRepository.save(profile);

    return {
      verified: false,
      otpRequired: true,
      transactionId,
      message: this.readString(result, 'message') ?? 'OTP sent',
    };
  }

  async confirmBvn(userId: string, dto: ConfirmBvnDto) {
    const profile = await this.profilesRepository.findOneBy({ userId });
    if (
      !profile?.pendingBvnTransactionId ||
      !profile.pendingBvnHash ||
      profile.pendingBvnTransactionId !== dto.transactionId
    ) {
      throw new BadRequestException(
        'Start BVN verification again before confirming the OTP',
      );
    }
    const result = await this.strowalletProvider.confirmBvn(dto);
    const verifiedAt = new Date();
    profile.bvnVerifiedAt = verifiedAt;
    profile.phoneVerifiedAt = verifiedAt;
    profile.verifiedBvnHash = profile.pendingBvnHash;
    profile.pendingBvnTransactionId = null;
    profile.pendingBvnHash = null;
    await this.profilesRepository.save(profile);
    return { verified: true, verifiedAt, data: result };
  }

  async verifyNin(userId: string, dto: VerifyNinDto) {
    const result = await this.strowalletProvider.verifyNin(dto);
    const user = await this.findUser(userId);
    user.nin = dto.numberNin;
    user.ninVerifiedAt = new Date();
    await this.usersRepository.save(user);
    return { verified: true, data: result };
  }

  async createSubaccount(userId: string, dto: CreateSubaccountDto) {
    const [user, profile] = await Promise.all([
      this.findUser(userId),
      this.profilesRepository.findOneBy({ userId }),
    ]);
    if (!profile?.bvnVerifiedAt) {
      throw new BadRequestException('Complete BVN OTP verification first');
    }
    if (
      !profile.verifiedBvnHash ||
      profile.verifiedBvnHash !== this.hashBvn(dto.bvn)
    ) {
      throw new BadRequestException(
        'Use the BVN that completed OTP verification',
      );
    }
    if (profile.strowalletSubaccountId) {
      return { created: false, subaccountId: profile.strowalletSubaccountId };
    }

    const result = await this.strowalletProvider.createSubaccount({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      bvn: dto.bvn,
      state: dto.state,
      pin: dto.pin,
      address: dto.address,
      country: dto.country,
      business: dto.business,
      companyType: dto.companyType,
      cac: dto.cac,
    });
    const subaccountId = this.readString(result, 'subaccount_id');
    if (!subaccountId) {
      throw new ServiceUnavailableException(
        'Subaccount provider did not return an account ID',
      );
    }
    profile.strowalletSubaccountId = subaccountId;
    await this.profilesRepository.save(profile);
    return { created: true, subaccountId, data: result };
  }

  private async findUser(userId: string) {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async ensureProfile(userId: string) {
    return (
      (await this.profilesRepository.findOneBy({ userId })) ??
      this.profilesRepository.create({
        userId,
        bvnVerifiedAt: null,
        phoneVerifiedAt: null,
        pendingBvnTransactionId: null,
        pendingBvnHash: null,
        verifiedBvnHash: null,
        strowalletSubaccountId: null,
      })
    );
  }

  private hashBvn(value: string) {
    return createHmac(
      'sha256',
      this.config.getOrThrow<string>('BETTER_AUTH_SECRET'),
    )
      .update(value.trim())
      .digest('hex');
  }

  private normalizePhone(value: string) {
    const digits = value.replace(/\D/g, '');
    if (digits.startsWith('234')) return `0${digits.slice(3)}`;
    return digits.startsWith('0') ? digits : `0${digits}`;
  }

  private readString(source: unknown, key: string) {
    if (!source || typeof source !== 'object') return null;
    const value = (source as Record<string, unknown>)[key];
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }
}
