import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '../../common/enums/user-role.enum';
import { NotificationAudience } from '../../common/enums/notification-audience.enum';
import { NotificationType } from '../../common/enums/notification-type.enum';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import type { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  const user: AuthenticatedUser = {
    id: 'user-id',
    role: UserRole.IndividualBidder,
    authRole: 'user',
    sessionId: 'session-id',
  };
  let notificationsRepository: {
    create: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let readsRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOneBy: jest.Mock;
  };
  let gateway: { emitCreated: jest.Mock };
  let service: NotificationsService;

  beforeEach(() => {
    notificationsRepository = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({
        id: 'notification-id',
        createdAt: new Date('2026-04-24T12:00:00.000Z'),
        ...value,
      })),
      createQueryBuilder: jest.fn(),
    };
    readsRepository = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
      findOneBy: jest.fn(),
    };
    gateway = { emitCreated: jest.fn() };
    service = new NotificationsService(
      notificationsRepository as never,
      readsRepository as never,
      gateway as unknown as NotificationsGateway,
    );
  });

  it('creates and emits a user notification', async () => {
    await expect(
      service.create({
        audience: NotificationAudience.User,
        recipientId: user.id,
        type: NotificationType.Outbid,
        title: 'Outbid',
        message: 'A higher bid was placed.',
        data: { auctionId: 'auction-id' },
      }),
    ).resolves.toEqual({
      notification: expect.objectContaining({
        id: 'notification-id',
        recipientId: user.id,
      }),
    });
    expect(gateway.emitCreated).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'notification-id' }),
    );
  });

  it('requires a recipient for user notifications', async () => {
    await expect(
      service.create({
        audience: NotificationAudience.User,
        type: NotificationType.System,
        title: 'Missing recipient',
        message: 'Invalid notification.',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lists visible notifications with read state', async () => {
    notificationsRepository.createQueryBuilder.mockReturnValue(
      createQueryBuilder({
        rawAndEntities: {
          entities: [
            {
              id: 'notification-id',
              audience: NotificationAudience.User,
              recipientId: user.id,
              type: NotificationType.System,
              title: 'Hello',
              message: 'Dashboard message',
              data: null,
              createdAt: new Date('2026-04-24T12:00:00.000Z'),
            },
          ],
          raw: [{ readAt: '2026-04-24T12:01:00.000Z' }],
        },
      }),
    );

    await expect(
      service.listForUser(user, { limit: 20, offset: 0, unreadOnly: false }),
    ).resolves.toEqual({
      notifications: [
        expect.objectContaining({
          id: 'notification-id',
          readAt: new Date('2026-04-24T12:01:00.000Z'),
        }),
      ],
    });
  });

  it('marks a visible notification as read', async () => {
    notificationsRepository.createQueryBuilder.mockReturnValue(
      createQueryBuilder({ one: { id: 'notification-id' } }),
    );
    readsRepository.findOneBy.mockResolvedValue(null);

    await expect(service.markRead(user, 'notification-id')).resolves.toEqual({
      notificationRead: {
        notificationId: 'notification-id',
        userId: user.id,
      },
    });
  });

  it('rejects reads for notifications the user cannot see', async () => {
    notificationsRepository.createQueryBuilder.mockReturnValue(
      createQueryBuilder({ one: null }),
    );

    await expect(service.markRead(user, 'missing-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('marks all visible unread notifications as read', async () => {
    notificationsRepository.createQueryBuilder.mockReturnValue(
      createQueryBuilder({
        many: [{ id: 'first-id' }, { id: 'second-id' }],
      }),
    );

    await expect(service.markAllRead(user)).resolves.toEqual({
      notificationReads: [
        { notificationId: 'first-id', userId: user.id },
        { notificationId: 'second-id', userId: user.id },
      ],
      updatedCount: 2,
    });
    expect(readsRepository.save).toHaveBeenCalledWith([
      { notificationId: 'first-id', userId: user.id },
      { notificationId: 'second-id', userId: user.id },
    ]);
  });
});

function createQueryBuilder(results: {
  rawAndEntities?: { entities: unknown[]; raw: unknown[] };
  one?: unknown;
  many?: unknown[];
}) {
  return {
    where: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    getRawAndEntities: jest.fn().mockResolvedValue(results.rawAndEntities),
    getOne: jest.fn().mockResolvedValue(results.one),
    getMany: jest.fn().mockResolvedValue(results.many ?? []),
  };
}
