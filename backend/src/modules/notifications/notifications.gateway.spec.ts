import { UserRole } from '../../common/enums/user-role.enum';
import { NotificationAudience } from '../../common/enums/notification-audience.enum';
import { NotificationType } from '../../common/enums/notification-type.enum';
import type { AuthService } from '../auth/auth.service';
import { NotificationsGateway } from './notifications.gateway';

type MockSocket = {
  handshake: { headers: Record<string, string> };
  data: Record<string, unknown>;
  join: jest.Mock;
  emit: jest.Mock;
  disconnect: jest.Mock;
};

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;
  let authService: { getAuthenticatedUser: jest.Mock };

  beforeEach(() => {
    authService = { getAuthenticatedUser: jest.fn() };
    gateway = new NotificationsGateway(authService as unknown as AuthService);
    Object.defineProperty(gateway, 'server', {
      value: {
        to: jest.fn().mockReturnValue({ emit: jest.fn() }),
      },
    });
  });

  it('joins user and admin rooms when an admin connects', async () => {
    authService.getAuthenticatedUser.mockResolvedValue({
      id: 'admin-id',
      role: UserRole.Admin,
      authRole: 'admin',
      sessionId: 'session-id',
    });
    const socket = createSocket();

    await gateway.handleConnection(socket as never);

    expect(socket.join).toHaveBeenCalledWith('user:admin-id');
    expect(socket.join).toHaveBeenCalledWith('admin');
    expect(socket.emit).toHaveBeenCalledWith('notification.ready', {
      userId: 'admin-id',
      admin: true,
    });
  });

  it('disconnects unauthenticated sockets', async () => {
    authService.getAuthenticatedUser.mockRejectedValue(new Error('No session'));
    const socket = createSocket();

    await gateway.handleConnection(socket as never);

    expect(socket.emit).toHaveBeenCalledWith('notification.error', {
      message: 'Authentication required',
    });
    expect(socket.disconnect).toHaveBeenCalledWith(true);
  });

  it('emits admin notifications to the admin room', () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    Object.defineProperty(gateway, 'server', { value: { to } });

    gateway.emitCreated({
      id: 'notification-id',
      audience: NotificationAudience.Admin,
      recipientId: null,
      type: NotificationType.System,
      title: 'Admin task',
      message: 'Review listing',
      data: null,
      createdAt: new Date('2026-04-24T12:00:00.000Z'),
    } as never);

    expect(to).toHaveBeenCalledWith('admin');
    expect(emit).toHaveBeenCalledWith(
      'notification.created',
      expect.objectContaining({ id: 'notification-id' }),
    );
  });
});

function createSocket(): MockSocket {
  return {
    handshake: { headers: { cookie: 'better-auth.session_token=value' } },
    data: {},
    join: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  };
}
