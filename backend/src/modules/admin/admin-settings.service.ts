import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DefaultPlatformFees } from '../../common/constants/platform-fees';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { UpdateBiddingSettingDto } from './dto/update-bidding-setting.dto';
import { UpdateEscrowSettingDto } from './dto/update-escrow-setting.dto';
import { UpdatePaymentAccountDto } from './dto/update-payment-account.dto';
import { UpdatePlatformFeeDto } from './dto/update-platform-fee.dto';
import { UpdatePlatformToggleDto } from './dto/update-platform-toggle.dto';
import { BiddingSetting } from './entities/bidding-setting.entity';
import { EscrowSetting } from './entities/escrow-setting.entity';
import { PaymentAccountSetting } from './entities/payment-account-setting.entity';
import { PlatformFeeSetting } from './entities/platform-fee-setting.entity';
import { PlatformToggle } from './entities/platform-toggle.entity';

@Injectable()
export class AdminSettingsService {
  constructor(
    @InjectRepository(BiddingSetting)
    private readonly biddingSettingsRepository: Repository<BiddingSetting>,
    @InjectRepository(PlatformFeeSetting)
    private readonly feesRepository: Repository<PlatformFeeSetting>,
    @InjectRepository(PaymentAccountSetting)
    private readonly paymentAccountsRepository: Repository<PaymentAccountSetting>,
    @InjectRepository(EscrowSetting)
    private readonly escrowSettingsRepository: Repository<EscrowSetting>,
    @InjectRepository(PlatformToggle)
    private readonly platformTogglesRepository: Repository<PlatformToggle>,
  ) {}

  async listPlatformFees() {
    await this.ensureDefaultFees();
    return { platformFees: await this.feesRepository.find({ order: { category: 'ASC' } }) };
  }

  async updatePlatformFee(adminId: string, dto: UpdatePlatformFeeDto) {
    const fee = await this.findOrCreateFee(dto.category);
    Object.assign(fee, { sellerFeeBps: dto.sellerFeeBps, buyerFeeBps: dto.buyerFeeBps, updatedById: adminId });
    return { platformFee: await this.feesRepository.save(fee) };
  }

  async getBiddingSetting() {
    return { biddingSetting: await this.findOrCreateBiddingSetting() };
  }

  async updateBiddingSetting(adminId: string, dto: UpdateBiddingSettingDto) {
    const setting = await this.findOrCreateBiddingSetting();
    setting.bidRequirementPercent = dto.bidRequirementPercent;
    setting.updatedById = adminId;
    return { biddingSetting: await this.biddingSettingsRepository.save(setting) };
  }

  async getPaymentAccount() {
    return { paymentAccount: await this.paymentAccountsRepository.findOneBy({ id: 'default' }) };
  }

  async updatePaymentAccount(adminId: string, dto: UpdatePaymentAccountDto) {
    const existing = await this.paymentAccountsRepository.findOneBy({ id: 'default' });
    const paymentAccount = this.paymentAccountsRepository.create({
      ...(existing ?? { id: 'default' }),
      bankName: dto.bankName.trim(),
      accountNumber: dto.accountNumber.trim(),
      accountName: dto.accountName.trim(),
      updatedById: adminId,
    });
    return { paymentAccount: await this.paymentAccountsRepository.save(paymentAccount) };
  }

  async getEscrowSetting() {
    const setting = await this.escrowSettingsRepository.findOneBy({ id: 'default' });
    if (!setting) {
      return { escrowSetting: { minHoldBps: 1000, maxHoldBps: 2000, paymentWindowHours: 24, autoExtendMinutes: 0 } };
    }
    return { escrowSetting: setting };
  }

  async updateEscrowSetting(adminId: string, dto: UpdateEscrowSettingDto) {
    const existing = await this.escrowSettingsRepository.findOneBy({ id: 'default' });
    const setting = this.escrowSettingsRepository.create({
      ...(existing ?? { id: 'default' }),
      minHoldBps: dto.minHoldBps ?? existing?.minHoldBps ?? 1000,
      maxHoldBps: dto.maxHoldBps ?? existing?.maxHoldBps ?? 2000,
      paymentWindowHours: dto.paymentWindowHours ?? existing?.paymentWindowHours ?? 24,
      autoExtendMinutes: dto.autoExtendMinutes ?? existing?.autoExtendMinutes ?? 0,
      updatedById: adminId,
    });
    return { escrowSetting: await this.escrowSettingsRepository.save(setting) };
  }

  async getPlatformToggles() {
    const toggles = await this.platformTogglesRepository.findOneBy({ id: 'default' });
    if (!toggles) {
      return { toggles: { emailNotifications: true, whatsappNotifications: true, pauseNewListings: false } };
    }
    return { toggles };
  }

  async updatePlatformToggles(adminId: string, dto: UpdatePlatformToggleDto) {
    const existing = await this.platformTogglesRepository.findOneBy({ id: 'default' });
    const toggles = this.platformTogglesRepository.create({
      ...(existing ?? { id: 'default' }),
      emailNotifications: dto.emailNotifications ?? existing?.emailNotifications ?? true,
      whatsappNotifications: dto.whatsappNotifications ?? existing?.whatsappNotifications ?? true,
      pauseNewListings: dto.pauseNewListings ?? existing?.pauseNewListings ?? false,
      updatedById: adminId,
    });
    return { toggles: await this.platformTogglesRepository.save(toggles) };
  }

  private async ensureDefaultFees() {
    await Promise.all(Object.values(ListingCategory).map((c) => this.findOrCreateFee(c)));
  }

  private async findOrCreateFee(category: ListingCategory) {
    const existing = await this.feesRepository.findOneBy({ category });
    if (existing) return existing;
    const defaults = DefaultPlatformFees[category];
    return this.feesRepository.save(this.feesRepository.create({ category, sellerFeeBps: defaults.sellerFeeBps, buyerFeeBps: defaults.buyerFeeBps }));
  }

  private async findOrCreateBiddingSetting() {
    const existing = await this.biddingSettingsRepository.findOneBy({ id: 'default' });
    if (existing) return existing;
    return this.biddingSettingsRepository.save(this.biddingSettingsRepository.create({ id: 'default', bidRequirementPercent: 10 }));
  }
}
