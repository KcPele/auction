import { Test } from '@nestjs/testing';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AuthService } from '../auth/auth.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import type { CreateAccessCodeDto } from './dto/create-access-code.dto';
import type { GrantListingPermissionDto } from './dto/grant-listing-permission.dto';
import type { ReviewListingApplicationDto } from './dto/review-listing-application.dto';
import type { ReviewListingDto } from './dto/review-listing.dto';
import type { UpdatePlatformFeeDto } from './dto/update-platform-fee.dto';

describe('AdminController', () => {
  const adminUser: AuthenticatedUser = {
    id: '22222222-2222-2222-2222-222222222222',
    role: UserRole.Admin,
    authRole: 'admin',
    sessionId: 'session-id',
  };
  let controller: AdminController;
  let service: {
    createAccessCode: jest.Mock;
    grantListingPermission: jest.Mock;
    listPendingApplications: jest.Mock;
    approveApplication: jest.Mock;
    rejectApplication: jest.Mock;
    listPendingListings: jest.Mock;
    approveListing: jest.Mock;
    rejectListing: jest.Mock;
    listPlatformFees: jest.Mock;
    updatePlatformFee: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      createAccessCode: jest.fn(),
      grantListingPermission: jest.fn(),
      listPendingApplications: jest.fn(),
      approveApplication: jest.fn(),
      rejectApplication: jest.fn(),
      listPendingListings: jest.fn(),
      approveListing: jest.fn(),
      rejectListing: jest.fn(),
      listPlatformFees: jest.fn(),
      updatePlatformFee: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: service },
        { provide: AuthService, useValue: { getAuthenticatedUser: jest.fn() } },
      ],
    }).compile();

    controller = moduleRef.get(AdminController);
  });

  it('creates an access code', async () => {
    const dto: CreateAccessCodeDto = { category: ListingCategory.Car };
    service.createAccessCode.mockResolvedValue({ accessCode: dto });

    await expect(controller.createAccessCode(adminUser, dto)).resolves.toEqual({
      accessCode: dto,
    });
    expect(service.createAccessCode).toHaveBeenCalledWith(adminUser.id, dto);
  });

  it('grants listing permission manually', async () => {
    const dto: GrantListingPermissionDto = {
      userId: '33333333-3333-3333-3333-333333333333',
      category: ListingCategory.Gadget,
    };
    service.grantListingPermission.mockResolvedValue({
      listingPermission: dto,
    });

    await expect(
      controller.grantListingPermission(adminUser, dto),
    ).resolves.toEqual({ listingPermission: dto });
    expect(service.grantListingPermission).toHaveBeenCalledWith(
      adminUser.id,
      dto,
    );
  });

  it('lists pending listing access applications', async () => {
    service.listPendingApplications.mockResolvedValue({ applications: [] });

    await expect(controller.listPendingApplications()).resolves.toEqual({
      applications: [],
    });
    expect(service.listPendingApplications).toHaveBeenCalledWith();
  });

  it('approves a listing access application', async () => {
    const dto: ReviewListingApplicationDto = { reviewNote: 'Approved' };
    service.approveApplication.mockResolvedValue({ application: { id: 'app' } });

    await expect(
      controller.approveApplication(adminUser, 'app', dto),
    ).resolves.toEqual({ application: { id: 'app' } });
    expect(service.approveApplication).toHaveBeenCalledWith(
      adminUser.id,
      'app',
      dto,
    );
  });

  it('rejects a listing access application', async () => {
    const dto: ReviewListingApplicationDto = { reviewNote: 'Rejected' };
    service.rejectApplication.mockResolvedValue({ application: { id: 'app' } });

    await expect(
      controller.rejectApplication(adminUser, 'app', dto),
    ).resolves.toEqual({ application: { id: 'app' } });
    expect(service.rejectApplication).toHaveBeenCalledWith(
      adminUser.id,
      'app',
      dto,
    );
  });

  it('lists pending car and gadget listings', async () => {
    service.listPendingListings.mockResolvedValue({
      carListings: [],
      gadgetListings: [],
    });

    await expect(controller.listPendingListings()).resolves.toEqual({
      carListings: [],
      gadgetListings: [],
    });
    expect(service.listPendingListings).toHaveBeenCalledWith();
  });

  it('approves a pending listing', async () => {
    const dto: ReviewListingDto = { reviewNote: 'Ready' };
    service.approveListing.mockResolvedValue({ carListing: { id: 'car-id' } });

    await expect(
      controller.approveListing(adminUser, ListingCategory.Car, 'car-id', dto),
    ).resolves.toEqual({ carListing: { id: 'car-id' } });
    expect(service.approveListing).toHaveBeenCalledWith(
      adminUser.id,
      ListingCategory.Car,
      'car-id',
      dto,
    );
  });

  it('rejects a pending listing', async () => {
    const dto: ReviewListingDto = { reviewNote: 'Missing photos' };
    service.rejectListing.mockResolvedValue({
      gadgetListing: { id: 'gadget-id' },
    });

    await expect(
      controller.rejectListing(
        adminUser,
        ListingCategory.Gadget,
        'gadget-id',
        dto,
      ),
    ).resolves.toEqual({ gadgetListing: { id: 'gadget-id' } });
    expect(service.rejectListing).toHaveBeenCalledWith(
      adminUser.id,
      ListingCategory.Gadget,
      'gadget-id',
      dto,
    );
  });

  it('lists platform fee settings', async () => {
    service.listPlatformFees.mockResolvedValue({ platformFees: [] });

    await expect(controller.listPlatformFees()).resolves.toEqual({
      platformFees: [],
    });
    expect(service.listPlatformFees).toHaveBeenCalledWith();
  });

  it('updates a platform fee setting', async () => {
    const dto: UpdatePlatformFeeDto = {
      category: ListingCategory.Car,
      sellerFeeBps: 300,
      buyerFeeBps: 0,
    };
    service.updatePlatformFee.mockResolvedValue({ platformFee: dto });

    await expect(
      controller.updatePlatformFee(adminUser, dto),
    ).resolves.toEqual({ platformFee: dto });
    expect(service.updatePlatformFee).toHaveBeenCalledWith(adminUser.id, dto);
  });
});
