import { UserRole } from '../../common/enums/user-role.enum';
import { SupportGateway } from './support.gateway';

describe('SupportGateway', () => {
  const user = {
    id: 'user-id',
    role: UserRole.IndividualBidder,
    authRole: 'user',
    sessionId: 'session-id',
  };
  let conversations: { findOneBy: jest.Mock };
  let gateway: SupportGateway;
  let client: {
    data: { user: typeof user };
    emit: jest.Mock;
    join: jest.Mock;
  };

  beforeEach(() => {
    conversations = { findOneBy: jest.fn() };
    gateway = new SupportGateway({} as never, conversations as never);
    client = {
      data: { user },
      emit: jest.fn(),
      join: jest.fn(),
    };
  });

  it('joins a conversation owned by the current user', async () => {
    conversations.findOneBy.mockResolvedValue({ id: 'conversation-id' });

    await gateway.onJoin(client as never, { conversationId: 'conversation-id' });

    expect(conversations.findOneBy).toHaveBeenCalledWith({
      id: 'conversation-id',
      userId: user.id,
    });
    expect(client.join).toHaveBeenCalledWith('support:conv:conversation-id');
  });

  it('rejects a conversation owned by another user', async () => {
    conversations.findOneBy.mockResolvedValue(null);

    await gateway.onJoin(client as never, { conversationId: 'private-id' });

    expect(client.join).not.toHaveBeenCalled();
    expect(client.emit).toHaveBeenCalledWith('support.error', {
      message: 'Conversation not found',
    });
  });
});
