import type { Repository } from 'typeorm';
import { SupportConversationState } from '../../common/enums/support-conversation-state.enum';
import type { NotificationsService } from '../notifications/notifications.service';
import type { User } from '../users/entities/user.entity';
import type { SupportConversation } from './entities/support-conversation.entity';
import type { SupportMessage } from './entities/support-message.entity';
import type { SupportAiRunner } from './support-ai-runner.service';
import type { SupportGateway } from './support.gateway';
import { SupportService } from './support.service';

describe('SupportService admin conversation list', () => {
  it('notifies the admin inbox when a conversation is created', async () => {
    const conversation = {
      id: 'new-conversation-id',
      userId: 'user-id',
      subject: null,
      state: SupportConversationState.AiActive,
      lastMessageAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as SupportConversation;
    const conversations = {
      create: jest.fn((value) => value),
      save: jest.fn().mockResolvedValue(conversation),
    };
    const gateway = { emitListUpdated: jest.fn() };
    const service = new SupportService(
      conversations as unknown as Repository<SupportConversation>,
      {} as Repository<SupportMessage>,
      {} as Repository<User>,
      {} as SupportAiRunner,
      {} as NotificationsService,
      gateway as unknown as SupportGateway,
    );

    await service.createConversation('user-id');

    expect(gateway.emitListUpdated).toHaveBeenCalledWith(conversation.id);
  });

  it('returns a paginated page and total count', async () => {
    const conversation = {
      id: 'conversation-id',
      userId: 'user-id',
      state: SupportConversationState.WaitingAdmin,
      lastMessageAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as SupportConversation;
    const conversations = {
      findAndCount: jest.fn().mockResolvedValue([[conversation], 61]),
    };
    const users = {
      findBy: jest.fn().mockResolvedValue([
        {
          id: 'user-id',
          firstName: 'Ada',
          lastName: 'Okafor',
          email: 'ada@example.com',
        },
      ]),
    };
    const service = new SupportService(
      conversations as unknown as Repository<SupportConversation>,
      {} as Repository<SupportMessage>,
      users as unknown as Repository<User>,
      {} as SupportAiRunner,
      {} as NotificationsService,
      {} as SupportGateway,
    );

    await expect(
      service.listAllConversations({ limit: 25, offset: 25 }),
    ).resolves.toEqual({
      items: [
        expect.objectContaining({
          id: conversation.id,
          userName: 'Ada Okafor',
        }),
      ],
      total: 61,
    });
    expect(conversations.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ take: 25, skip: 25 }),
    );
  });
});
