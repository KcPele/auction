import { All, Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import {
  ApiBody,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { IncomingHttpHeaders } from 'http';
import { AuthService } from './auth.service';
import { SignInEmailDto } from './dto/sign-in-email.dto';
import { SignUpEmailDto } from './dto/sign-up-email.dto';

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

  @Post('sign-out')
  @ApiOperation({ summary: 'Sign out the current Better Auth session' })
  @ApiOkResponse({ description: 'Signed out.' })
  signOut(@Req() request: AuthFastifyRequest, @Res() reply: AuthFastifyReply) {
    return this.forwardToBetterAuth(request, reply);
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

    response.headers.forEach((value, key) => reply.header(key, value));
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
