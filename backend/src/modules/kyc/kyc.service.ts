import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StrowalletProvider } from '../payments/providers/strowallet.provider';
import { User } from '../users/entities/user.entity';
import { CreateSubaccountDto } from './dto/create-subaccount.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyBvnDto } from './dto/verify-bvn.dto';
import { VerifyNinDto } from './dto/verify-nin.dto';

@Injectable()
export class KycService {
  constructor(
    private readonly strowalletProvider: StrowalletProvider,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  verifyBvn(dto: VerifyBvnDto) {
    return this.strowalletProvider.verifyBvn(dto);
  }

  verifyNin(dto: VerifyNinDto) {
    return this.strowalletProvider.verifyNin(dto);
  }

  sendOtp(dto: SendOtpDto) {
    return this.strowalletProvider.sendOtp(dto);
  }

  async createSubaccount(userId: string, dto: CreateSubaccountDto) {
    const user = await this.usersRepository.findOneBy({ id: userId });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.strowalletProvider.createSubaccount({
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
  }
}
