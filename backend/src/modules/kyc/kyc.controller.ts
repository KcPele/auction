import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CreateSubaccountDto } from './dto/create-subaccount.dto';
import { ConfirmBvnDto } from './dto/confirm-bvn.dto';
import { VerifyBvnDto } from './dto/verify-bvn.dto';
import { VerifyNinDto } from './dto/verify-nin.dto';
import { KycService } from './kyc.service';

@ApiTags('kyc')
@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Get('status')
  @ApiCookieAuth('better-auth.session_token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get the current user KYC completion state' })
  @ApiOkResponse({ description: 'KYC completion state returned.' })
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.kycService.getStatus(user.id);
  }

  @Post('bvn/verify')
  @ApiCookieAuth('better-auth.session_token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify BVN with Strowallet' })
  @ApiOkResponse({ description: 'BVN verification result returned.' })
  verifyBvn(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VerifyBvnDto,
  ) {
    return this.kycService.verifyBvn(user.id, dto);
  }

  @Post('bvn/confirm')
  @ApiCookieAuth('better-auth.session_token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Confirm the OTP sent during BVN verification' })
  @ApiOkResponse({ description: 'BVN OTP confirmed.' })
  confirmBvn(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ConfirmBvnDto,
  ) {
    return this.kycService.confirmBvn(user.id, dto);
  }

  @Post('nin/verify')
  @ApiCookieAuth('better-auth.session_token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify NIN with Strowallet' })
  @ApiOkResponse({ description: 'NIN verification result returned.' })
  verifyNin(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VerifyNinDto,
  ) {
    return this.kycService.verifyNin(user.id, dto);
  }

  @Post('subaccount')
  @ApiCookieAuth('better-auth.session_token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a Strowallet subaccount for the user' })
  @ApiCreatedResponse({ description: 'Subaccount creation result returned.' })
  createSubaccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSubaccountDto,
  ) {
    return this.kycService.createSubaccount(user.id, dto);
  }
}
