import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { ApplyListingAccessDto } from './dto/apply-listing-access.dto';
import { RedeemAccessCodeDto } from './dto/redeem-access-code.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getMe(user.id);
  }

  @Patch('me')
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch('me/notification-preferences')
  updateNotificationPreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.usersService.updateNotificationPreferences(user.id, dto);
  }

  @Post('me/listing-access-applications')
  applyForListingAccess(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ApplyListingAccessDto,
  ) {
    return this.usersService.applyForListingAccess(user.id, dto);
  }

  @Post('me/access-codes/redeem')
  redeemAccessCode(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RedeemAccessCodeDto,
  ) {
    return this.usersService.redeemAccessCode(user.id, dto);
  }
}

