import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailService } from '../../common/email/email.service';
import { renderTransactionalEmail } from '../../common/email/transactional-email.template';
import { NotificationAudience } from '../../common/enums/notification-audience.enum';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { NotificationDeliveryLog } from '../admin/entities/notification-delivery-log.entity';
import { PlatformToggle } from '../admin/entities/platform-toggle.entity';
import { NotificationPreference } from '../users/entities/notification-preference.entity';
import { User } from '../users/entities/user.entity';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationDeliveryService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(NotificationPreference)
    private readonly preferencesRepository: Repository<NotificationPreference>,
    @InjectRepository(PlatformToggle)
    private readonly platformTogglesRepository: Repository<PlatformToggle>,
    @InjectRepository(NotificationDeliveryLog)
    private readonly deliveryLogsRepository: Repository<NotificationDeliveryLog>,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
  ) {}

  async deliver(notification: Notification) {
    if (
      notification.audience !== NotificationAudience.User ||
      !notification.recipientId
    ) {
      return;
    }

    const [user, preference, toggles] = await Promise.all([
      this.usersRepository.findOneBy({ id: notification.recipientId }),
      this.preferencesRepository.findOneBy({
        userId: notification.recipientId,
      }),
      this.platformTogglesRepository.findOneBy({ id: 'default' }),
    ]);
    if (!user) return;

    const deliveries: Promise<void>[] = [];
    if (
      (toggles?.emailNotifications ?? true) &&
      (preference?.emailEnabled ?? true)
    ) {
      deliveries.push(this.deliverEmail(user, notification));
    }
    if (
      (toggles?.whatsappNotifications ?? true) &&
      (preference?.whatsappEnabled ?? true)
    ) {
      deliveries.push(this.deliverWhatsApp(user, notification));
    }

    await Promise.allSettled(deliveries);
  }

  private async deliverEmail(user: User, notification: Notification) {
    try {
      const action = this.emailAction(notification);
      const email = renderTransactionalEmail({
        title: notification.title,
        message: notification.message,
        recipientName: [user.firstName, user.lastName].filter(Boolean).join(' '),
        ...action,
      });
      await this.emailService.send({
        to: user.email,
        ...email,
      });
      await this.writeLog(user, notification, 'EMAIL', user.email, 'SENT');
    } catch (error) {
      await this.writeLog(
        user,
        notification,
        'EMAIL',
        user.email,
        'FAILED',
        this.errorMessage(error),
      );
    }
  }

  private async deliverWhatsApp(user: User, notification: Notification) {
    const accessToken = this.config.get<string>('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    const graphVersion = this.config.get<string>('WHATSAPP_GRAPH_VERSION');
    if (!accessToken || !phoneNumberId || !graphVersion) {
      await this.writeLog(
        user,
        notification,
        'WHATSAPP',
        user.phone,
        'SKIPPED',
        'WhatsApp provider is not configured',
      );
      return;
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${accessToken}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: user.phone,
            type: 'text',
            text: { preview_url: false, body: notification.message },
          }),
        },
      );
      if (!response.ok) {
        throw new Error(
          `WhatsApp rejected message (${response.status}): ${(await response.text()).slice(0, 300)}`,
        );
      }
      await this.writeLog(
        user,
        notification,
        'WHATSAPP',
        user.phone,
        'SENT',
      );
    } catch (error) {
      await this.writeLog(
        user,
        notification,
        'WHATSAPP',
        user.phone,
        'FAILED',
        this.errorMessage(error),
      );
    }
  }

  private async writeLog(
    user: User,
    notification: Notification,
    channel: string,
    recipient: string,
    status: string,
    error: string | null = null,
  ) {
    await this.deliveryLogsRepository.save(
      this.deliveryLogsRepository.create({
        channel,
        template: notification.type,
        recipient,
        status,
        error,
        notificationId: notification.id,
        userId: user.id,
      }),
    );
  }

  private errorMessage(error: unknown) {
    return error instanceof Error ? error.message.slice(0, 1000) : 'Unknown error';
  }

  private emailAction(notification: Notification) {
    const baseUrl = this.config
      .get<string>('WEB_APP_URL', 'http://localhost:3000')
      .replace(/\/$/, '');
    const data = (notification.data ?? {}) as Record<string, unknown>;

    if (data.source === 'ADMIN_GRANT') {
      return {
        actionUrl: `${baseUrl}/dashboard/listings`,
        actionLabel: 'Open My listings',
      };
    }
    if (data.source === 'ADMIN_REVOKE') {
      return {
        actionUrl: `${baseUrl}/dashboard/listing-access`,
        actionLabel: 'Review listing access',
      };
    }
    if (data.source === 'WATCHLIST_REMINDER' || data.source === 'WATCHLIST_SAVED') {
      return {
        actionUrl: `${baseUrl}/dashboard/browse`,
        actionLabel: 'View saved auctions',
      };
    }

    const routeByType: Partial<Record<NotificationType, string>> = {
      [NotificationType.ListingSubmitted]: '/dashboard/listings',
      [NotificationType.ListingApproved]: '/dashboard/listings',
      [NotificationType.ListingRejected]: '/dashboard/listings',
      [NotificationType.AuctionStarted]: '/dashboard/browse',
      [NotificationType.Outbid]: '/dashboard/bids',
      [NotificationType.AuctionWon]: '/dashboard/won',
      [NotificationType.PaymentDue]: '/dashboard/won',
    };
    return {
      actionUrl: `${baseUrl}${routeByType[notification.type] ?? '/dashboard/notifications'}`,
      actionLabel: 'View details',
    };
  }
}
