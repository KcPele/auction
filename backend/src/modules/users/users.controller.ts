import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { ApplyListingAccessDto } from './dto/apply-listing-access.dto';
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
    return this.usersService.getMe(user.id);
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
  @ApiOperation({ summary: 'Update WhatsApp and gadget ready-to-bid preferences' })
  @ApiOkResponse({ description: 'Notification preferences updated.' })
  updateNotificationPreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.usersService.updateNotificationPreferences(user.id, dto);
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
