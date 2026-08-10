import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Repository } from 'typeorm';
import type { EmailService } from '../../common/email/email.service';
import { UserRole } from '../../common/enums/user-role.enum';
import type { NotificationPreference } from '../users/entities/notification-preference.entity';
import type { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';

type AuthTestSurface = {
  getAuth: () => Promise<{
    api: { getSession: jest.Mock };
  }>;
  getNodeHelpers: () => Promise<{
    fromNodeHeaders: (headers: object) => Headers;
  }>;
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
});
