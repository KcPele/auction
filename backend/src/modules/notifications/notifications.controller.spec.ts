import { Test } from '@nestjs/testing';
import { UserRole } from '../../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AuthService } from '../auth/auth.service';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  const user: AuthenticatedUser = {
    id: '11111111-1111-1111-1111-111111111111',
    role: UserRole.IndividualBidder,
    authRole: 'user',
    sessionId: 'session-id',
  };
  let controller: NotificationsController;
  let service: {
    listForUser: jest.Mock;
    markRead: jest.Mock;
    markAllRead: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      listForUser: jest.fn(),
      markRead: jest.fn(),
      markAllRead: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: service },
        { provide: AuthService, useValue: { getAuthenticatedUser: jest.fn() } },
      ],
    }).compile();

    controller = moduleRef.get(NotificationsController);
  });

  it('lists current user notifications', async () => {
    const query = new ListNotificationsQueryDto();
    service.listForUser.mockResolvedValue({ notifications: [] });

    await expect(controller.list(user, query)).resolves.toEqual({
      notifications: [],
    });
    expect(service.listForUser).toHaveBeenCalledWith(user, query);
  });

  it('marks one notification as read', async () => {
    service.markRead.mockResolvedValue({ notificationRead: { id: 'read-id' } });

    await expect(controller.markRead(user, 'notification-id')).resolves.toEqual({
      notificationRead: { id: 'read-id' },
    });
    expect(service.markRead).toHaveBeenCalledWith(user, 'notification-id');
  });

  it('marks all visible notifications as read', async () => {
    service.markAllRead.mockResolvedValue({
      notificationReads: [],
      updatedCount: 0,
    });

    await expect(controller.markAllRead(user)).resolves.toEqual({
      notificationReads: [],
      updatedCount: 0,
    });
    expect(service.markAllRead).toHaveBeenCalledWith(user);
  });
});
