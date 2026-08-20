import { ForbiddenException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { SupportConversationState } from '../../common/enums/support-conversation-state.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import type { NotificationsService } from '../notifications/notifications.service';
import type { User } from '../users/entities/user.entity';
import type { SupportConversation } from './entities/support-conversation.entity';
import type { SupportMessage } from './entities/support-message.entity';
import type { SupportAiRunner } from './support-ai-runner.service';
import type { SupportGateway } from './support.gateway';
import { SupportService } from './support.service';

describe('SupportService admin assignment ownership', () => {
  const actingAdmin: AuthenticatedUser = {
    id: 'admin-b',
    role: UserRole.Admin,
    authRole: 'admin',
    sessionId: 'session-b',
  };
  const conversation = {
    id: 'conversation-1',
    userId: 'user-1',
    assignedAdminId: 'admin-a',
    state: SupportConversationState.AdminActive,
  } as SupportConversation;
  const conversations = {
    findOneByOrFail: jest.fn().mockResolvedValue(conversation),
  } as unknown as Repository<SupportConversation>;
  const service = new SupportService(
    conversations,
    {} as Repository<SupportMessage>,
    {} as Repository<User>,
    {} as SupportAiRunner,
    {} as NotificationsService,
    {} as SupportGateway,
  );

  it.each([
    ['post a message', () => service.postAdminMessage(actingAdmin, conversation.id, 'Hello')],
    ['take over', () => service.assignToAdmin(actingAdmin, conversation.id)],
    ['release to AI', () => service.releaseToAi(actingAdmin, conversation.id)],
    ['resolve', () => service.resolve(actingAdmin, conversation.id)],
  ])('prevents a different administrator from attempting to %s', async (_label, action) => {
    await expect(action()).rejects.toBeInstanceOf(ForbiddenException);
  });
});
