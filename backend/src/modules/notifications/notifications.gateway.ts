import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { IncomingHttpHeaders } from 'http';
import type { Server, Socket } from 'socket.io';
import { NotificationAudience } from '../../common/enums/notification-audience.enum';
import { AuthService } from '../auth/auth.service';
import type { Notification } from './entities/notification.entity';
import { presentNotification } from './presenters/notification.presenter';

type AuthenticatedSocket = Socket & {
  data: Socket['data'] & {
    user?: Awaited<ReturnType<AuthService['getAuthenticatedUser']>>;
  };
};

@WebSocketGateway({
  namespace: 'notifications',
  cors: { origin: true, credentials: true },
})
export class NotificationsGateway implements OnGatewayConnection {
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(private readonly authService: AuthService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const user = await this.authService.getAuthenticatedUser(
        client.handshake.headers as IncomingHttpHeaders,
      );

      client.data.user = user;
      await client.join(this.userRoom(user.id));

      if (user.authRole === 'admin') {
        await client.join(this.adminRoom);
      }

      client.emit('notification.ready', {
        userId: user.id,
        admin: user.authRole === 'admin',
      });
    } catch (error) {
      this.logger.warn(
        error instanceof Error ? error.message : 'Socket authentication failed',
      );
      client.emit('notification.error', { message: 'Authentication required' });
      client.disconnect(true);
    }
  }

  emitCreated(notification: Notification) {
    const payload = presentNotification(notification);

    if (notification.audience === NotificationAudience.Admin) {
      this.server.to(this.adminRoom).emit('notification.created', payload);
      return;
    }

    if (notification.recipientId) {
      this.server
        .to(this.userRoom(notification.recipientId))
        .emit('notification.created', payload);
    }
  }

  private userRoom(userId: string) {
    return `user:${userId}`;
  }

  private get adminRoom() {
    return 'admin';
  }
}
