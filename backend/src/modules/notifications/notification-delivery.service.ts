import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailService } from '../../common/email/email.service';
import { NotificationAudience } from '../../common/enums/notification-audience.enum';
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
      await this.emailService.send({
        to: user.email,
        subject: notification.title,
        html: `<p>${this.escapeHtml(notification.message)}</p>`,
        text: notification.message,
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

  private escapeHtml(value: string) {
    return value.replace(
      /[&<>'"]/g,
      (character) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          "'": '&#39;',
          '"': '&quot;',
        })[character] ?? character,
    );
  }
}
