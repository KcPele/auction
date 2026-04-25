import { Test } from '@nestjs/testing';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AuctionSettlementService } from '../auctions/auction-settlement.service';
import { AuthService } from '../auth/auth.service';
import { WalletWithdrawalsService } from '../wallets/wallet-withdrawals.service';
import { AdminController } from './admin.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminDisputesService } from './admin-disputes.service';
import { AdminListingsService } from './admin-listings.service';
import { AdminMechanicsService } from './admin-mechanics.service';
import { AdminSettingsService } from './admin-settings.service';
import { AdminUsersService } from './admin-users.service';
import type { AuthorizeWithdrawalDto } from './dto/authorize-withdrawal.dto';
import type { CreateAccessCodeDto } from './dto/create-access-code.dto';
import type { DefaultAuctionPaymentDto } from './dto/default-auction-payment.dto';
import type { GrantListingPermissionDto } from './dto/grant-listing-permission.dto';
import type { ReviewListingApplicationDto } from './dto/review-listing-application.dto';
import type { ReviewListingDto } from './dto/review-listing.dto';
import type { SettleAuctionPaymentDto } from './dto/settle-auction-payment.dto';
import type { UpdateBiddingSettingDto } from './dto/update-bidding-setting.dto';
import type { UpdatePaymentAccountDto } from './dto/update-payment-account.dto';
import type { UpdatePlatformFeeDto } from './dto/update-platform-fee.dto';

describe('AdminController', () => {
  const adminUser: AuthenticatedUser = { id: '22222222-2222-2222-2222-222222222222', role: UserRole.Admin, authRole: 'admin', sessionId: 'session-id' };
  let controller: AdminController;
  let dashboard: { getDashboardStats: jest.Mock; getActivityFeed: jest.Mock; listAdminAuctions: jest.Mock; listAdminLedger: jest.Mock; listNotificationLogs: jest.Mock; getSystemHealth: jest.Mock };
  let users: { listUsers: jest.Mock; banUser: jest.Mock; unbanUser: jest.Mock; getUserWallet: jest.Mock };
  let disputes: { listDisputes: jest.Mock; investigateDispute: jest.Mock; resolveDispute: jest.Mock };
  let mechanics: { listMechanics: jest.Mock; verifyMechanic: jest.Mock; revokeMechanic: jest.Mock };
  let listings: { listAccessCodes: jest.Mock; createAccessCode: jest.Mock; grantListingPermission: jest.Mock; listPendingApplications: jest.Mock; approveApplication: jest.Mock; rejectApplication: jest.Mock; listPendingListings: jest.Mock; approveListing: jest.Mock; rejectListing: jest.Mock };
  let settings: { listPlatformFees: jest.Mock; updatePlatformFee: jest.Mock; getBiddingSetting: jest.Mock; updateBiddingSetting: jest.Mock; getPaymentAccount: jest.Mock; updatePaymentAccount: jest.Mock; getEscrowSetting: jest.Mock; updateEscrowSetting: jest.Mock; getPlatformToggles: jest.Mock; updatePlatformToggles: jest.Mock };
  let withdrawals: { listPendingWithdrawals: jest.Mock; authorizeWithdrawal: jest.Mock; resendWithdrawalOtp: jest.Mock };
  let settlement: { settleAuctionPayment: jest.Mock; defaultAuctionPayment: jest.Mock };

  beforeEach(async () => {
    dashboard = { getDashboardStats: jest.fn(), getActivityFeed: jest.fn(), listAdminAuctions: jest.fn(), listAdminLedger: jest.fn(), listNotificationLogs: jest.fn(), getSystemHealth: jest.fn() };
    users = { listUsers: jest.fn(), banUser: jest.fn(), unbanUser: jest.fn(), getUserWallet: jest.fn() };
    disputes = { listDisputes: jest.fn(), investigateDispute: jest.fn(), resolveDispute: jest.fn() };
    mechanics = { listMechanics: jest.fn(), verifyMechanic: jest.fn(), revokeMechanic: jest.fn() };
    listings = { listAccessCodes: jest.fn(), createAccessCode: jest.fn(), grantListingPermission: jest.fn(), listPendingApplications: jest.fn(), approveApplication: jest.fn(), rejectApplication: jest.fn(), listPendingListings: jest.fn(), approveListing: jest.fn(), rejectListing: jest.fn() };
    settings = { listPlatformFees: jest.fn(), updatePlatformFee: jest.fn(), getBiddingSetting: jest.fn(), updateBiddingSetting: jest.fn(), getPaymentAccount: jest.fn(), updatePaymentAccount: jest.fn(), getEscrowSetting: jest.fn(), updateEscrowSetting: jest.fn(), getPlatformToggles: jest.fn(), updatePlatformToggles: jest.fn() };
    withdrawals = { listPendingWithdrawals: jest.fn(), authorizeWithdrawal: jest.fn(), resendWithdrawalOtp: jest.fn() };
    settlement = { settleAuctionPayment: jest.fn(), defaultAuctionPayment: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminDashboardService, useValue: dashboard },
        { provide: AdminUsersService, useValue: users },
        { provide: AdminDisputesService, useValue: disputes },
        { provide: AdminMechanicsService, useValue: mechanics },
        { provide: AdminListingsService, useValue: listings },
        { provide: AdminSettingsService, useValue: settings },
        { provide: WalletWithdrawalsService, useValue: withdrawals },
        { provide: AuctionSettlementService, useValue: settlement },
        { provide: AuthService, useValue: { getAuthenticatedUser: jest.fn() } },
      ],
    }).compile();

    controller = moduleRef.get(AdminController);
  });

  it('creates an access code', async () => {
    const dto: CreateAccessCodeDto = { category: ListingCategory.Car };
    listings.createAccessCode.mockResolvedValue({ accessCode: dto });
    await expect(controller.createAccessCode(adminUser, dto)).resolves.toEqual({ accessCode: dto });
    expect(listings.createAccessCode).toHaveBeenCalledWith(adminUser.id, dto);
  });

  it('grants listing permission manually', async () => {
    const dto: GrantListingPermissionDto = { userId: '33333333-3333-3333-3333-333333333333', category: ListingCategory.Gadget };
    listings.grantListingPermission.mockResolvedValue({ listingPermission: dto });
    await expect(controller.grantListingPermission(adminUser, dto)).resolves.toEqual({ listingPermission: dto });
    expect(listings.grantListingPermission).toHaveBeenCalledWith(adminUser.id, dto);
  });

  it('lists pending listing access applications', async () => {
    listings.listPendingApplications.mockResolvedValue({ applications: [] });
    await expect(controller.listPendingApplications()).resolves.toEqual({ applications: [] });
  });

  it('approves a listing access application', async () => {
    const dto: ReviewListingApplicationDto = { reviewNote: 'Approved' };
    listings.approveApplication.mockResolvedValue({ application: { id: 'app' } });
    await expect(controller.approveApplication(adminUser, 'app', dto)).resolves.toEqual({ application: { id: 'app' } });
    expect(listings.approveApplication).toHaveBeenCalledWith(adminUser.id, 'app', dto);
  });

  it('rejects a listing access application', async () => {
    const dto: ReviewListingApplicationDto = { reviewNote: 'Rejected' };
    listings.rejectApplication.mockResolvedValue({ application: { id: 'app' } });
    await expect(controller.rejectApplication(adminUser, 'app', dto)).resolves.toEqual({ application: { id: 'app' } });
    expect(listings.rejectApplication).toHaveBeenCalledWith(adminUser.id, 'app', dto);
  });

  it('lists pending car and gadget listings', async () => {
    listings.listPendingListings.mockResolvedValue({ carListings: [], gadgetListings: [] });
    await expect(controller.listPendingListings()).resolves.toEqual({ carListings: [], gadgetListings: [] });
  });

  it('approves a pending listing', async () => {
    const dto: ReviewListingDto = { reviewNote: 'Ready' };
    listings.approveListing.mockResolvedValue({ carListing: { id: 'car-id' } });
    await expect(controller.approveListing(adminUser, ListingCategory.Car, 'car-id', dto)).resolves.toEqual({ carListing: { id: 'car-id' } });
    expect(listings.approveListing).toHaveBeenCalledWith(adminUser.id, ListingCategory.Car, 'car-id', dto);
  });

  it('rejects a pending listing', async () => {
    const dto: ReviewListingDto = { reviewNote: 'Missing photos' };
    listings.rejectListing.mockResolvedValue({ gadgetListing: { id: 'gadget-id' } });
    await expect(controller.rejectListing(adminUser, ListingCategory.Gadget, 'gadget-id', dto)).resolves.toEqual({ gadgetListing: { id: 'gadget-id' } });
    expect(listings.rejectListing).toHaveBeenCalledWith(adminUser.id, ListingCategory.Gadget, 'gadget-id', dto);
  });

  it('lists platform fee settings', async () => {
    settings.listPlatformFees.mockResolvedValue({ platformFees: [] });
    await expect(controller.listPlatformFees()).resolves.toEqual({ platformFees: [] });
  });

  it('updates a platform fee setting', async () => {
    const dto: UpdatePlatformFeeDto = { category: ListingCategory.Car, sellerFeeBps: 300, buyerFeeBps: 0 };
    settings.updatePlatformFee.mockResolvedValue({ platformFee: dto });
    await expect(controller.updatePlatformFee(adminUser, dto)).resolves.toEqual({ platformFee: dto });
    expect(settings.updatePlatformFee).toHaveBeenCalledWith(adminUser.id, dto);
  });

  it('gets the bidding setting', async () => {
    settings.getBiddingSetting.mockResolvedValue({ biddingSetting: { bidRequirementPercent: 10 } });
    await expect(controller.getBiddingSetting()).resolves.toEqual({ biddingSetting: { bidRequirementPercent: 10 } });
  });

  it('updates the bidding setting', async () => {
    const dto: UpdateBiddingSettingDto = { bidRequirementPercent: 15 };
    settings.updateBiddingSetting.mockResolvedValue({ biddingSetting: dto });
    await expect(controller.updateBiddingSetting(adminUser, dto)).resolves.toEqual({ biddingSetting: dto });
    expect(settings.updateBiddingSetting).toHaveBeenCalledWith(adminUser.id, dto);
  });

  it('gets the payment account setting', async () => {
    settings.getPaymentAccount.mockResolvedValue({ paymentAccount: null });
    await expect(controller.getPaymentAccount()).resolves.toEqual({ paymentAccount: null });
  });

  it('updates the payment account setting', async () => {
    const dto: UpdatePaymentAccountDto = { bankName: 'Providus Bank', accountNumber: '3635734512', accountName: 'KcPele Auctions' };
    settings.updatePaymentAccount.mockResolvedValue({ paymentAccount: dto });
    await expect(controller.updatePaymentAccount(adminUser, dto)).resolves.toEqual({ paymentAccount: dto });
    expect(settings.updatePaymentAccount).toHaveBeenCalledWith(adminUser.id, dto);
  });

  it('lists pending wallet withdrawals', async () => {
    withdrawals.listPendingWithdrawals.mockResolvedValue({ withdrawals: [] });
    await expect(controller.listPendingWithdrawals()).resolves.toEqual({ withdrawals: [] });
  });

  it('authorizes a wallet withdrawal with OTP', async () => {
    const dto: AuthorizeWithdrawalDto = { authorizationCode: '886850' };
    withdrawals.authorizeWithdrawal.mockResolvedValue({ withdrawal: { id: 'withdrawal-id' } });
    await expect(controller.authorizeWithdrawal('withdrawal-id', dto)).resolves.toEqual({ withdrawal: { id: 'withdrawal-id' } });
    expect(withdrawals.authorizeWithdrawal).toHaveBeenCalledWith('withdrawal-id', '886850');
  });

  it('resends a wallet withdrawal OTP', async () => {
    withdrawals.resendWithdrawalOtp.mockResolvedValue({ providerResponse: { message: 'sent' } });
    await expect(controller.resendWithdrawalOtp('withdrawal-id')).resolves.toEqual({ providerResponse: { message: 'sent' } });
  });

  it('settles an auction payment', async () => {
    const dto: SettleAuctionPaymentDto = { externalPaymentKobo: 5000000 };
    settlement.settleAuctionPayment.mockResolvedValue({ auction: { status: 'SETTLED' } });
    await expect(controller.settleAuctionPayment(adminUser, 'auction-id', dto)).resolves.toEqual({ auction: { status: 'SETTLED' } });
    expect(settlement.settleAuctionPayment).toHaveBeenCalledWith(adminUser.id, 'auction-id', dto);
  });

  it('defaults an unpaid auction payment', async () => {
    const dto: DefaultAuctionPaymentDto = { reason: 'Not paid' };
    settlement.defaultAuctionPayment.mockResolvedValue({ auction: { status: 'DEFAULTED' } });
    await expect(controller.defaultAuctionPayment('auction-id', dto)).resolves.toEqual({ auction: { status: 'DEFAULTED' } });
    expect(settlement.defaultAuctionPayment).toHaveBeenCalledWith('auction-id', dto);
  });
});
