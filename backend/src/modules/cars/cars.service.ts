import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { ListingStatus } from '../../common/enums/listing-status.enum';
import {
  assertFutureStartTime,
  assertHoldPercent,
} from '../../common/utils/listing-validation';
import { UserListingPermission } from '../users/entities/user-listing-permission.entity';
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
  ) {}

  async create(userId: string, dto: CreateCarListingDto) {
    await this.ensureListingAccess(userId);
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

  async findOne(id: string) {
    return { carListing: await this.findListing(id) };
  }

  async update(userId: string, id: string, dto: UpdateCarListingDto) {
    const listing = await this.findOwnDraft(userId, id);

    if (dto.holdPercent || dto.startTime) {
      this.validateSchedule(
        dto.holdPercent ?? listing.holdPercent,
        dto.startTime ?? listing.startTime.toISOString(),
      );
    }

    Object.assign(listing, this.mapPartialDto(dto));

    return { carListing: await this.carListingsRepository.save(listing) };
  }

  async submit(userId: string, id: string) {
    const listing = await this.findOwnDraft(userId, id);
    assertFutureStartTime(listing.startTime);
    listing.status = ListingStatus.PendingApproval;

    return { carListing: await this.carListingsRepository.save(listing) };
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
    const listing = await this.findListing(id);

    if (listing.listerId !== userId) {
      throw new NotFoundException('Car listing not found');
    }

    if (listing.status !== ListingStatus.Draft) {
      throw new BadRequestException('Only draft listings can be changed');
    }

    return listing;
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

