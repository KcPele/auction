import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AdminService } from './admin.service';
import { AuthorizeWithdrawalDto } from './dto/authorize-withdrawal.dto';
import { CreateAccessCodeDto } from './dto/create-access-code.dto';
import { GrantListingPermissionDto } from './dto/grant-listing-permission.dto';
import { ReviewListingApplicationDto } from './dto/review-listing-application.dto';
import { ReviewListingDto } from './dto/review-listing.dto';
import { UpdateBiddingSettingDto } from './dto/update-bidding-setting.dto';
import { UpdatePaymentAccountDto } from './dto/update-payment-account.dto';
import { UpdatePlatformFeeDto } from './dto/update-platform-fee.dto';

@ApiTags('admin')
@ApiCookieAuth('better-auth.session_token')
@Roles(UserRole.Admin)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('access-codes')
  @ApiOperation({ summary: 'Create a listing access code' })
  @ApiCreatedResponse({ description: 'Access code created.' })
  createAccessCode(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAccessCodeDto,
  ) {
    return this.adminService.createAccessCode(user.id, dto);
  }

  @Post('listing-permissions')
  @ApiOperation({ summary: 'Manually grant listing access to a user' })
  @ApiCreatedResponse({ description: 'Listing permission granted.' })
  grantListingPermission(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GrantListingPermissionDto,
  ) {
    return this.adminService.grantListingPermission(user.id, dto);
  }

  @Get('listing-access-applications/pending')
  @ApiOperation({ summary: 'List pending listing access applications' })
  @ApiOkResponse({ description: 'Pending applications returned.' })
  listPendingApplications() {
    return this.adminService.listPendingApplications();
  }

  @Get('listings/pending')
  @ApiOperation({ summary: 'List pending car and gadget listings' })
  @ApiOkResponse({ description: 'Pending listings returned.' })
  listPendingListings() {
    return this.adminService.listPendingListings();
  }

  @Post('listing-access-applications/:id/approve')
  @ApiOperation({ summary: 'Approve a listing access application' })
  @ApiCreatedResponse({ description: 'Application approved.' })
  approveApplication(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReviewListingApplicationDto,
  ) {
    return this.adminService.approveApplication(user.id, id, dto);
  }

  @Post('listing-access-applications/:id/reject')
  @ApiOperation({ summary: 'Reject a listing access application' })
  @ApiCreatedResponse({ description: 'Application rejected.' })
  rejectApplication(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReviewListingApplicationDto,
  ) {
    return this.adminService.rejectApplication(user.id, id, dto);
  }

  @Post('listings/:category/:id/approve')
  @ApiOperation({ summary: 'Approve a pending car or gadget listing' })
  @ApiCreatedResponse({ description: 'Listing approved.' })
  approveListing(
    @CurrentUser() user: AuthenticatedUser,
    @Param('category', new ParseEnumPipe(ListingCategory))
    category: ListingCategory,
    @Param('id') id: string,
    @Body() dto: ReviewListingDto,
  ) {
    return this.adminService.approveListing(user.id, category, id, dto);
  }

  @Post('listings/:category/:id/reject')
  @ApiOperation({ summary: 'Reject a pending car or gadget listing' })
  @ApiCreatedResponse({ description: 'Listing rejected.' })
  rejectListing(
    @CurrentUser() user: AuthenticatedUser,
    @Param('category', new ParseEnumPipe(ListingCategory))
    category: ListingCategory,
    @Param('id') id: string,
    @Body() dto: ReviewListingDto,
  ) {
    return this.adminService.rejectListing(user.id, category, id, dto);
  }

  @Get('settings/platform-fees')
  @ApiOperation({ summary: 'List active platform fee settings' })
  @ApiOkResponse({ description: 'Platform fee settings returned.' })
  listPlatformFees() {
    return this.adminService.listPlatformFees();
  }

  @Patch('settings/platform-fees')
  @ApiOperation({ summary: 'Update category platform fee split' })
  @ApiOkResponse({ description: 'Platform fee updated.' })
  updatePlatformFee(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePlatformFeeDto,
  ) {
    return this.adminService.updatePlatformFee(user.id, dto);
  }

  @Get('settings/bidding')
  @ApiOperation({ summary: 'Get bidding qualification setting' })
  @ApiOkResponse({ description: 'Bidding setting returned.' })
  getBiddingSetting() {
    return this.adminService.getBiddingSetting();
  }

  @Patch('settings/bidding')
  @ApiOperation({ summary: 'Update bidding qualification percentage' })
  @ApiOkResponse({ description: 'Bidding setting updated.' })
  updateBiddingSetting(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateBiddingSettingDto,
  ) {
    return this.adminService.updateBiddingSetting(user.id, dto);
  }

  @Get('settings/payment-account')
  @ApiOperation({ summary: 'Get winner payment account setting' })
  @ApiOkResponse({ description: 'Payment account returned.' })
  getPaymentAccount() {
    return this.adminService.getPaymentAccount();
  }

  @Patch('settings/payment-account')
  @ApiOperation({ summary: 'Update winner payment account setting' })
  @ApiOkResponse({ description: 'Payment account updated.' })
  updatePaymentAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePaymentAccountDto,
  ) {
    return this.adminService.updatePaymentAccount(user.id, dto);
  }

  @Get('wallet-withdrawals/pending')
  @ApiOperation({ summary: 'List wallet withdrawals awaiting authorization' })
  @ApiOkResponse({ description: 'Pending withdrawals returned.' })
  listPendingWithdrawals() {
    return this.adminService.listPendingWithdrawals();
  }

  @Post('wallet-withdrawals/:id/authorize')
  @ApiOperation({ summary: 'Authorize a Monnify wallet withdrawal with OTP' })
  @ApiCreatedResponse({ description: 'Withdrawal authorization submitted.' })
  authorizeWithdrawal(
    @Param('id') id: string,
    @Body() dto: AuthorizeWithdrawalDto,
  ) {
    return this.adminService.authorizeWithdrawal(id, dto);
  }

  @Post('wallet-withdrawals/:id/resend-otp')
  @ApiOperation({ summary: 'Resend Monnify withdrawal authorization OTP' })
  @ApiCreatedResponse({ description: 'Withdrawal OTP resend requested.' })
  resendWithdrawalOtp(@Param('id') id: string) {
    return this.adminService.resendWithdrawalOtp(id);
  }
}
