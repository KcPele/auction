import { UserRole } from '../../common/enums/user-role.enum';
import { BidStatus } from '../../common/enums/bid-status.enum';
import type { AuthService } from '../auth/auth.service';
import { BidsGateway } from './bids.gateway';
import type { Bid } from './entities/bid.entity';

type MockSocket = {
  handshake: { headers: Record<string, string> };
  data: Record<string, unknown>;
  join: jest.Mock;
  leave: jest.Mock;
  emit: jest.Mock;
  disconnect: jest.Mock;
};

describe('BidsGateway', () => {
  let gateway: BidsGateway;
  let authService: { getAuthenticatedUser: jest.Mock };

  beforeEach(() => {
    authService = { getAuthenticatedUser: jest.fn() };
    gateway = new BidsGateway(authService as unknown as AuthService);
    Object.defineProperty(gateway, 'server', {
      value: {
        to: jest.fn().mockReturnValue({ emit: jest.fn() }),
      },
    });
  });

  it('authenticates sockets and joins the user room', async () => {
    authService.getAuthenticatedUser.mockResolvedValue({
      id: 'user-id',
      role: UserRole.IndividualBidder,
      authRole: 'user',
      sessionId: 'session-id',
    });
    const socket = createSocket();

    await gateway.handleConnection(socket as never);

    expect(socket.join).toHaveBeenCalledWith('user:user-id');
    expect(socket.emit).toHaveBeenCalledWith('auction.ready', {
      userId: 'user-id',
    });
  });

  it('joins auction rooms', async () => {
    const socket = createSocket();

    await gateway.joinAuction(socket as never, { auctionId: 'auction-id' });

    expect(socket.join).toHaveBeenCalledWith('auction:auction-id');
    expect(socket.emit).toHaveBeenCalledWith('auction.joined', {
      auctionId: 'auction-id',
    });
  });

  it('emits bid placement to the auction room', () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    Object.defineProperty(gateway, 'server', { value: { to } });

    gateway.emitBidPlaced({
      auctionId: 'auction-id',
      bid: createBid(),
      isTopBid: true,
    });

    expect(to).toHaveBeenCalledWith('auction:auction-id');
    expect(emit).toHaveBeenCalledWith(
      'bid.placed',
      expect.objectContaining({ isTopBid: true }),
    );
  });

  it('emits outbid events to the previous bidder room', () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    Object.defineProperty(gateway, 'server', { value: { to } });

    gateway.emitOutbid({
      userId: 'previous-bidder-id',
      auctionId: 'auction-id',
      bid: createBid({ id: 'previous-bid-id' }),
      newTopBid: createBid({ id: 'new-bid-id' }),
    });

    expect(to).toHaveBeenCalledWith('user:previous-bidder-id');
    expect(emit).toHaveBeenCalledWith(
      'bid.outbid',
      expect.objectContaining({ auctionId: 'auction-id' }),
    );
  });
});

function createSocket(): MockSocket {
  return {
    handshake: { headers: { cookie: 'better-auth.session_token=value' } },
    data: {},
    join: jest.fn(),
    leave: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  };
}

function createBid(overrides: Partial<Bid> = {}): Bid {
  return {
    id: 'bid-id',
    auctionId: 'auction-id',
    bidderId: 'bidder-id',
    amountKobo: 250000000,
    walletHoldId: 'hold-id',
    status: BidStatus.Winning,
    createdAt: new Date('2026-04-24T12:00:00.000Z'),
    ...overrides,
  } as Bid;
}
