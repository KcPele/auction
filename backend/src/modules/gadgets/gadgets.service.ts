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
import { CreateGadgetListingDto } from './dto/create-gadget-listing.dto';
import { UpdateGadgetListingDto } from './dto/update-gadget-listing.dto';
import { GadgetListing } from './entities/gadget-listing.entity';

@Injectable()
export class GadgetsService {
  constructor(
    @InjectRepository(GadgetListing)
    private readonly gadgetListingsRepository: Repository<GadgetListing>,
    @InjectRepository(UserListingPermission)
    private readonly permissionsRepository: Repository<UserListingPermission>,
  ) {}

  async create(userId: string, dto: CreateGadgetListingDto) {
    await this.ensureListingAccess(userId);
    this.validateSchedule(dto.holdPercent, dto.startTime);

    const listing = this.gadgetListingsRepository.create({
      ...this.mapDto(dto),
      listerId: userId,
      status: ListingStatus.Draft,
    });

    return {
      gadgetListing: await this.gadgetListingsRepository.save(listing),
    };
  }

  async listMine(userId: string) {
    const gadgetListings = await this.gadgetListingsRepository.find({
      where: { listerId: userId },
      order: { createdAt: 'DESC' },
    });

    return { gadgetListings };
  }

  async findOne(id: string) {
    return { gadgetListing: await this.findListing(id) };
  }

  async update(userId: string, id: string, dto: UpdateGadgetListingDto) {
    const listing = await this.findOwnDraft(userId, id);

    if (dto.holdPercent || dto.startTime) {
      this.validateSchedule(
        dto.holdPercent ?? listing.holdPercent,
        dto.startTime ?? listing.startTime.toISOString(),
      );
    }

    Object.assign(listing, this.mapPartialDto(dto));

    return {
      gadgetListing: await this.gadgetListingsRepository.save(listing),
    };
  }

  async submit(userId: string, id: string) {
    const listing = await this.findOwnDraft(userId, id);
    assertFutureStartTime(listing.startTime);
    listing.status = ListingStatus.PendingApproval;

    return {
      gadgetListing: await this.gadgetListingsRepository.save(listing),
    };
  }

  private async ensureListingAccess(userId: string) {
    const permission = await this.permissionsRepository.findOneBy({
      userId,
      category: ListingCategory.Gadget,
    });

    if (!permission) {
      throw new BadRequestException('Gadget listing access is required');
    }
  }

  private async findListing(id: string) {
    const listing = await this.gadgetListingsRepository.findOneBy({ id });

    if (!listing) {
      throw new NotFoundException('Gadget listing not found');
    }

    return listing;
  }

  private async findOwnDraft(userId: string, id: string) {
    const listing = await this.findListing(id);

    if (listing.listerId !== userId) {
      throw new NotFoundException('Gadget listing not found');
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

  private mapDto(dto: CreateGadgetListingDto) {
    return {
      type: dto.type.trim(),
      brand: dto.brand.trim(),
      model: dto.model.trim(),
      colour: dto.colour.trim(),
      batteryHealthPercent: dto.batteryHealthPercent ?? null,
      specs: dto.specs,
      usageHistory: dto.usageHistory.trim(),
      defects: dto.defects?.trim() ?? null,
      proofDocumentUrl: dto.proofDocumentUrl.trim(),
      photoUrls: dto.photoUrls,
      videoUrls: dto.videoUrls ?? [],
      basePriceKobo: String(dto.basePriceKobo),
      holdPercent: dto.holdPercent,
      minimumBidIncrementKobo: String(dto.minimumBidIncrementKobo),
      startTime: new Date(dto.startTime),
      durationMinutes: dto.durationMinutes,
    };
  }

  private mapPartialDto(dto: UpdateGadgetListingDto) {
    const mapped: Partial<GadgetListing> = {};

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

    if (typeof value === 'string') {
      return { [key]: value.trim() };
    }

    return { [key]: value };
  }
}

