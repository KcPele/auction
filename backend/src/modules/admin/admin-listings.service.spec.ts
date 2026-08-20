import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { ListingAccessStatus } from '../../common/enums/listing-access-status.enum';
import { ListingStatus } from '../../common/enums/listing-status.enum';
import { CarListing } from '../cars/entities/car-listing.entity';
import { AdminListingsService } from './admin-listings.service';
import { MechanicProfile } from './entities/mechanic-profile.entity';

describe('AdminListingsService access codes', () => {
  const accessCodes = {
    findAndCount: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
  };

  const service = new AdminListingsService(
    {} as never,
    accessCodes as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    accessCodes.create.mockImplementation((value) => value);
    accessCodes.save.mockImplementation(async (value) => value);
  });

  it('rejects an expiry that is not in the future', async () => {
    accessCodes.findOneBy.mockResolvedValue(null);

    await expect(
      service.createAccessCode('admin-id', {
        category: ListingCategory.Car,
        expiresAt: new Date(Date.now() - 1_000).toISOString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(accessCodes.save).not.toHaveBeenCalled();
  });

  it('paginates access codes while preserving the filtered total', async () => {
    accessCodes.findAndCount.mockResolvedValue([
      [
        {
          id: 'code-id',
          code: 'BN-CAR-2026',
          category: ListingCategory.Car,
          expiresAt: null,
          isActive: true,
          usedById: null,
          usedAt: null,
          createdAt: new Date('2026-08-20T12:00:00.000Z'),
        },
      ],
      44,
    ]);

    const result = await service.listAccessCodes({
      category: ListingCategory.Car,
      active: 'true',
      limit: 20,
      offset: 20,
    });

    expect(result.total).toBe(44);
    expect(accessCodes.findAndCount).toHaveBeenCalledWith({
      where: { category: ListingCategory.Car, isActive: true },
      order: { createdAt: 'DESC' },
      take: 20,
      skip: 20,
    });
  });

  it('normalizes and saves a future access code', async () => {
    accessCodes.findOneBy.mockResolvedValue(null);
    const expiresAt = new Date(Date.now() + 60_000).toISOString();

    await expect(
      service.createAccessCode('admin-id', {
        category: ListingCategory.Gadget,
        code: '  launch-2026  ',
        expiresAt,
      }),
    ).resolves.toEqual({
      accessCode: {
        code: 'LAUNCH-2026',
        category: ListingCategory.Gadget,
        createdById: 'admin-id',
        expiresAt: new Date(expiresAt),
      },
    });
  });

  it('deactivates an unused access code', async () => {
    const accessCode = { id: 'code-id', isActive: true, usedAt: null };
    accessCodes.findOneBy.mockResolvedValue(accessCode);

    await expect(service.deactivateAccessCode('code-id')).resolves.toEqual({
      accessCode: { ...accessCode, isActive: false },
    });
    expect(accessCodes.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'code-id', isActive: false }),
    );
  });

  it('does not deactivate a used or missing access code', async () => {
    accessCodes.findOneBy.mockResolvedValueOnce({
      id: 'used-code',
      isActive: true,
      usedAt: new Date(),
    });
    await expect(service.deactivateAccessCode('used-code')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    accessCodes.findOneBy.mockResolvedValueOnce(null);
    await expect(service.deactivateAccessCode('missing-code')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('AdminListingsService car approval', () => {
  it('blocks approval when the assigned mechanic is no longer verified', async () => {
    const carListings = {
      findOne: jest.fn().mockResolvedValue({
        id: 'car-id',
        status: ListingStatus.PendingApproval,
        startTime: new Date(Date.now() + 60_000),
        mechanicId: 'mechanic-id',
      }),
      save: jest.fn(),
    };
    const mechanics = { findOneBy: jest.fn().mockResolvedValue(null) };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === CarListing) return carListings;
        if (entity === MechanicProfile) return mechanics;
        throw new Error('Unexpected repository');
      }),
    };
    const dataSource = {
      transaction: jest.fn((callback) => callback(manager)),
    };
    const auctions = { createFromApprovedListing: jest.fn() };
    const service = new AdminListingsService(
      dataSource as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      carListings as never,
      {} as never,
      auctions as never,
      { create: jest.fn() } as never,
    );

    await expect(
      service.approveListing('admin-id', ListingCategory.Car, 'car-id', {}),
    ).rejects.toThrow('The assigned mechanic is no longer verified');
    expect(auctions.createFromApprovedListing).not.toHaveBeenCalled();
  });

  it('notifies the seller after an approved auction is scheduled', async () => {
    const listing = {
      id: 'car-id',
      listerId: 'seller-id',
      status: ListingStatus.PendingApproval,
      startTime: new Date(Date.now() + 60_000),
      mechanicId: 'mechanic-id',
    };
    const carListings = {
      findOne: jest.fn().mockResolvedValue(listing),
      save: jest.fn(async (value) => value),
    };
    const mechanics = { findOneBy: jest.fn().mockResolvedValue({ id: 'mechanic-id' }) };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === CarListing) return carListings;
        if (entity === MechanicProfile) return mechanics;
        throw new Error('Unexpected repository');
      }),
    };
    const dataSource = {
      transaction: jest.fn((callback) => callback(manager)),
    };
    const auctions = {
      createFromApprovedListing: jest.fn().mockResolvedValue({
        auction: { id: 'auction-id' },
        created: true,
      }),
      scheduleApprovedAuction: jest.fn().mockResolvedValue(undefined),
    };
    const notifications = { create: jest.fn().mockResolvedValue({}) };
    const service = new AdminListingsService(
      dataSource as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      carListings as never,
      {} as never,
      auctions as never,
      notifications as never,
    );

    await service.approveListing('admin-id', ListingCategory.Car, 'car-id', {});

    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: 'seller-id',
        type: 'LISTING_APPROVED',
        data: expect.objectContaining({ auctionId: 'auction-id' }),
      }),
    );
  });

  it('notifies the seller when a listing is rejected', async () => {
    const listing = {
      id: 'car-id',
      listerId: 'seller-id',
      status: ListingStatus.PendingApproval,
    };
    const carListings = {
      findOne: jest.fn().mockResolvedValue(listing),
      save: jest.fn(async (value) => value),
    };
    const notifications = { create: jest.fn().mockResolvedValue({}) };
    const service = new AdminListingsService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      carListings as never,
      {} as never,
      {} as never,
      notifications as never,
    );

    await service.rejectListing('admin-id', ListingCategory.Car, 'car-id', {
      reviewNote: 'Please add clearer photos.',
    });

    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: 'seller-id',
        type: 'LISTING_REJECTED',
        message: 'Please add clearer photos.',
      }),
    );
  });
});

describe('AdminListingsService access review notifications', () => {
  it('notifies the applicant when listing access is rejected', async () => {
    const application = {
      id: 'application-id',
      userId: 'user-id',
      category: ListingCategory.Gadget,
      status: ListingAccessStatus.Pending,
    };
    const applications = {
      findOne: jest.fn().mockResolvedValue(application),
      save: jest.fn(async (value) => value),
    };
    const notifications = { create: jest.fn().mockResolvedValue({}) };
    const service = new AdminListingsService(
      {} as never,
      {} as never,
      applications as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      notifications as never,
    );

    await service.rejectApplication('admin-id', 'application-id', {
      reviewNote: 'Add a clearer reason for access.',
    });

    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: 'user-id',
        title: 'Listing access needs changes',
        message: 'Add a clearer reason for access.',
      }),
    );
  });
});
