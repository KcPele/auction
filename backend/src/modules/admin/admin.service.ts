import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { DefaultPlatformFees } from '../../common/constants/platform-fees';
import { ListingAccessStatus } from '../../common/enums/listing-access-status.enum';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { ListingAccessApplication } from '../users/entities/listing-access-application.entity';
import { UserListingPermission } from '../users/entities/user-listing-permission.entity';
import { User } from '../users/entities/user.entity';
import { CarListing } from '../cars/entities/car-listing.entity';
import { GadgetListing } from '../gadgets/entities/gadget-listing.entity';
import { CreateAccessCodeDto } from './dto/create-access-code.dto';
import { DefaultAuctionPaymentDto } from './dto/default-auction-payment.dto';
import { GrantListingPermissionDto } from './dto/grant-listing-permission.dto';
import { ReviewListingApplicationDto } from './dto/review-listing-application.dto';
import { ReviewListingDto } from './dto/review-listing.dto';
import { SettleAuctionPaymentDto } from './dto/settle-auction-payment.dto';
import { UpdateBiddingSettingDto } from './dto/update-bidding-setting.dto';
import { UpdatePaymentAccountDto } from './dto/update-payment-account.dto';
import { UpdatePlatformFeeDto } from './dto/update-platform-fee.dto';
import { AccessCode } from './entities/access-code.entity';
import { BiddingSetting } from './entities/bidding-setting.entity';
import { PaymentAccountSetting } from './entities/payment-account-setting.entity';
import { PlatformFeeSetting } from './entities/platform-fee-setting.entity';
import { ListingStatus } from '../../common/enums/listing-status.enum';
import { AuctionSettlementService } from '../auctions/auction-settlement.service';
import { AuctionsService } from '../auctions/auctions.service';
import { WalletWithdrawalsService } from '../wallets/wallet-withdrawals.service';
import { AuthorizeWithdrawalDto } from './dto/authorize-withdrawal.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(AccessCode)
    private readonly accessCodesRepository: Repository<AccessCode>,
    @InjectRepository(ListingAccessApplication)
    private readonly applicationsRepository: Repository<ListingAccessApplication>,
    @InjectRepository(UserListingPermission)
    private readonly permissionsRepository: Repository<UserListingPermission>,
    @InjectRepository(BiddingSetting)
    private readonly biddingSettingsRepository: Repository<BiddingSetting>,
    @InjectRepository(PlatformFeeSetting)
    private readonly feesRepository: Repository<PlatformFeeSetting>,
    @InjectRepository(PaymentAccountSetting)
    private readonly paymentAccountsRepository: Repository<PaymentAccountSetting>,
    @InjectRepository(CarListing)
    private readonly carListingsRepository: Repository<CarListing>,
    @InjectRepository(GadgetListing)
    private readonly gadgetListingsRepository: Repository<GadgetListing>,
    private readonly auctionsService: AuctionsService,
    private readonly auctionSettlementService: AuctionSettlementService,
    private readonly walletWithdrawalsService: WalletWithdrawalsService,
  ) {}

  async createAccessCode(adminId: string, dto: CreateAccessCodeDto) {
    const code = dto.code?.trim().toUpperCase() ?? this.generateCode();
    const existing = await this.accessCodesRepository.findOneBy({ code });

    if (existing) {
      throw new BadRequestException('Access code already exists');
    }

    const accessCode = this.accessCodesRepository.create({
      code,
      category: dto.category,
      createdById: adminId,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });

    return { accessCode: await this.accessCodesRepository.save(accessCode) };
  }

  async listPendingApplications() {
    const applications = await this.applicationsRepository.find({
      where: { status: ListingAccessStatus.Pending },
      order: { createdAt: 'ASC' },
    });

    return { applications };
  }

  async approveApplication(
    adminId: string,
    applicationId: string,
    dto: ReviewListingApplicationDto,
  ) {
    const application = await this.findPendingApplication(applicationId);
    const permission = await this.grantPermission({
      userId: application.userId,
      category: application.category,
      grantedById: adminId,
    });

    Object.assign(application, {
      status: ListingAccessStatus.Approved,
      reviewedById: adminId,
      reviewNote: dto.reviewNote ?? null,
      reviewedAt: new Date(),
    });
    await this.applicationsRepository.save(application);

    return { application, listingPermission: permission };
  }

  async rejectApplication(
    adminId: string,
    applicationId: string,
    dto: ReviewListingApplicationDto,
  ) {
    const application = await this.findPendingApplication(applicationId);

    Object.assign(application, {
      status: ListingAccessStatus.Rejected,
      reviewedById: adminId,
      reviewNote: dto.reviewNote ?? null,
      reviewedAt: new Date(),
    });

    return { application: await this.applicationsRepository.save(application) };
  }

  async grantListingPermission(
    adminId: string,
    dto: GrantListingPermissionDto,
  ) {
    const user = await this.usersRepository.findOneBy({
      id: dto.userId,
      isActive: true,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const listingPermission = await this.grantPermission({
      userId: dto.userId,
      category: dto.category,
      grantedById: adminId,
    });

    return { listingPermission };
  }

  async listPlatformFees() {
    await this.ensureDefaultFees();
    const platformFees = await this.feesRepository.find({
      order: { category: 'ASC' },
    });

    return { platformFees };
  }

  async updatePlatformFee(adminId: string, dto: UpdatePlatformFeeDto) {
    const fee = await this.findOrCreateFee(dto.category);

    Object.assign(fee, {
      sellerFeeBps: dto.sellerFeeBps,
      buyerFeeBps: dto.buyerFeeBps,
      updatedById: adminId,
    });

    return { platformFee: await this.feesRepository.save(fee) };
  }

  async getBiddingSetting() {
    return { biddingSetting: await this.findOrCreateBiddingSetting() };
  }

  async updateBiddingSetting(adminId: string, dto: UpdateBiddingSettingDto) {
    const biddingSetting = await this.findOrCreateBiddingSetting();

    biddingSetting.bidRequirementPercent = dto.bidRequirementPercent;
    biddingSetting.updatedById = adminId;

    return {
      biddingSetting: await this.biddingSettingsRepository.save(biddingSetting),
    };
  }

  async getPaymentAccount() {
    return {
      paymentAccount: await this.paymentAccountsRepository.findOneBy({
        id: 'default',
      }),
    };
  }

  async updatePaymentAccount(adminId: string, dto: UpdatePaymentAccountDto) {
    const existing = await this.paymentAccountsRepository.findOneBy({
      id: 'default',
    });
    const paymentAccount = this.paymentAccountsRepository.create({
      ...(existing ?? { id: 'default' }),
      bankName: dto.bankName.trim(),
      accountNumber: dto.accountNumber.trim(),
      accountName: dto.accountName.trim(),
      updatedById: adminId,
    });

    return {
      paymentAccount: await this.paymentAccountsRepository.save(paymentAccount),
    };
  }

  listPendingWithdrawals() {
    return this.walletWithdrawalsService.listPendingWithdrawals();
  }

  authorizeWithdrawal(withdrawalId: string, dto: AuthorizeWithdrawalDto) {
    return this.walletWithdrawalsService.authorizeWithdrawal(
      withdrawalId,
      dto.authorizationCode,
    );
  }

  resendWithdrawalOtp(withdrawalId: string) {
    return this.walletWithdrawalsService.resendWithdrawalOtp(withdrawalId);
  }

  settleAuctionPayment(
    adminId: string,
    auctionId: string,
    dto: SettleAuctionPaymentDto,
  ) {
    return this.auctionSettlementService.settleAuctionPayment(
      adminId,
      auctionId,
      dto,
    );
  }

  defaultAuctionPayment(auctionId: string, dto: DefaultAuctionPaymentDto) {
    return this.auctionSettlementService.defaultAuctionPayment(auctionId, dto);
  }

  async listPendingListings() {
    const [carListings, gadgetListings] = await Promise.all([
      this.carListingsRepository.find({
        where: { status: ListingStatus.PendingApproval },
        order: { createdAt: 'ASC' },
      }),
      this.gadgetListingsRepository.find({
        where: { status: ListingStatus.PendingApproval },
        order: { createdAt: 'ASC' },
      }),
    ]);

    return { carListings, gadgetListings };
  }

  async approveListing(
    adminId: string,
    category: ListingCategory,
    listingId: string,
    dto: ReviewListingDto,
  ) {
    const listing = await this.findPendingListing(category, listingId);
    const startTime = new Date(listing.startTime);

    if (startTime.getTime() <= Date.now()) {
      throw new BadRequestException(
        'Set a new future start time before approving this listing',
      );
    }

    Object.assign(listing, {
      status: ListingStatus.Approved,
      reviewedById: adminId,
      reviewNote: dto.reviewNote ?? null,
      reviewedAt: new Date(),
    });

    const reviewedListing = await this.saveReviewedListing(category, listing);
    const auction = await this.auctionsService.createFromApprovedListing(
      category,
      listing.id,
    );

    return { ...reviewedListing, ...auction };
  }

  async rejectListing(
    adminId: string,
    category: ListingCategory,
    listingId: string,
    dto: ReviewListingDto,
  ) {
    const listing = await this.findPendingListing(category, listingId);

    Object.assign(listing, {
      status: ListingStatus.Rejected,
      reviewedById: adminId,
      reviewNote: dto.reviewNote ?? null,
      reviewedAt: new Date(),
    });

    return this.saveReviewedListing(category, listing);
  }

  private async grantPermission(input: {
    userId: string;
    category: ListingCategory;
    grantedById: string;
  }) {
    const existing = await this.permissionsRepository.findOneBy({
      userId: input.userId,
      category: input.category,
    });

    if (existing) {
      return existing;
    }

    return this.permissionsRepository.save(
      this.permissionsRepository.create({
        userId: input.userId,
        category: input.category,
        grantedById: input.grantedById,
      }),
    );
  }

  private async findPendingApplication(applicationId: string) {
    const application = await this.applicationsRepository.findOneBy({
      id: applicationId,
      status: ListingAccessStatus.Pending,
    });

    if (!application) {
      throw new NotFoundException('Pending application not found');
    }

    return application;
  }

  private async ensureDefaultFees() {
    await Promise.all(
      Object.values(ListingCategory).map((category) =>
        this.findOrCreateFee(category),
      ),
    );
  }

  private async findOrCreateFee(category: ListingCategory) {
    const existing = await this.feesRepository.findOneBy({ category });

    if (existing) {
      return existing;
    }

    const defaults = DefaultPlatformFees[category];

    return this.feesRepository.save(
      this.feesRepository.create({
        category,
        sellerFeeBps: defaults.sellerFeeBps,
        buyerFeeBps: defaults.buyerFeeBps,
      }),
    );
  }

  private async findOrCreateBiddingSetting() {
    const existing = await this.biddingSettingsRepository.findOneBy({
      id: 'default',
    });

    if (existing) {
      return existing;
    }

    return this.biddingSettingsRepository.save(
      this.biddingSettingsRepository.create({
        id: 'default',
        bidRequirementPercent: 10,
      }),
    );
  }

  private generateCode() {
    return `AUC-${randomBytes(4).toString('hex').toUpperCase()}`;
  }

  private async findPendingListing(
    category: ListingCategory,
    listingId: string,
  ) {
    const repository = this.getListingRepository(category);
    const listing = await repository.findOneBy({
      id: listingId,
      status: ListingStatus.PendingApproval,
    });

    if (!listing) {
      throw new NotFoundException('Pending listing not found');
    }

    return listing;
  }

  private getListingRepository(category: ListingCategory) {
    if (category === ListingCategory.Car) {
      return this.carListingsRepository;
    }

    return this.gadgetListingsRepository;
  }

  private async saveReviewedListing(
    category: ListingCategory,
    listing: CarListing | GadgetListing,
  ) {
    if (category === ListingCategory.Car) {
      return {
        carListing: await this.carListingsRepository.save(
          listing as CarListing,
        ),
      };
    }

    return {
      gadgetListing: await this.gadgetListingsRepository.save(
        listing as GadgetListing,
      ),
    };
  }
}
