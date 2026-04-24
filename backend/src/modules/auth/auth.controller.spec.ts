import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { LoginDto } from './dto/login.dto';
import type { RefreshTokenDto } from './dto/refresh-token.dto';
import type { RegisterDto } from './dto/register.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let service: {
    register: jest.Mock;
    login: jest.Mock;
    refresh: jest.Mock;
    logout: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: service }],
    }).compile();

    controller = moduleRef.get(AuthController);
  });

  it('registers a user', async () => {
    const dto: RegisterDto = {
      email: 'buyer@example.com',
      phone: '+2348012345678',
      password: 'strongPassword123',
      firstName: 'Ada',
      lastName: 'Okafor',
    };
    service.register.mockResolvedValue({ accessToken: 'access' });

    await expect(controller.register(dto)).resolves.toEqual({
      accessToken: 'access',
    });
    expect(service.register).toHaveBeenCalledWith(dto);
  });

  it('logs a user in', async () => {
    const dto: LoginDto = {
      email: 'buyer@example.com',
      password: 'strongPassword123',
    };
    service.login.mockResolvedValue({ accessToken: 'access' });

    await expect(controller.login(dto)).resolves.toEqual({
      accessToken: 'access',
    });
    expect(service.login).toHaveBeenCalledWith(dto);
  });

  it('refreshes tokens', async () => {
    const dto: RefreshTokenDto = { refreshToken: 'refresh' };
    service.refresh.mockResolvedValue({ accessToken: 'new-access' });

    await expect(controller.refresh(dto)).resolves.toEqual({
      accessToken: 'new-access',
    });
    expect(service.refresh).toHaveBeenCalledWith(dto);
  });

  it('logs a user out', async () => {
    const dto: RefreshTokenDto = { refreshToken: 'refresh' };
    service.logout.mockResolvedValue({ success: true });

    await expect(controller.logout(dto)).resolves.toEqual({
      success: true,
    });
    expect(service.logout).toHaveBeenCalledWith(dto);
  });
});
