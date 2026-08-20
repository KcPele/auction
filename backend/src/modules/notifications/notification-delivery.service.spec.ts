import type { ConfigService } from '@nestjs/config';
import type { Repository } from 'typeorm';
import type { EmailService } from '../../common/email/email.service';
import { NotificationAudience } from '../../common/enums/notification-audience.enum';
import { NotificationType } from '../../common/enums/notification-type.enum';
import type { NotificationDeliveryLog } from '../admin/entities/notification-delivery-log.entity';
import type { PlatformToggle } from '../admin/entities/platform-toggle.entity';
import type { NotificationPreference } from '../users/entities/notification-preference.entity';
import type { User } from '../users/entities/user.entity';
import type { Notification } from './entities/notification.entity';
import { NotificationDeliveryService } from './notification-delivery.service';

describe('NotificationDeliveryService', () => {
  const user = {
    id: 'user-id',
    email: 'buyer@bidnaija.local',
    phone: '+2348012345678',
  } as User;
  const notification = {
    id: 'notification-id',
    audience: NotificationAudience.User,
    recipientId: user.id,
    type: NotificationType.Outbid,
    title: 'Outbid',
    message: 'A higher bid was placed.',
  } as Notification;

  it('sends and logs email when platform and user preferences allow it', async () => {
    const logs = savingRepository();
    const email = { send: jest.fn().mockResolvedValue(undefined) };
    const service = createService({ logs, email });

    await service.deliver(notification);

    expect(email.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: user.email,
        subject: notification.title,
      }),
    );
    expect(logs.save).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'EMAIL', status: 'SENT' }),
    );
  });

  it('does not send channels disabled by the platform', async () => {
    const logs = savingRepository();
    const email = { send: jest.fn() };
    const service = createService({
      logs,
      email,
      toggles: { emailNotifications: false, whatsappNotifications: false },
    });

    await service.deliver(notification);

    expect(email.send).not.toHaveBeenCalled();
    expect(logs.save).not.toHaveBeenCalled();
  });

  it('logs WhatsApp as skipped when its provider is not configured', async () => {
    const logs = savingRepository();
    const service = createService({
      logs,
      toggles: { emailNotifications: false, whatsappNotifications: true },
    });

    await service.deliver(notification);

    expect(logs.save).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'WHATSAPP',
        status: 'SKIPPED',
        error: 'WhatsApp provider is not configured',
      }),
    );
  });

  function createService(input: {
    logs: ReturnType<typeof savingRepository>;
    email?: { send: jest.Mock };
    toggles?: Partial<PlatformToggle>;
  }) {
    return new NotificationDeliveryService(
      { findOneBy: jest.fn().mockResolvedValue(user) } as unknown as Repository<User>,
      {
        findOneBy: jest.fn().mockResolvedValue({
          emailEnabled: true,
          whatsappEnabled: true,
        }),
      } as unknown as Repository<NotificationPreference>,
      {
        findOneBy: jest.fn().mockResolvedValue(
          input.toggles ?? {
            emailNotifications: true,
            whatsappNotifications: false,
          },
        ),
      } as unknown as Repository<PlatformToggle>,
      input.logs as unknown as Repository<NotificationDeliveryLog>,
      (input.email ?? { send: jest.fn() }) as unknown as EmailService,
      { get: jest.fn() } as unknown as ConfigService,
    );
  }
});

function savingRepository() {
  return {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
  };
}
