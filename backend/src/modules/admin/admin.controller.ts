import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AdminService } from './admin.service';
import { CreateAccessCodeDto } from './dto/create-access-code.dto';
import { GrantListingPermissionDto } from './dto/grant-listing-permission.dto';
import { ReviewListingApplicationDto } from './dto/review-listing-application.dto';
import { UpdatePlatformFeeDto } from './dto/update-platform-fee.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Roles(UserRole.Admin)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('access-codes')
  createAccessCode(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAccessCodeDto,
  ) {
    return this.adminService.createAccessCode(user.id, dto);
  }

  @Post('listing-permissions')
  grantListingPermission(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GrantListingPermissionDto,
  ) {
    return this.adminService.grantListingPermission(user.id, dto);
  }

  @Get('listing-access-applications/pending')
  listPendingApplications() {
    return this.adminService.listPendingApplications();
  }

  @Post('listing-access-applications/:id/approve')
  approveApplication(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReviewListingApplicationDto,
  ) {
    return this.adminService.approveApplication(user.id, id, dto);
  }

  @Post('listing-access-applications/:id/reject')
  rejectApplication(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReviewListingApplicationDto,
  ) {
    return this.adminService.rejectApplication(user.id, id, dto);
  }

  @Get('settings/platform-fees')
  listPlatformFees() {
    return this.adminService.listPlatformFees();
  }

  @Patch('settings/platform-fees')
  updatePlatformFee(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePlatformFeeDto,
  ) {
    return this.adminService.updatePlatformFee(user.id, dto);
  }
}

