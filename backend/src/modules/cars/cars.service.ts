import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { ListingStatus } from '../../common/enums/listing-status.enum';
import { assertCanViewListing } from '../../common/authorization/listing-view.policy';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import {
  assertFutureStartTime,
  assertHoldPercent,
} from '../../common/utils/listing-validation';
import { UserListingPermission } from '../users/entities/user-listing-permission.entity';
import { PlatformToggle } from '../admin/entities/platform-toggle.entity';
import { MechanicProfile } from '../admin/entities/mechanic-profile.entity';
import { MechanicVerificationStatus } from '../../common/enums/mechanic-verification-status.enum';
import { CreateCarListingDto } from './dto/create-car-listing.dto';
import { UpdateCarListingDto } from './dto/update-car-listing.dto';
import { CarListing } from './entities/car-listing.entity';

@Injectable()
export class CarsService {
  constructor(
    @InjectRepository(CarListing)
    private readonly carListingsRepository: Repository<CarListing>,
    @InjectRepository(UserListingPermission)
    private readonly permissionsRepository: Repository<UserListingPermission>,
    @InjectRepository(PlatformToggle)
    private readonly platformTogglesRepository: Repository<PlatformToggle>,
    @InjectRepository(MechanicProfile)
    private readonly mechanicProfilesRepository: Repository<MechanicProfile>,
  ) {}

  async create(userId: string, dto: CreateCarListingDto) {
    await this.ensureListingAccess(userId);
    if (dto.mechanicId) await this.ensureVerifiedMechanic(dto.mechanicId);
    this.validateSchedule(dto.holdPercent, dto.startTime);

    const listing = this.carListingsRepository.create({
      ...this.mapDto(dto),
      listerId: userId,
      status: ListingStatus.Draft,
    });

    return { carListing: await this.carListingsRepository.save(listing) };
  }

  async listMine(userId: string) {
    const carListings = await this.carListingsRepository.find({
      where: { listerId: userId },
      order: { createdAt: 'DESC' },
    });

    return { carListings };
  }

  async findOne(user: AuthenticatedUser, id: string) {
    const listing = await this.findListing(id);
    this.assertCanView(user, listing);
    return { carListing: listing };
  }

  async update(userId: string, id: string, dto: UpdateCarListingDto) {
    const listing = await this.findOwnEditable(userId, id);

    if (dto.mechanicId) await this.ensureVerifiedMechanic(dto.mechanicId);

    if (dto.holdPercent || dto.startTime) {
      this.validateSchedule(
        dto.holdPercent ?? listing.holdPercent,
        dto.startTime ?? listing.startTime.toISOString(),
      );
    }

    if (listing.status === ListingStatus.Rejected) {
      Object.assign(listing, {
        status: ListingStatus.Draft,
        reviewedById: null,
        reviewNote: null,
        reviewedAt: null,
      });
    }
    Object.assign(listing, this.mapPartialDto(dto));

    return { carListing: await this.carListingsRepository.save(listing) };
  }

  async submit(userId: string, id: string) {
    await this.ensureSubmissionsOpen();
    const listing = await this.findOwnDraft(userId, id);
    if (!listing.mechanicId) {
      throw new BadRequestException(
        'Choose a verified mechanic before submitting this car listing',
      );
    }
    await this.ensureVerifiedMechanic(listing.mechanicId);
    assertFutureStartTime(listing.startTime);
    listing.status = ListingStatus.PendingApproval;

    return { carListing: await this.carListingsRepository.save(listing) };
  }

  private async ensureVerifiedMechanic(mechanicId: string) {
    const mechanic = await this.mechanicProfilesRepository.findOne({
      where: {
        id: mechanicId,
        status: MechanicVerificationStatus.Verified,
        user: { isActive: true, isBanned: false },
      },
    });

    if (!mechanic) {
      throw new BadRequestException('Choose a verified mechanic');
    }
  }

  private async ensureSubmissionsOpen() {
    const toggles = await this.platformTogglesRepository.findOneBy({
      id: 'default',
    });

    if (toggles?.pauseNewListings) {
      throw new ServiceUnavailableException(
        'New listing submissions are temporarily paused',
      );
    }
  }

  private async ensureListingAccess(userId: string) {
    const permission = await this.permissionsRepository.findOneBy({
      userId,
      category: ListingCategory.Car,
    });

    if (!permission) {
      throw new BadRequestException('Car listing access is required');
    }
  }

  private async findListing(id: string) {
    const listing = await this.carListingsRepository.findOneBy({ id });

    if (!listing) {
      throw new NotFoundException('Car listing not found');
    }

    return listing;
  }

  private async findOwnDraft(userId: string, id: string) {
    const listing = await this.findOwnEditable(userId, id);

    if (listing.status !== ListingStatus.Draft) {
      throw new BadRequestException('Edit a rejected listing before resubmitting');
    }

    return listing;
  }

  private async findOwnEditable(userId: string, id: string) {
    const listing = await this.findListing(id);

    if (listing.listerId !== userId) {
      throw new NotFoundException('Car listing not found');
    }

    if (
      ![ListingStatus.Draft, ListingStatus.Rejected].includes(listing.status)
    ) {
      throw new BadRequestException(
        'Only draft or rejected listings can be changed',
      );
    }

    return listing;
  }

  private assertCanView(user: AuthenticatedUser, listing: CarListing) {
    assertCanViewListing(user, listing, 'Car listing not found');
  }

  private validateSchedule(holdPercent: number, startTime: string) {
    assertHoldPercent(holdPercent);
    assertFutureStartTime(new Date(startTime));
  }

  private mapDto(dto: CreateCarListingDto) {
    return {
      make: dto.make.trim(),
      model: dto.model.trim(),
      year: dto.year,
      colour: dto.colour.trim(),
      registrationNumber: dto.registrationNumber.trim().toUpperCase(),
      mileage: dto.mileage,
      condition: dto.condition.trim(),
      knownFaults: dto.knownFaults?.trim() ?? null,
      mechanicId: dto.mechanicId ?? null,
      photoUrls: dto.photoUrls,
      videoUrls: dto.videoUrls ?? [],
      basePriceKobo: String(dto.basePriceKobo),
      holdPercent: dto.holdPercent,
      minimumBidIncrementKobo: String(dto.minimumBidIncrementKobo),
      startTime: new Date(dto.startTime),
      durationMinutes: dto.durationMinutes,
    };
  }

  private mapPartialDto(dto: UpdateCarListingDto) {
    const mapped: Partial<CarListing> = {};

    for (const [key, value] of Object.entries(dto)) {
      if (value === undefined) {
        continue;
      }

      Object.assign(mapped, this.mapField(key, value));
    }

    return mapped;
  }

  private mapField(key: string, value: unknown) {
    if (key === 'basePriceKobo' || key === 'minimumBidIncrementKobo') {
      return { [key]: String(value) };
    }

    if (key === 'startTime') {
      return { startTime: new Date(String(value)) };
    }

    if (key === 'registrationNumber') {
      return { registrationNumber: String(value).trim().toUpperCase() };
    }

    if (typeof value === 'string') {
      return { [key]: value.trim() };
    }

    return { [key]: value };
  }
}
