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
import { CreateAccessCodeDto } from './dto/create-access-code.dto';
import { GrantListingPermissionDto } from './dto/grant-listing-permission.dto';
import { ReviewListingApplicationDto } from './dto/review-listing-application.dto';
import { UpdatePlatformFeeDto } from './dto/update-platform-fee.dto';
import { AccessCode } from './entities/access-code.entity';
import { PlatformFeeSetting } from './entities/platform-fee-setting.entity';

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
    @InjectRepository(PlatformFeeSetting)
    private readonly feesRepository: Repository<PlatformFeeSetting>,
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

  private generateCode() {
    return `AUC-${randomBytes(4).toString('hex').toUpperCase()}`;
  }
}

