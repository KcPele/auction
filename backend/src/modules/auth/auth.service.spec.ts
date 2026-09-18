import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Repository } from 'typeorm';
import type { EmailService } from '../../common/email/email.service';
import { UserRole } from '../../common/enums/user-role.enum';
import type { NotificationPreference } from '../users/entities/notification-preference.entity';
import type { User } from '../users/entities/user.entity';
import type { MechanicProfile } from '../admin/entities/mechanic-profile.entity';
import { AuthService } from './auth.service';

type AuthTestSurface = {
  getAuth: () => Promise<{
    api: { getSession: jest.Mock; signInEmail?: jest.Mock };
  }>;
  getNodeHelpers: () => Promise<{
    fromNodeHeaders: (headers: object) => Headers;
  }>;
};

type AuthProfileSurface = {
  createAppProfile: (user: {
    id: string;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    appRole: string;
  }) => Promise<void>;
};

describe('AuthService access enforcement', () => {
  const getSession = jest.fn();
  const findOneBy = jest.fn();
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      {} as ConfigService,
      { findOneBy } as unknown as Repository<User>,
      {} as Repository<NotificationPreference>,
      {} as Repository<MechanicProfile>,
      {} as EmailService,
    );

    const surface = service as unknown as AuthTestSurface;
    surface.getAuth = async () => ({ api: { getSession } });
    surface.getNodeHelpers = async () => ({
      fromNodeHeaders: () => new Headers(),
    });

    getSession.mockResolvedValue({
      user: { id: 'user-id', role: 'user' },
      session: { id: 'session-id' },
    });
  });

  it('rejects an authenticated user who has been banned', async () => {
    findOneBy.mockResolvedValue({
      id: 'user-id',
      role: UserRole.IndividualBidder,
      isActive: true,
      isBanned: true,
    });

    await expect(service.getAuthenticatedUser({})).rejects.toThrow(
      new UnauthorizedException('Account access is disabled'),
    );
  });

  it('returns the effective app role for an active user', async () => {
    findOneBy.mockResolvedValue({
      id: 'user-id',
      role: UserRole.CarDealer,
      isActive: true,
      isBanned: false,
    });

    await expect(service.getAuthenticatedUser({})).resolves.toEqual({
      id: 'user-id',
      role: UserRole.CarDealer,
      authRole: 'user',
      sessionId: 'session-id',
    });
  });

  it('requests a raw Better Auth response for phone sign in', async () => {
    const signInEmail = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ token: 'session' }), { status: 200 }),
    );
    findOneBy.mockResolvedValue({
      email: 'buyer@example.com',
      phone: '+2348012345678',
    });
    const surface = service as unknown as AuthTestSurface;
    surface.getAuth = async () => ({ api: { getSession, signInEmail } });

    await service.signInWithPhone(
      '+2348012345678',
      'strongPassword123',
      {},
    );

    expect(signInEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        asResponse: true,
        body: {
          email: 'buyer@example.com',
          password: 'strongPassword123',
        },
      }),
    );
  });

  it('creates a pending mechanic profile for mechanic registration', async () => {
    const users = createSavingRepository();
    const preferences = createSavingRepository();
    const mechanics = createSavingRepository();
    const profileService = new AuthService(
      {} as ConfigService,
      users as unknown as Repository<User>,
      preferences as unknown as Repository<NotificationPreference>,
      mechanics as unknown as Repository<MechanicProfile>,
      {} as EmailService,
    );

    await (
      profileService as unknown as AuthProfileSurface
    ).createAppProfile({
      id: 'mechanic-user-id',
      email: 'mechanic@example.com',
      phone: '+2348012345678',
      firstName: 'Tunde',
      lastName: 'Mechanic',
      appRole: UserRole.Mechanic,
    });

    expect(users.save).toHaveBeenCalledWith(
      expect.objectContaining({ role: UserRole.Mechanic }),
    );
    expect(mechanics.save).toHaveBeenCalledWith({
      userId: 'mechanic-user-id',
    });
  });

  it('rejects registration when email already exists', async () => {
    const existsBy = jest.fn().mockImplementation(({ email }: { email?: string }) => {
      return Promise.resolve(email === 'existing@example.com');
    });
    const validateService = new AuthService(
      {} as ConfigService,
      { existsBy } as unknown as Repository<User>,
      {} as Repository<NotificationPreference>,
      {} as Repository<MechanicProfile>,
      {} as EmailService,
    );

    await expect(
      validateService.validateSignUp('existing@example.com', '+2348011111111'),
    ).rejects.toThrow('An account with this email already exists');
  });

  it('rejects registration when phone already exists', async () => {
    const existsBy = jest.fn().mockImplementation(({ phone }: { phone?: string }) => {
      return Promise.resolve(phone === '+2348019736590');
    });
    const validateService = new AuthService(
      {} as ConfigService,
      { existsBy } as unknown as Repository<User>,
      {} as Repository<NotificationPreference>,
      {} as Repository<MechanicProfile>,
      {} as EmailService,
    );

    await expect(
      validateService.validateSignUp('new@example.com', '+2348019736590'),
    ).rejects.toThrow('An account with this phone number already exists');
  });
});

function createSavingRepository() {
  return {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
  };
}
