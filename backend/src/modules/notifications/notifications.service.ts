import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { NotificationAudience } from '../../common/enums/notification-audience.enum';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import type { CreateNotificationDto } from './dto/create-notification.dto';
import type { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { NotificationRead } from './entities/notification-read.entity';
import { Notification } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';
import { presentNotification } from './presenters/notification.presenter';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    @InjectRepository(NotificationRead)
    private readonly readsRepository: Repository<NotificationRead>,
    private readonly gateway: NotificationsGateway,
  ) {}

  async create(dto: CreateNotificationDto) {
    if (dto.audience === NotificationAudience.User && !dto.recipientId) {
      throw new ForbiddenException('User notifications require a recipient');
    }

    const notification = await this.notificationsRepository.save(
      this.notificationsRepository.create({
        audience: dto.audience,
        recipientId: dto.recipientId ?? null,
        type: dto.type,
        title: dto.title.trim(),
        message: dto.message.trim(),
        data: dto.data ?? null,
      }),
    );

    this.gateway.emitCreated(notification);

    return { notification: presentNotification(notification) };
  }

  async listForUser(user: AuthenticatedUser, query: ListNotificationsQueryDto) {
    const rows = await this.visibleQuery(user)
      .leftJoin(
        NotificationRead,
        'read',
        'read."notificationId" = notification.id AND read."userId" = :userId',
        { userId: user.id },
      )
      .addSelect('read."readAt"', 'readAt')
      .andWhere(
        query.unreadOnly
          ? new Brackets((qb) => qb.where('read.id IS NULL'))
          : '1 = 1',
      )
      .orderBy('notification.createdAt', 'DESC')
      .limit(query.limit)
      .offset(query.offset)
      .getRawAndEntities();

    return {
      notifications: rows.entities.map((notification, index) =>
        presentNotification(
          notification,
          rows.raw[index]?.readAt ? new Date(rows.raw[index].readAt) : null,
        ),
      ),
    };
  }

  async markRead(user: AuthenticatedUser, notificationId: string) {
    await this.ensureVisible(user, notificationId);
    const existing = await this.readsRepository.findOneBy({
      notificationId,
      userId: user.id,
    });

    if (existing) {
      return { notificationRead: existing };
    }

    return {
      notificationRead: await this.readsRepository.save(
        this.readsRepository.create({ notificationId, userId: user.id }),
      ),
    };
  }

  async markAllRead(user: AuthenticatedUser) {
    const rows = await this.visibleQuery(user)
      .leftJoin(
        NotificationRead,
        'read',
        'read."notificationId" = notification.id AND read."userId" = :userId',
        { userId: user.id },
      )
      .andWhere('read.id IS NULL')
      .getMany();

    const reads = rows.map((notification) =>
      this.readsRepository.create({
        notificationId: notification.id,
        userId: user.id,
      }),
    );

    const notificationReads = reads.length
      ? await this.readsRepository.save(reads)
      : [];

    return {
      notificationReads,
      updatedCount: notificationReads.length,
    };
  }

  private async ensureVisible(user: AuthenticatedUser, notificationId: string) {
    const notification = await this.visibleQuery(user)
      .andWhere('notification.id = :notificationId', { notificationId })
      .getOne();

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  private visibleQuery(user: AuthenticatedUser) {
    const query = this.notificationsRepository
      .createQueryBuilder('notification')
      .where('notification.recipientId = :userId', { userId: user.id });

    if (user.authRole === 'admin') {
      query.orWhere('notification.audience = :adminAudience', {
        adminAudience: NotificationAudience.Admin,
      });
    }

    return query;
  }
}
