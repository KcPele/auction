import { Body, Controller, Post, UseGuards } from '@nestjs/common';
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
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyBvnDto } from './dto/verify-bvn.dto';
import { VerifyNinDto } from './dto/verify-nin.dto';
import { KycService } from './kyc.service';

@ApiTags('kyc')
@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('bvn/verify')
  @ApiCookieAuth('better-auth.session_token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify BVN with Strowallet' })
  @ApiOkResponse({ description: 'BVN verification result returned.' })
  verifyBvn(@Body() dto: VerifyBvnDto) {
    return this.kycService.verifyBvn(dto);
  }

  @Post('nin/verify')
  @ApiCookieAuth('better-auth.session_token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify NIN with Strowallet' })
  @ApiOkResponse({ description: 'NIN verification result returned.' })
  verifyNin(@Body() dto: VerifyNinDto) {
    return this.kycService.verifyNin(dto);
  }

  @Post('otp/send')
  @ApiOperation({ summary: 'Send an OTP SMS with Strowallet' })
  @ApiCreatedResponse({ description: 'OTP request submitted.' })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.kycService.sendOtp(dto);
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
