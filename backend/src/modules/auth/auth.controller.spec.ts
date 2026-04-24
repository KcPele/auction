import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { SignInEmailDto } from './dto/sign-in-email.dto';
import type { SignUpEmailDto } from './dto/sign-up-email.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let service: { handleRequest: jest.Mock };

  beforeEach(async () => {
    service = { handleRequest: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: service }],
    }).compile();

    controller = moduleRef.get(AuthController);
  });

  it('forwards email sign up to Better Auth', async () => {
    const dto: SignUpEmailDto = {
      name: 'Ada Okafor',
      email: 'buyer@example.com',
      password: 'strongPassword123',
      phone: '+2348012345678',
      firstName: 'Ada',
      lastName: 'Okafor',
    };
    const { request, reply } = createRequest(
      'POST',
      '/api/v1/auth/sign-up/email',
      dto,
    );
    service.handleRequest.mockResolvedValue(jsonResponse({ token: 'session' }));

    await controller.signUpEmail(dto, request, reply);

    expect(service.handleRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: '/api/v1/auth/sign-up/email',
      body: dto,
      headers: request.raw.headers,
    });
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({ token: 'session' });
  });

  it('forwards email sign in to Better Auth', async () => {
    const dto: SignInEmailDto = {
      email: 'buyer@example.com',
      password: 'strongPassword123',
    };
    const { request, reply } = createRequest(
      'POST',
      '/api/v1/auth/sign-in/email',
      dto,
    );
    service.handleRequest.mockResolvedValue(jsonResponse({ token: 'session' }));

    await controller.signInEmail(dto, request, reply);

    expect(service.handleRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: '/api/v1/auth/sign-in/email',
      body: dto,
      headers: request.raw.headers,
    });
    expect(reply.send).toHaveBeenCalledWith({ token: 'session' });
  });

  it('forwards sign out to Better Auth', async () => {
    const { request, reply } = createRequest(
      'POST',
      '/api/v1/auth/sign-out',
      undefined,
    );
    service.handleRequest.mockResolvedValue(jsonResponse({ success: true }));

    await controller.signOut(request, reply);

    expect(reply.send).toHaveBeenCalledWith({ success: true });
  });

  it('forwards session lookups to Better Auth', async () => {
    const { request, reply } = createRequest(
      'GET',
      '/api/v1/auth/get-session',
      undefined,
    );
    service.handleRequest.mockResolvedValue(jsonResponse({ user: null }));

    await controller.getSession(request, reply);

    expect(reply.send).toHaveBeenCalledWith({ user: null });
  });
});

function createRequest(method: string, url: string, body: unknown) {
  return {
    request: {
      method,
      url,
      raw: {
        url,
        headers: { host: 'localhost:4000' },
      },
      body,
    },
    reply: {
      header: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    },
  };
}

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
