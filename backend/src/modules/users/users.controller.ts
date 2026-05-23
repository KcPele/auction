import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AddWatchlistDto } from './dto/add-watchlist.dto';
import { ApplyListingAccessDto } from './dto/apply-listing-access.dto';
import { ListUserBidsQueryDto } from './dto/list-user-bids-query.dto';
import { RedeemAccessCodeDto } from './dto/redeem-access-code.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiCookieAuth('better-auth.session_token')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the current user profile and permissions' })
  @ApiOkResponse({ description: 'Current user profile returned.' })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getMe(user.id, user.role);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update the current user profile' })
  @ApiOkResponse({ description: 'Profile updated.' })
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch('me/notification-preferences')
  @ApiOperation({ summary: 'Update WhatsApp, Email, Push and gadget ready-to-bid preferences' })
  @ApiOkResponse({ description: 'Notification preferences updated.' })
  updateNotificationPreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.usersService.updateNotificationPreferences(user.id, dto);
  }

  @Get('me/bids')
  @ApiOperation({ summary: "List the current user's bids across all auctions" })
  @ApiOkResponse({ description: 'User bids returned.' })
  listMyBids(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListUserBidsQueryDto,
  ) {
    return this.usersService.listMyBids(user.id, query);
  }

  @Get('me/won-auctions')
  @ApiOperation({ summary: 'List auctions the current user has won' })
  @ApiOkResponse({ description: 'Won auctions returned.' })
  listWonAuctions(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.listWonAuctions(user.id);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Get the current user bidding stats' })
  @ApiOkResponse({ description: 'User stats returned.' })
  getStats(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getStats(user.id);
  }

  @Get('me/listing-access-applications')
  @ApiOperation({ summary: "List the current user's listing access applications" })
  @ApiOkResponse({ description: 'Listing access applications returned.' })
  listApplications(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.listApplications(user.id);
  }

  @Get('me/watchlist')
  @ApiOperation({ summary: "List the current user's watchlist" })
  @ApiOkResponse({ description: 'Watchlist returned.' })
  listWatchlist(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.listWatchlist(user.id);
  }

  @Post('me/watchlist')
  @ApiOperation({ summary: 'Add an auction to the watchlist' })
  @ApiCreatedResponse({ description: 'Auction added to watchlist.' })
  addWatchlist(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddWatchlistDto,
  ) {
    return this.usersService.addWatchlist(user.id, dto.auctionId);
  }

  @Delete('me/watchlist/:auctionId')
  @ApiOperation({ summary: 'Remove an auction from the watchlist' })
  @ApiOkResponse({ description: 'Auction removed from watchlist.' })
  removeWatchlist(
    @CurrentUser() user: AuthenticatedUser,
    @Param('auctionId') auctionId: string,
  ) {
    return this.usersService.removeWatchlist(user.id, auctionId);
  }

  @Post('me/listing-access-applications')
  @ApiOperation({ summary: 'Apply for car or gadget listing access' })
  @ApiCreatedResponse({ description: 'Listing access application submitted.' })
  applyForListingAccess(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ApplyListingAccessDto,
  ) {
    return this.usersService.applyForListingAccess(user.id, dto);
  }

  @Post('me/access-codes/redeem')
  @ApiOperation({ summary: 'Redeem an admin-issued listing access code' })
  @ApiCreatedResponse({ description: 'Listing permission granted.' })
  redeemAccessCode(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RedeemAccessCodeDto,
  ) {
    return this.usersService.redeemAccessCode(user.id, dto);
  }
}
