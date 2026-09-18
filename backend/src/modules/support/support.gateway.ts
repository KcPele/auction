import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { IncomingHttpHeaders } from 'http';
import type { Server, Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { AuthService } from '../auth/auth.service';
import { SupportConversation } from './entities/support-conversation.entity';

type AuthedSocket = Socket & {
  data: Socket['data'] & {
    user?: Awaited<ReturnType<AuthService['getAuthenticatedUser']>>;
  };
};

const ADMIN_ROOM = 'support:admin';
const conversationRoom = (id: string) => `support:conv:${id}`;

/**
 * Realtime channel for the support chat.
 *
 * Rooms:
 * - `support:conv:{id}` — joined by the conversation's user when they open
 *   the chat, and by any admin actively viewing the same conversation.
 * - `support:admin`     — joined by every admin connection, used for the
 *   "list of conversations" live updates.
 *
 * The service emits via the small public API at the bottom — keep the
 * gateway dumb so the service can stay testable.
 */
@WebSocketGateway({
  namespace: 'support',
  cors: { origin: true, credentials: true },
})
export class SupportGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(SupportGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly authService: AuthService,
    @InjectRepository(SupportConversation)
    private readonly conversationsRepository: Repository<SupportConversation>,
  ) {}

  async handleConnection(client: AuthedSocket) {
    try {
      const token = this.readSessionToken(client);
      const user = await this.authService.getAuthenticatedSocketUser(
        client.handshake.headers as IncomingHttpHeaders,
        token,
      );
      client.data.user = user;
      if (user.authRole === 'admin' || user.role === UserRole.Admin) {
        await client.join(ADMIN_ROOM);
      }
      client.emit('support.ready', {
        userId: user.id,
        admin: user.authRole === 'admin' || user.role === UserRole.Admin,
      });
    } catch (error) {
      this.logger.warn(
        error instanceof Error ? error.message : 'Support socket auth failed',
      );
      client.emit('support.error', { message: 'Authentication required' });
      client.disconnect(true);
    }
  }

  private readSessionToken(client: Socket): string | undefined {
    const value = client.handshake.auth?.sessionToken;
    return typeof value === 'string' ? value : undefined;
  }

  async handleDisconnect(_client: AuthedSocket) {
    // No bookkeeping — socket.io auto-removes from rooms.
  }

  @SubscribeMessage('support.join')
  async onJoin(
    client: AuthedSocket,
    payload: { conversationId?: string } = {},
  ) {
    const id = payload.conversationId;
    if (!id) return;
    // `handleConnection` runs async — incoming events can race past it. If
    // the user isn't attached yet, poll briefly so we don't drop the join.
    for (let i = 0; i < 20 && !client.data.user; i++) {
      await new Promise((r) => setTimeout(r, 50));
    }
    if (!client.data.user) {
      client.emit('support.error', { message: 'Not authenticated' });
      return;
    }
    const isAdmin =
      client.data.user.authRole === 'admin' ||
      client.data.user.role === UserRole.Admin;
    const conversation = await this.conversationsRepository.findOneBy(
      isAdmin ? { id } : { id, userId: client.data.user.id },
    );
    if (!conversation) {
      client.emit('support.error', { message: 'Conversation not found' });
      return;
    }
    await client.join(conversationRoom(id));
    client.emit('support.joined', { conversationId: id });
  }

  @SubscribeMessage('support.leave')
  async onLeave(
    client: AuthedSocket,
    payload: { conversationId?: string } = {},
  ) {
    if (!payload.conversationId) return;
    await client.leave(conversationRoom(payload.conversationId));
  }

  // ------------------------- emit helpers ---------------------------------

  emitMessage(conversationId: string, message: unknown) {
    if (!this.server) return;
    this.server
      .to(conversationRoom(conversationId))
      .emit('support.message', { conversationId, message });
    // Also nudge the admin list so unread counters refresh.
    this.emitListUpdated(conversationId);
  }

  emitListUpdated(conversationId: string) {
    if (!this.server) return;
    this.server.to(ADMIN_ROOM).emit('support.list-updated', { conversationId });
  }

  emitStateChanged(conv: SupportConversation) {
    if (!this.server) return;
    const payload = {
      conversationId: conv.id,
      state: conv.state,
      assignedAdminId: conv.assignedAdminId,
      handoffReason: conv.handoffReason,
    };
    this.server.to(conversationRoom(conv.id)).emit('support.state', payload);
    this.server.to(ADMIN_ROOM).emit('support.state', payload);
    this.emitListUpdated(conv.id);
  }

  /** Returns true if any admin socket is currently in the conversation room. */
  adminInRoom(conversationId: string): boolean {
    const room = this.server?.sockets?.adapter?.rooms?.get(
      conversationRoom(conversationId),
    );
    if (!room) return false;
    for (const id of room) {
      const socket = this.server.sockets.sockets.get(id) as AuthedSocket | undefined;
      if (
        socket?.data.user &&
        (socket.data.user.authRole === 'admin' ||
          socket.data.user.role === UserRole.Admin)
      ) {
        return true;
      }
    }
    return false;
  }

  /** Returns true if the user has the conversation open right now. */
  userInRoom(userId: string, conversationId: string): boolean {
    const room = this.server?.sockets?.adapter?.rooms?.get(
      conversationRoom(conversationId),
    );
    if (!room) return false;
    for (const id of room) {
      const socket = this.server.sockets.sockets.get(id) as AuthedSocket | undefined;
      if (socket?.data.user?.id === userId) return true;
    }
    return false;
  }
}
