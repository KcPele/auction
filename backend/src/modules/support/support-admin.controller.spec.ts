import { UserRole } from '../../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { SupportAdminController } from './support-admin.controller';

describe('SupportAdminController', () => {
  const admin: AuthenticatedUser = {
    id: 'admin-id',
    role: UserRole.Admin,
    authRole: 'admin',
    sessionId: 'session-id',
  };
  const service = {
    getConversation: jest.fn(),
    listMessages: jest.fn(),
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
  };
  const controller = new SupportAdminController(service as never);

  beforeEach(() => jest.clearAllMocks());

  it('returns one conversation', async () => {
    service.getConversation.mockResolvedValue({ id: 'conversation-id' });
    await expect(
      controller.getOne(admin, 'conversation-id'),
    ).resolves.toEqual({ id: 'conversation-id' });
  });

  it('returns conversation messages', async () => {
    service.listMessages.mockResolvedValue([{ id: 'message-id' }]);
    await expect(
      controller.messages(admin, 'conversation-id'),
    ).resolves.toEqual([{ id: 'message-id' }]);
  });

  it('reads and updates AI settings', async () => {
    service.getSettings.mockResolvedValue({ enabled: true });
    service.updateSettings.mockResolvedValue({ enabled: false });
    await expect(controller.getSettings()).resolves.toEqual({ enabled: true });
    await expect(
      controller.updateSettings({ enabled: false }),
    ).resolves.toEqual({ enabled: false });
  });
});
