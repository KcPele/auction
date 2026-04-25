import { Test } from '@nestjs/testing';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AuthService } from '../auth/auth.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import type { AuthorizeWithdrawalDto } from './dto/authorize-withdrawal.dto';
import type { DefaultAuctionPaymentDto } from './dto/default-auction-payment.dto';
import type { CreateAccessCodeDto } from './dto/create-access-code.dto';
import type { GrantListingPermissionDto } from './dto/grant-listing-permission.dto';
import type { ReviewListingApplicationDto } from './dto/review-listing-application.dto';
import type { ReviewListingDto } from './dto/review-listing.dto';
import type { SettleAuctionPaymentDto } from './dto/settle-auction-payment.dto';
import type { UpdateBiddingSettingDto } from './dto/update-bidding-setting.dto';
import type { UpdatePaymentAccountDto } from './dto/update-payment-account.dto';
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
    getBiddingSetting: jest.Mock;
    updateBiddingSetting: jest.Mock;
    getPaymentAccount: jest.Mock;
    updatePaymentAccount: jest.Mock;
    listPendingWithdrawals: jest.Mock;
    authorizeWithdrawal: jest.Mock;
    resendWithdrawalOtp: jest.Mock;
    settleAuctionPayment: jest.Mock;
    defaultAuctionPayment: jest.Mock;
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
      getBiddingSetting: jest.fn(),
      updateBiddingSetting: jest.fn(),
      getPaymentAccount: jest.fn(),
      updatePaymentAccount: jest.fn(),
      listPendingWithdrawals: jest.fn(),
      authorizeWithdrawal: jest.fn(),
      resendWithdrawalOtp: jest.fn(),
      settleAuctionPayment: jest.fn(),
      defaultAuctionPayment: jest.fn(),
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

  it('gets the bidding setting', async () => {
    service.getBiddingSetting.mockResolvedValue({
      biddingSetting: { bidRequirementPercent: 10 },
    });

    await expect(controller.getBiddingSetting()).resolves.toEqual({
      biddingSetting: { bidRequirementPercent: 10 },
    });
    expect(service.getBiddingSetting).toHaveBeenCalledWith();
  });

  it('updates the bidding setting', async () => {
    const dto: UpdateBiddingSettingDto = { bidRequirementPercent: 15 };
    service.updateBiddingSetting.mockResolvedValue({ biddingSetting: dto });

    await expect(
      controller.updateBiddingSetting(adminUser, dto),
    ).resolves.toEqual({ biddingSetting: dto });
    expect(service.updateBiddingSetting).toHaveBeenCalledWith(
      adminUser.id,
      dto,
    );
  });

  it('gets the payment account setting', async () => {
    service.getPaymentAccount.mockResolvedValue({ paymentAccount: null });

    await expect(controller.getPaymentAccount()).resolves.toEqual({
      paymentAccount: null,
    });
    expect(service.getPaymentAccount).toHaveBeenCalledWith();
  });

  it('updates the payment account setting', async () => {
    const dto: UpdatePaymentAccountDto = {
      bankName: 'Providus Bank',
      accountNumber: '3635734512',
      accountName: 'KcPele Auctions',
    };
    service.updatePaymentAccount.mockResolvedValue({ paymentAccount: dto });

    await expect(
      controller.updatePaymentAccount(adminUser, dto),
    ).resolves.toEqual({ paymentAccount: dto });
    expect(service.updatePaymentAccount).toHaveBeenCalledWith(
      adminUser.id,
      dto,
    );
  });

  it('lists pending wallet withdrawals', async () => {
    service.listPendingWithdrawals.mockResolvedValue({ withdrawals: [] });

    await expect(controller.listPendingWithdrawals()).resolves.toEqual({
      withdrawals: [],
    });
    expect(service.listPendingWithdrawals).toHaveBeenCalledWith();
  });

  it('authorizes a wallet withdrawal with OTP', async () => {
    const dto: AuthorizeWithdrawalDto = { authorizationCode: '886850' };
    service.authorizeWithdrawal.mockResolvedValue({
      withdrawal: { id: 'withdrawal-id' },
    });

    await expect(
      controller.authorizeWithdrawal('withdrawal-id', dto),
    ).resolves.toEqual({ withdrawal: { id: 'withdrawal-id' } });
    expect(service.authorizeWithdrawal).toHaveBeenCalledWith(
      'withdrawal-id',
      dto,
    );
  });

  it('resends a wallet withdrawal OTP', async () => {
    service.resendWithdrawalOtp.mockResolvedValue({
      providerResponse: { message: 'sent' },
    });

    await expect(
      controller.resendWithdrawalOtp('withdrawal-id'),
    ).resolves.toEqual({ providerResponse: { message: 'sent' } });
    expect(service.resendWithdrawalOtp).toHaveBeenCalledWith('withdrawal-id');
  });

  it('settles an auction payment', async () => {
    const dto: SettleAuctionPaymentDto = { externalPaymentKobo: 5000000 };
    service.settleAuctionPayment.mockResolvedValue({
      auction: { status: 'SETTLED' },
    });

    await expect(
      controller.settleAuctionPayment(adminUser, 'auction-id', dto),
    ).resolves.toEqual({ auction: { status: 'SETTLED' } });
    expect(service.settleAuctionPayment).toHaveBeenCalledWith(
      adminUser.id,
      'auction-id',
      dto,
    );
  });

  it('defaults an unpaid auction payment', async () => {
    const dto: DefaultAuctionPaymentDto = { reason: 'Not paid' };
    service.defaultAuctionPayment.mockResolvedValue({
      auction: { status: 'DEFAULTED' },
    });

    await expect(
      controller.defaultAuctionPayment('auction-id', dto),
    ).resolves.toEqual({ auction: { status: 'DEFAULTED' } });
    expect(service.defaultAuctionPayment).toHaveBeenCalledWith(
      'auction-id',
      dto,
    );
  });
});
