import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminDisputesService } from './admin-disputes.service';
import { AdminListingsService } from './admin-listings.service';
import { AdminMechanicsService } from './admin-mechanics.service';
import { AdminSettingsService } from './admin-settings.service';
import { AdminUsersService } from './admin-users.service';
import { AuthorizeWithdrawalDto } from './dto/authorize-withdrawal.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { CreateAccessCodeDto } from './dto/create-access-code.dto';
import { DefaultAuctionPaymentDto } from './dto/default-auction-payment.dto';
import { GrantListingPermissionDto } from './dto/grant-listing-permission.dto';
import { ListAccessCodesQueryDto } from './dto/list-access-codes-query.dto';
import { ListAdminAuctionsQueryDto } from './dto/list-admin-auctions-query.dto';
import { ListAdminLedgerQueryDto } from './dto/list-admin-ledger-query.dto';
import { ListAdminUsersQueryDto } from './dto/list-admin-users-query.dto';
import { ListDisputesQueryDto } from './dto/list-disputes-query.dto';
import { ListMechanicsQueryDto } from './dto/list-mechanics-query.dto';
import { ListNotificationLogsQueryDto } from './dto/list-notification-logs-query.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { ReviewListingApplicationDto } from './dto/review-listing-application.dto';
import { ReviewListingDto } from './dto/review-listing.dto';
import { SettleAuctionPaymentDto } from './dto/settle-auction-payment.dto';
import { UpdateBiddingSettingDto } from './dto/update-bidding-setting.dto';
import { UpdateEscrowSettingDto } from './dto/update-escrow-setting.dto';
import { UpdatePaymentAccountDto } from './dto/update-payment-account.dto';
import { UpdatePlatformFeeDto } from './dto/update-platform-fee.dto';
import { UpdatePlatformToggleDto } from './dto/update-platform-toggle.dto';
import { WalletWithdrawalsService } from '../wallets/wallet-withdrawals.service';
import { AuctionSettlementService } from '../auctions/auction-settlement.service';

@ApiTags('admin')
@ApiCookieAuth('better-auth.session_token')
@Roles(UserRole.Admin)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly dashboardService: AdminDashboardService,
    private readonly usersService: AdminUsersService,
    private readonly disputesService: AdminDisputesService,
    private readonly mechanicsService: AdminMechanicsService,
    private readonly listingsService: AdminListingsService,
    private readonly settingsService: AdminSettingsService,
    private readonly walletWithdrawalsService: WalletWithdrawalsService,
    private readonly auctionSettlementService: AuctionSettlementService,
  ) {}

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get admin dashboard KPIs' })
  @ApiOkResponse({ description: 'Dashboard stats returned.' })
  getDashboardStats(@Query('range') range = '24h') {
    return this.dashboardService.getDashboardStats(range);
  }

  @Get('activity-feed')
  @ApiOperation({ summary: 'Get live operations activity feed' })
  @ApiOkResponse({ description: 'Activity feed returned.' })
  getActivityFeed(@Query('limit') limit = 20, @Query('offset') offset = 0, @Query('type') type?: string) {
    return this.dashboardService.getActivityFeed(+limit, +offset, type);
  }

  @Get('auctions')
  @ApiOperation({ summary: 'List auctions with admin details' })
  @ApiOkResponse({ description: 'Admin auctions returned.' })
  listAdminAuctions(@Query() query: ListAdminAuctionsQueryDto) {
    return this.dashboardService.listAdminAuctions(query);
  }

  @Get('users')
  @ApiOperation({ summary: 'List and search users' })
  @ApiOkResponse({ description: 'Users returned.' })
  listUsers(@Query() query: ListAdminUsersQueryDto) {
    return this.usersService.listUsers(query);
  }

  @Post('users/:id/ban')
  @ApiOperation({ summary: 'Ban a user' })
  @ApiOkResponse({ description: 'User banned.' })
  banUser(@Param('id') id: string, @Body() dto: BanUserDto) {
    return this.usersService.banUser(id, dto);
  }

  @Post('users/:id/unban')
  @ApiOperation({ summary: 'Unban a user' })
  @ApiOkResponse({ description: 'User unbanned.' })
  unbanUser(@Param('id') id: string) {
    return this.usersService.unbanUser(id);
  }

  @Get('users/:id/wallet')
  @ApiOperation({ summary: 'View a user wallet and ledger' })
  @ApiOkResponse({ description: 'User wallet returned.' })
  getUserWallet(@Param('id') id: string) {
    return this.usersService.getUserWallet(id);
  }

  @Get('disputes')
  @ApiOperation({ summary: 'List disputes' })
  @ApiOkResponse({ description: 'Disputes returned.' })
  listDisputes(@Query() query: ListDisputesQueryDto) {
    return this.disputesService.listDisputes(query);
  }

  @Post('disputes/:id/investigate')
  @ApiOperation({ summary: 'Move a dispute to investigating status' })
  @ApiOkResponse({ description: 'Dispute updated.' })
  investigateDispute(@Param('id') id: string) {
    return this.disputesService.investigateDispute(id);
  }

  @Post('disputes/:id/resolve')
  @ApiOperation({ summary: 'Resolve a dispute' })
  @ApiOkResponse({ description: 'Dispute resolved.' })
  resolveDispute(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: ResolveDisputeDto) {
    return this.disputesService.resolveDispute(user.id, id, dto);
  }

  @Get('mechanics')
  @ApiOperation({ summary: 'List mechanics directory' })
  @ApiOkResponse({ description: 'Mechanics returned.' })
  listMechanics(@Query() query: ListMechanicsQueryDto) {
    return this.mechanicsService.listMechanics(query);
  }

  @Post('mechanics/:id/verify')
  @ApiOperation({ summary: 'Verify a mechanic' })
  @ApiOkResponse({ description: 'Mechanic verified.' })
  verifyMechanic(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.mechanicsService.verifyMechanic(user.id, id);
  }

  @Post('mechanics/:id/revoke')
  @ApiOperation({ summary: 'Revoke mechanic verification' })
  @ApiOkResponse({ description: 'Mechanic revoked.' })
  revokeMechanic(@Param('id') id: string) {
    return this.mechanicsService.revokeMechanic(id);
  }

  @Get('ledger')
  @ApiOperation({ summary: 'Admin payment ledger' })
  @ApiOkResponse({ description: 'Ledger returned.' })
  listAdminLedger(@Query() query: ListAdminLedgerQueryDto) {
    return this.dashboardService.listAdminLedger(query);
  }

  @Get('notification-logs')
  @ApiOperation({ summary: 'Notification delivery logs' })
  @ApiOkResponse({ description: 'Notification logs returned.' })
  listNotificationLogs(@Query() query: ListNotificationLogsQueryDto) {
    return this.dashboardService.listNotificationLogs(query);
  }

  @Get('settings/escrow')
  @ApiOperation({ summary: 'Get escrow/hold settings' })
  @ApiOkResponse({ description: 'Escrow settings returned.' })
  getEscrowSetting() {
    return this.settingsService.getEscrowSetting();
  }

  @Patch('settings/escrow')
  @ApiOperation({ summary: 'Update escrow/hold settings' })
  @ApiOkResponse({ description: 'Escrow settings updated.' })
  updateEscrowSetting(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateEscrowSettingDto) {
    return this.settingsService.updateEscrowSetting(user.id, dto);
  }

  @Get('settings/toggles')
  @ApiOperation({ summary: 'Get platform toggles' })
  @ApiOkResponse({ description: 'Platform toggles returned.' })
  getPlatformToggles() {
    return this.settingsService.getPlatformToggles();
  }

  @Patch('settings/toggles')
  @ApiOperation({ summary: 'Update platform toggles' })
  @ApiOkResponse({ description: 'Platform toggles updated.' })
  updatePlatformToggles(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdatePlatformToggleDto) {
    return this.settingsService.updatePlatformToggles(user.id, dto);
  }

  @Get('health')
  @ApiOperation({ summary: 'System health check per service' })
  @ApiOkResponse({ description: 'System health returned.' })
  getSystemHealth() {
    return this.dashboardService.getSystemHealth();
  }

  @Get('access-codes')
  @ApiOperation({ summary: 'List access codes' })
  @ApiOkResponse({ description: 'Access codes returned.' })
  listAccessCodes(@Query() query: ListAccessCodesQueryDto) {
    return this.listingsService.listAccessCodes(query);
  }

  @Post('access-codes')
  @ApiOperation({ summary: 'Create a listing access code' })
  @ApiCreatedResponse({ description: 'Access code created.' })
  createAccessCode(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAccessCodeDto) {
    return this.listingsService.createAccessCode(user.id, dto);
  }

  @Post('listing-permissions')
  @ApiOperation({ summary: 'Manually grant listing access to a user' })
  @ApiCreatedResponse({ description: 'Listing permission granted.' })
  grantListingPermission(@CurrentUser() user: AuthenticatedUser, @Body() dto: GrantListingPermissionDto) {
    return this.listingsService.grantListingPermission(user.id, dto);
  }

  @Get('listing-access-applications/pending')
  @ApiOperation({ summary: 'List pending listing access applications' })
  @ApiOkResponse({ description: 'Pending applications returned.' })
  listPendingApplications() {
    return this.listingsService.listPendingApplications();
  }

  @Get('listings/pending')
  @ApiOperation({ summary: 'List pending car and gadget listings' })
  @ApiOkResponse({ description: 'Pending listings returned.' })
  listPendingListings() {
    return this.listingsService.listPendingListings();
  }

  @Post('listing-access-applications/:id/approve')
  @ApiOperation({ summary: 'Approve a listing access application' })
  @ApiCreatedResponse({ description: 'Application approved.' })
  approveApplication(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: ReviewListingApplicationDto) {
    return this.listingsService.approveApplication(user.id, id, dto);
  }

  @Post('listing-access-applications/:id/reject')
  @ApiOperation({ summary: 'Reject a listing access application' })
  @ApiCreatedResponse({ description: 'Application rejected.' })
  rejectApplication(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: ReviewListingApplicationDto) {
    return this.listingsService.rejectApplication(user.id, id, dto);
  }

  @Post('listings/:category/:id/approve')
  @ApiOperation({ summary: 'Approve a pending car or gadget listing' })
  @ApiCreatedResponse({ description: 'Listing approved.' })
  approveListing(@CurrentUser() user: AuthenticatedUser, @Param('category', new ParseEnumPipe(ListingCategory)) category: ListingCategory, @Param('id') id: string, @Body() dto: ReviewListingDto) {
    return this.listingsService.approveListing(user.id, category, id, dto);
  }

  @Post('listings/:category/:id/reject')
  @ApiOperation({ summary: 'Reject a pending car or gadget listing' })
  @ApiCreatedResponse({ description: 'Listing rejected.' })
  rejectListing(@CurrentUser() user: AuthenticatedUser, @Param('category', new ParseEnumPipe(ListingCategory)) category: ListingCategory, @Param('id') id: string, @Body() dto: ReviewListingDto) {
    return this.listingsService.rejectListing(user.id, category, id, dto);
  }

  @Get('settings/platform-fees')
  @ApiOperation({ summary: 'List active platform fee settings' })
  @ApiOkResponse({ description: 'Platform fee settings returned.' })
  listPlatformFees() {
    return this.settingsService.listPlatformFees();
  }

  @Patch('settings/platform-fees')
  @ApiOperation({ summary: 'Update category platform fee split' })
  @ApiOkResponse({ description: 'Platform fee updated.' })
  updatePlatformFee(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdatePlatformFeeDto) {
    return this.settingsService.updatePlatformFee(user.id, dto);
  }

  @Get('settings/bidding')
  @ApiOperation({ summary: 'Get bidding qualification setting' })
  @ApiOkResponse({ description: 'Bidding setting returned.' })
  getBiddingSetting() {
    return this.settingsService.getBiddingSetting();
  }

  @Patch('settings/bidding')
  @ApiOperation({ summary: 'Update bidding qualification percentage' })
  @ApiOkResponse({ description: 'Bidding setting updated.' })
  updateBiddingSetting(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateBiddingSettingDto) {
    return this.settingsService.updateBiddingSetting(user.id, dto);
  }

  @Get('settings/payment-account')
  @ApiOperation({ summary: 'Get winner payment account setting' })
  @ApiOkResponse({ description: 'Payment account returned.' })
  getPaymentAccount() {
    return this.settingsService.getPaymentAccount();
  }

  @Patch('settings/payment-account')
  @ApiOperation({ summary: 'Update winner payment account setting' })
  @ApiOkResponse({ description: 'Payment account updated.' })
  updatePaymentAccount(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdatePaymentAccountDto) {
    return this.settingsService.updatePaymentAccount(user.id, dto);
  }

  @Get('wallet-withdrawals/pending')
  @ApiOperation({ summary: 'List wallet withdrawals awaiting authorization' })
  @ApiOkResponse({ description: 'Pending withdrawals returned.' })
  listPendingWithdrawals() {
    return this.walletWithdrawalsService.listPendingWithdrawals();
  }

  @Post('wallet-withdrawals/:id/authorize')
  @ApiOperation({ summary: 'Authorize a Monnify wallet withdrawal with OTP' })
  @ApiCreatedResponse({ description: 'Withdrawal authorization submitted.' })
  authorizeWithdrawal(@Param('id') id: string, @Body() dto: AuthorizeWithdrawalDto) {
    return this.walletWithdrawalsService.authorizeWithdrawal(id, dto.authorizationCode);
  }

  @Post('wallet-withdrawals/:id/resend-otp')
  @ApiOperation({ summary: 'Resend Monnify withdrawal authorization OTP' })
  @ApiCreatedResponse({ description: 'Withdrawal OTP resend requested.' })
  resendWithdrawalOtp(@Param('id') id: string) {
    return this.walletWithdrawalsService.resendWithdrawalOtp(id);
  }

  @Post('auctions/:id/settle-payment')
  @ApiOperation({ summary: 'Confirm winner payment and settle an auction' })
  @ApiCreatedResponse({ description: 'Auction payment settled.' })
  settleAuctionPayment(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: SettleAuctionPaymentDto) {
    return this.auctionSettlementService.settleAuctionPayment(user.id, id, dto);
  }

  @Post('auctions/:id/default-payment')
  @ApiOperation({ summary: 'Mark an unpaid auction winner as defaulted' })
  @ApiCreatedResponse({ description: 'Auction payment defaulted.' })
  defaultAuctionPayment(@Param('id') id: string, @Body() dto: DefaultAuctionPaymentDto) {
    return this.auctionSettlementService.defaultAuctionPayment(id, dto);
  }
}
