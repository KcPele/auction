import { All, Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { IncomingHttpHeaders } from 'http';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendVerificationOtpDto } from './dto/send-verification-otp.dto';
import { SignInEmailDto } from './dto/sign-in-email.dto';
import { SignInPhoneDto } from './dto/sign-in-phone.dto';
import { SignUpEmailDto } from './dto/sign-up-email.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { VerifyNinDto } from './dto/verify-nin.dto';

type AuthFastifyRequest = {
  method: string;
  url: string;
  body?: unknown;
  raw: {
    url?: string;
    headers: IncomingHttpHeaders;
  };
};

type AuthFastifyReply = {
  header: (key: string, value: string) => AuthFastifyReply;
  status: (statusCode: number) => AuthFastifyReply;
  send: (body: unknown) => unknown;
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up/email')
  @ApiOperation({ summary: 'Create a Better Auth email/password account' })
  @ApiBody({ type: SignUpEmailDto })
  @ApiOkResponse({
    description: 'Account created. Better Auth also sets the session cookie.',
  })
  signUpEmail(
    @Body() _dto: SignUpEmailDto,
    @Req() request: AuthFastifyRequest,
    @Res() reply: AuthFastifyReply,
  ) {
    return this.forwardToBetterAuth(request, reply);
  }

  @Post('sign-in/email')
  @ApiOperation({ summary: 'Sign in with Better Auth email/password' })
  @ApiBody({ type: SignInEmailDto })
  @ApiOkResponse({
    description: 'Signed in. Better Auth also sets the session cookie.',
  })
  signInEmail(
    @Body() _dto: SignInEmailDto,
    @Req() request: AuthFastifyRequest,
    @Res() reply: AuthFastifyReply,
  ) {
    return this.forwardToBetterAuth(request, reply);
  }

  @Post('sign-in/phone')
  @ApiOperation({ summary: 'Sign in with phone number and password' })
  @ApiBody({ type: SignInPhoneDto })
  @ApiOkResponse({
    description: 'Signed in via phone. Better Auth sets the session cookie.',
  })
  async signInPhone(
    @Body() dto: SignInPhoneDto,
    @Req() request: AuthFastifyRequest,
    @Res() reply: AuthFastifyReply,
  ) {
    const response = await this.authService.signInWithPhone(
      dto.phone,
      dto.password,
      request.raw.headers,
    );
    const text = await response.text();

    response.headers.forEach((value, key) => reply.header(key, value));
    reply.status(response.status);

    return reply.send(this.parseBody(text, response.headers.get('content-type')));
  }

  @Post('sign-out')
  @ApiOperation({ summary: 'Sign out the current Better Auth session' })
  @ApiOkResponse({ description: 'Signed out.' })
  signOut(@Req() request: AuthFastifyRequest, @Res() reply: AuthFastifyReply) {
    return this.forwardToBetterAuth(request, reply);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset token' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiOkResponse({ description: 'Password reset email sent.' })
  forgotPassword(
    @Body() _dto: ForgotPasswordDto,
    @Req() request: AuthFastifyRequest,
    @Res() reply: AuthFastifyReply,
  ) {
    return this.forwardToBetterAuth(request, reply);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using a valid reset token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiOkResponse({ description: 'Password reset successful.' })
  resetPassword(
    @Body() _dto: ResetPasswordDto,
    @Req() request: AuthFastifyRequest,
    @Res() reply: AuthFastifyReply,
  ) {
    return this.forwardToBetterAuth(request, reply);
  }

  @Post('send-verification-otp')
  @ApiOperation({ summary: 'Send email verification OTP' })
  @ApiBody({ type: SendVerificationOtpDto })
  @ApiOkResponse({ description: 'Verification OTP sent.' })
  sendVerificationOtp(
    @Body() _dto: SendVerificationOtpDto,
    @Req() request: AuthFastifyRequest,
    @Res() reply: AuthFastifyReply,
  ) {
    return this.forwardToBetterAuth(request, reply);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email with OTP' })
  @ApiBody({ type: VerifyEmailDto })
  @ApiOkResponse({ description: 'Email verified.' })
  verifyEmail(
    @Body() _dto: VerifyEmailDto,
    @Req() request: AuthFastifyRequest,
    @Res() reply: AuthFastifyReply,
  ) {
    return this.forwardToBetterAuth(request, reply);
  }

  @Post('verify-nin')
  @ApiCookieAuth('better-auth.session_token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify NIN' })
  @ApiOkResponse({ description: 'NIN verification result.' })
  async verifyNin(@Body() dto: VerifyNinDto) {
    return this.authService.verifyNin(dto.nin);
  }

  @Get('get-session')
  @ApiOperation({ summary: 'Return the current Better Auth session' })
  @ApiOkResponse({ description: 'Current session returned.' })
  getSession(
    @Req() request: AuthFastifyRequest,
    @Res() reply: AuthFastifyReply,
  ) {
    return this.forwardToBetterAuth(request, reply);
  }

  @All('*')
  @ApiExcludeEndpoint()
  handleAuth(
    @Req() request: AuthFastifyRequest,
    @Res() reply: AuthFastifyReply,
  ) {
    return this.forwardToBetterAuth(request, reply);
  }

  private async forwardToBetterAuth(
    request: AuthFastifyRequest,
    reply: AuthFastifyReply,
  ) {
    const response = await this.authService.handleRequest({
      method: request.method,
      url: request.raw.url ?? request.url,
      body: request.body,
      headers: request.raw.headers,
    });
    const text = await response.text();

    response.headers.forEach((value: string, key: string) => reply.header(key, value));
    reply.status(response.status);

    return reply.send(this.parseBody(text, response.headers.get('content-type')));
  }

  private parseBody(text: string, contentType: string | null) {
    if (!text) {
      return null;
    }

    if (!contentType?.includes('application/json')) {
      return text;
    }

    return JSON.parse(text) as unknown;
  }
}
