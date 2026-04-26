import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { IncomingHttpHeaders } from 'http';
import type { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import type { Bid } from './entities/bid.entity';
import { presentBid } from './presenters/bid.presenter';

type AuthenticatedSocket = Socket & {
  data: Socket['data'] & {
    user?: Awaited<ReturnType<AuthService['getAuthenticatedUser']>>;
  };
};

type AuctionRoomPayload = {
  auctionId?: string;
};

@WebSocketGateway({
  namespace: 'auctions',
  cors: { origin: true, credentials: true },
})
export class BidsGateway implements OnGatewayConnection {
  private readonly logger = new Logger(BidsGateway.name);

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
      client.emit('auction.ready', { userId: user.id });
    } catch (error) {
      this.logger.warn(
        error instanceof Error ? error.message : 'Socket authentication failed',
      );
      client.emit('auction.error', { message: 'Authentication required' });
      client.disconnect(true);
    }
  }

  @SubscribeMessage('auction.join')
  async joinAuction(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: AuctionRoomPayload,
  ) {
    if (!payload?.auctionId) {
      client.emit('auction.error', { message: 'auctionId is required' });
      return;
    }

    await client.join(this.auctionRoom(payload.auctionId));
    client.emit('auction.joined', { auctionId: payload.auctionId });
  }

  @SubscribeMessage('auction.leave')
  async leaveAuction(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: AuctionRoomPayload,
  ) {
    if (!payload?.auctionId) {
      client.emit('auction.error', { message: 'auctionId is required' });
      return;
    }

    await client.leave(this.auctionRoom(payload.auctionId));
    client.emit('auction.left', { auctionId: payload.auctionId });
  }

  emitBidPlaced(input: { auctionId: string; bid: Bid; isTopBid: boolean }) {
    this.server.to(this.auctionRoom(input.auctionId)).emit('bid.placed', {
      bid: presentBid(input.bid),
      isTopBid: input.isTopBid,
    });
  }

  emitTopBidChanged(input: {
    auctionId: string;
    bid: Bid;
    previousBid: Bid | null;
  }) {
    this.server
      .to(this.auctionRoom(input.auctionId))
      .emit('auction.topBidChanged', {
        auctionId: input.auctionId,
        bid: presentBid(input.bid),
        previousBid: input.previousBid ? presentBid(input.previousBid) : null,
      });
  }

  emitOutbid(input: {
    userId: string;
    auctionId: string;
    bid: Bid;
    newTopBid: Bid;
  }) {
    this.server.to(this.userRoom(input.userId)).emit('bid.outbid', {
      auctionId: input.auctionId,
      bid: presentBid(input.bid),
      newTopBid: presentBid(input.newTopBid),
    });
  }

  emitStatusChanged(input: {
    auctionId: string;
    previousStatus: string;
    newStatus: string;
  }) {
    this.server
      .to(this.auctionRoom(input.auctionId))
      .emit('auction.statusChanged', {
        auctionId: input.auctionId,
        previousStatus: input.previousStatus,
        newStatus: input.newStatus,
      });
  }

  emitAuctionClosed(input: {
    auctionId: string;
    winnerId: string | null;
    winningBid: { id: string; amountKobo: number } | null;
  }) {
    this.server
      .to(this.auctionRoom(input.auctionId))
      .emit('auction.closed', {
        auctionId: input.auctionId,
        winnerId: input.winnerId,
        winningBid: input.winningBid,
      });
  }

  private auctionRoom(auctionId: string) {
    return `auction:${auctionId}`;
  }

  private userRoom(userId: string) {
    return `user:${userId}`;
  }
}
