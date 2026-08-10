import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { ListingAccessStatus } from '../../common/enums/listing-access-status.enum';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { ListingStatus } from '../../common/enums/listing-status.enum';
import { AuctionsService } from '../auctions/auctions.service';
import { CarListing } from '../cars/entities/car-listing.entity';
import { GadgetListing } from '../gadgets/entities/gadget-listing.entity';
import { ListingAccessApplication } from '../users/entities/listing-access-application.entity';
import { UserListingPermission } from '../users/entities/user-listing-permission.entity';
import { User } from '../users/entities/user.entity';
import { CreateAccessCodeDto } from './dto/create-access-code.dto';
import { GrantListingPermissionDto } from './dto/grant-listing-permission.dto';
import { ListAccessCodesQueryDto } from './dto/list-access-codes-query.dto';
import { ReviewListingApplicationDto } from './dto/review-listing-application.dto';
import { ReviewListingDto } from './dto/review-listing.dto';
import { AccessCode } from './entities/access-code.entity';

@Injectable()
export class AdminListingsService {
  private readonly logger = new Logger(AdminListingsService.name);
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(AccessCode) private readonly accessCodesRepository: Repository<AccessCode>,
    @InjectRepository(ListingAccessApplication) private readonly applicationsRepository: Repository<ListingAccessApplication>,
    @InjectRepository(UserListingPermission) private readonly permissionsRepository: Repository<UserListingPermission>,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(CarListing) private readonly carListingsRepository: Repository<CarListing>,
    @InjectRepository(GadgetListing) private readonly gadgetListingsRepository: Repository<GadgetListing>,
    private readonly auctionsService: AuctionsService,
  ) {}

  async listAccessCodes(query: ListAccessCodesQueryDto) {
    const where: Record<string, unknown> = {};
    if (query.category) where.category = query.category;
    if (query.active === 'true') where.isActive = true;
    if (query.active === 'false') where.isActive = false;
    const items = await this.accessCodesRepository.find({ where, order: { createdAt: 'DESC' } });
    return {
      items: items.map((c) => ({ id: c.id, code: c.code, category: c.category, expiresAt: c.expiresAt, isActive: c.isActive, usedById: c.usedById, usedAt: c.usedAt, createdAt: c.createdAt })),
    };
  }

  async createAccessCode(adminId: string, dto: CreateAccessCodeDto) {
    const code = dto.code?.trim().toUpperCase() ?? this.generateCode();
    if (await this.accessCodesRepository.findOneBy({ code })) throw new BadRequestException('Access code already exists');
    const accessCode = this.accessCodesRepository.create({ code, category: dto.category, createdById: adminId, expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null });
    return { accessCode: await this.accessCodesRepository.save(accessCode) };
  }

  async listPendingApplications() {
    return { applications: await this.applicationsRepository.find({ where: { status: ListingAccessStatus.Pending }, order: { createdAt: 'ASC' } }) };
  }

  async approveApplication(adminId: string, applicationId: string, dto: ReviewListingApplicationDto) {
    return this.dataSource.transaction(async (manager) => {
      const application = await this.findPendingApplication(applicationId, manager);
      const permission = await this.grantPermission(
        { userId: application.userId, category: application.category, grantedById: adminId },
        manager,
      );
      Object.assign(application, { status: ListingAccessStatus.Approved, reviewedById: adminId, reviewNote: dto.reviewNote ?? null, reviewedAt: new Date() });
      await manager.save(application);
      return { application, listingPermission: permission };
    });
  }

  async rejectApplication(adminId: string, applicationId: string, dto: ReviewListingApplicationDto) {
    const application = await this.findPendingApplication(applicationId);
    Object.assign(application, { status: ListingAccessStatus.Rejected, reviewedById: adminId, reviewNote: dto.reviewNote ?? null, reviewedAt: new Date() });
    return { application: await this.applicationsRepository.save(application) };
  }

  async grantListingPermission(adminId: string, dto: GrantListingPermissionDto) {
    const user = await this.usersRepository.findOneBy({ id: dto.userId, isActive: true });
    if (!user) throw new NotFoundException('User not found');
    return { listingPermission: await this.grantPermission({ userId: dto.userId, category: dto.category, grantedById: adminId }) };
  }

  async listPendingListings() {
    const [carListings, gadgetListings] = await Promise.all([
      this.carListingsRepository.find({ where: { status: ListingStatus.PendingApproval }, order: { createdAt: 'ASC' } }),
      this.gadgetListingsRepository.find({ where: { status: ListingStatus.PendingApproval }, order: { createdAt: 'ASC' } }),
    ]);
    return { carListings, gadgetListings };
  }

  async approveListing(adminId: string, category: ListingCategory, listingId: string, dto: ReviewListingDto) {
    const result = await this.dataSource.transaction(async (manager) => {
      const listing = await this.findPendingListing(category, listingId, manager);
      if (new Date(listing.startTime).getTime() <= Date.now()) throw new BadRequestException('Set a new future start time before approving this listing');
      Object.assign(listing, { status: ListingStatus.Approved, reviewedById: adminId, reviewNote: dto.reviewNote ?? null, reviewedAt: new Date() });
      const reviewedListing = await this.saveReviewedListing(category, listing, manager);
      const auction = await this.auctionsService.createFromApprovedListing(category, listing.id, manager);
      return { ...reviewedListing, ...auction };
    });
    let schedulingPending = false;
    if (result.created) {
      try {
        await this.auctionsService.scheduleApprovedAuction(result.auction.id);
      } catch (error) {
        schedulingPending = true;
        this.logger.error(
          `Auction ${result.auction.id} approved but lifecycle scheduling is pending`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }
    return { ...result, schedulingPending };
  }

  async rejectListing(adminId: string, category: ListingCategory, listingId: string, dto: ReviewListingDto) {
    const listing = await this.findPendingListing(category, listingId);
    Object.assign(listing, { status: ListingStatus.Rejected, reviewedById: adminId, reviewNote: dto.reviewNote ?? null, reviewedAt: new Date() });
    return this.saveReviewedListing(category, listing);
  }

  private async grantPermission(input: { userId: string; category: ListingCategory; grantedById: string }, manager?: EntityManager) {
    const repository = manager?.getRepository(UserListingPermission) ?? this.permissionsRepository;
    const existing = await repository.findOneBy({ userId: input.userId, category: input.category });
    if (existing) return existing;
    return repository.save(repository.create(input));
  }

  private async findPendingApplication(applicationId: string, manager?: EntityManager) {
    const repository = manager?.getRepository(ListingAccessApplication) ?? this.applicationsRepository;
    const app = await repository.findOne({
      where: { id: applicationId, status: ListingAccessStatus.Pending },
      ...(manager ? { lock: { mode: 'pessimistic_write' as const } } : {}),
    });
    if (!app) throw new NotFoundException('Pending application not found');
    return app;
  }

  private async findPendingListing(category: ListingCategory, listingId: string, manager?: EntityManager) {
    const entity = category === ListingCategory.Car ? CarListing : GadgetListing;
    const repo = manager?.getRepository(entity) ?? (category === ListingCategory.Car ? this.carListingsRepository : this.gadgetListingsRepository);
    const listing = await repo.findOne({
      where: { id: listingId, status: ListingStatus.PendingApproval },
      ...(manager ? { lock: { mode: 'pessimistic_write' as const } } : {}),
    });
    if (!listing) throw new NotFoundException('Pending listing not found');
    return listing;
  }

  private async saveReviewedListing(category: ListingCategory, listing: CarListing | GadgetListing, manager?: EntityManager) {
    if (category === ListingCategory.Car) return { carListing: await (manager?.getRepository(CarListing) ?? this.carListingsRepository).save(listing as CarListing) };
    return { gadgetListing: await (manager?.getRepository(GadgetListing) ?? this.gadgetListingsRepository).save(listing as GadgetListing) };
  }

  private generateCode() {
    return `AUC-${randomBytes(4).toString('hex').toUpperCase()}`;
  }
}
