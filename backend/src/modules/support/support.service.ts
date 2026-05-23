import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SupportConversationState,
  SupportMessageRole,
} from '../../common/enums/support-conversation-state.enum';
import { NotificationAudience } from '../../common/enums/notification-audience.enum';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { NotificationsService } from '../notifications/notifications.service';
import { SupportConversation } from './entities/support-conversation.entity';
import { SupportMessage } from './entities/support-message.entity';
import { SupportAiSetting } from './entities/support-ai-setting.entity';
import { SupportAiTools } from './support-ai.tools';
import {
  DEFAULT_SUPPORT_SYSTEM_PROMPT,
  SUPPORT_TOOLS,
} from './support-ai.prompt';
import {
  OpenRouterClient,
  type ChatMessage,
} from './openrouter.client';
import { SupportGateway } from './support.gateway';

const MAX_TOOL_ITERATIONS = 4;
const HISTORY_TOKEN_BUDGET = 20; // keep the last 20 turns

export interface MessageView {
  id: string;
  conversationId: string;
  role: SupportMessageRole;
  authorId: string | null;
  content: string;
  toolCalls: SupportMessage['toolCalls'];
  model: string | null;
  createdAt: Date;
}

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    @InjectRepository(SupportConversation)
    private readonly convRepo: Repository<SupportConversation>,
    @InjectRepository(SupportMessage)
    private readonly msgRepo: Repository<SupportMessage>,
    @InjectRepository(SupportAiSetting)
    private readonly settingsRepo: Repository<SupportAiSetting>,
    private readonly tools: SupportAiTools,
    private readonly openRouter: OpenRouterClient,
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => SupportGateway))
    private readonly gateway: SupportGateway,
  ) {}

  // --- Conversation lifecycle -------------------------------------------

  async createConversation(userId: string, subject?: string) {
    const conv = await this.convRepo.save(
      this.convRepo.create({
        userId,
        subject: subject?.trim().slice(0, 200) || null,
        state: SupportConversationState.AiActive,
        lastMessageAt: new Date(),
        userLastReadAt: new Date(),
      }),
    );
    return this.presentConversation(conv);
  }

  async listMyConversations(userId: string) {
    const convs = await this.convRepo.find({
      where: { userId },
      order: { lastMessageAt: 'DESC', createdAt: 'DESC' },
      take: 50,
    });
    return convs.map((c) => this.presentConversation(c));
  }

  async listAllConversations(filter: { state?: SupportConversationState } = {}) {
    const where = filter.state ? { state: filter.state } : {};
    const convs = await this.convRepo.find({
      where,
      order: { lastMessageAt: 'DESC', createdAt: 'DESC' },
      take: 100,
    });
    return convs.map((c) => this.presentConversation(c));
  }

  async getConversation(user: AuthenticatedUser, id: string) {
    const conv = await this.findConvForUser(user, id);
    return this.presentConversation(conv);
  }

  async listMessages(user: AuthenticatedUser, id: string): Promise<MessageView[]> {
    const conv = await this.findConvForUser(user, id);
    const messages = await this.msgRepo.find({
      where: { conversationId: conv.id },
      order: { createdAt: 'ASC' },
    });
    // Mark read.
    if (user.role === UserRole.Admin) {
      conv.adminLastReadAt = new Date();
    } else {
      conv.userLastReadAt = new Date();
    }
    await this.convRepo.save(conv);
    return messages.map((m) => this.presentMessage(m));
  }

  async markRead(user: AuthenticatedUser, id: string) {
    const conv = await this.findConvForUser(user, id);
    if (user.role === UserRole.Admin) conv.adminLastReadAt = new Date();
    else conv.userLastReadAt = new Date();
    await this.convRepo.save(conv);
    return { ok: true };
  }

  // --- User sends a message --------------------------------------------

  async postUserMessage(
    user: AuthenticatedUser,
    id: string,
    content: string,
  ): Promise<{ userMessage: MessageView; aiMessage?: MessageView; state: SupportConversationState }> {
    if (user.role === UserRole.Admin) {
      throw new BadRequestException('Admins must use the admin endpoint to reply.');
    }
    const conv = await this.findConvForUser(user, id);
    const trimmed = (content ?? '').trim();
    if (!trimmed) throw new BadRequestException('Message is required');
    if (trimmed.length > 4000)
      throw new BadRequestException('Message is too long (4000 chars max)');

    const userMessage = await this.saveMessage(conv, {
      role: SupportMessageRole.User,
      authorId: user.id,
      content: trimmed,
    });
    this.gateway.emitMessage(conv.id, userMessage);
    // Admins watching this conversation also get the user's message in
    // realtime (and a notification if no admin is actively assigned yet).
    if (
      conv.state === SupportConversationState.WaitingAdmin ||
      conv.state === SupportConversationState.AdminActive
    ) {
      await this.maybeNotifyAdminOfUserMessage(conv, trimmed);
    }

    if (
      conv.state !== SupportConversationState.AiActive ||
      !(await this.aiEnabled())
    ) {
      // Admin is handling — no AI reply.
      return { userMessage, state: conv.state };
    }

    let aiMessage: MessageView | null = null;
    try {
      aiMessage = await this.runAssistantTurn(conv);
    } catch (err) {
      this.logger.error(
        `AI turn failed for conv ${conv.id}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      // Persist a system note + auto-escalate to a human so the conversation
      // doesn't dead-end if OpenRouter is down or the key is missing.
      const fresh = await this.convRepo.findOneByOrFail({ id: conv.id });
      fresh.state = SupportConversationState.WaitingAdmin;
      fresh.handoffReason =
        'AI assistant unavailable — auto-escalated to a human.';
      await this.convRepo.save(fresh);
      const sysMsg = await this.saveMessage(fresh, {
        role: SupportMessageRole.System,
        authorId: null,
        content:
          'The assistant is temporarily unavailable. A human will reply shortly.',
      });
      this.gateway.emitMessage(fresh.id, sysMsg);
      this.gateway.emitStateChanged(fresh);
      await this.notifyAdminsOfHandoff(fresh);
    }

    return {
      userMessage,
      aiMessage: aiMessage ?? undefined,
      state: (await this.convRepo.findOneByOrFail({ id: conv.id })).state,
    };
  }

  // --- Admin sends a message -------------------------------------------

  async postAdminMessage(
    admin: AuthenticatedUser,
    id: string,
    content: string,
  ) {
    this.requireAdmin(admin);
    const conv = await this.convRepo.findOneByOrFail({ id });
    const trimmed = (content ?? '').trim();
    if (!trimmed) throw new BadRequestException('Message is required');

    // Take the conversation if no admin owns it yet.
    if (!conv.assignedAdminId) {
      conv.assignedAdminId = admin.id;
    }
    if (conv.state === SupportConversationState.AiActive) {
      conv.state = SupportConversationState.AdminActive;
    } else if (conv.state === SupportConversationState.WaitingAdmin) {
      conv.state = SupportConversationState.AdminActive;
    }
    await this.convRepo.save(conv);

    const message = await this.saveMessage(conv, {
      role: SupportMessageRole.Admin,
      authorId: admin.id,
      content: trimmed,
    });
    this.gateway.emitMessage(conv.id, message);
    this.gateway.emitStateChanged(conv);

    // Notify the user that an admin replied.
    await this.notificationsService.create({
      audience: NotificationAudience.User,
      recipientId: conv.userId,
      type: NotificationType.System,
      title: 'BidNaija Support replied',
      message: trimmed.length > 80 ? `${trimmed.slice(0, 80)}…` : trimmed,
      data: { conversationId: conv.id, kind: 'support_message' },
    });

    return this.presentMessage(message);
  }

  // --- Handoff + assignment --------------------------------------------

  async requestHandoff(
    user: AuthenticatedUser,
    id: string,
    reason?: string,
  ) {
    const conv = await this.findConvForUser(user, id);
    if (
      conv.state === SupportConversationState.AdminActive ||
      conv.state === SupportConversationState.WaitingAdmin
    ) {
      return this.presentConversation(conv);
    }
    conv.state = SupportConversationState.WaitingAdmin;
    conv.handoffReason = reason?.slice(0, 500) ?? 'User requested human assistance';
    await this.convRepo.save(conv);

    await this.saveMessage(conv, {
      role: SupportMessageRole.System,
      authorId: null,
      content: `Handoff requested: ${conv.handoffReason}`,
    });

    this.gateway.emitStateChanged(conv);
    await this.notifyAdminsOfHandoff(conv);

    return this.presentConversation(conv);
  }

  async assignToAdmin(admin: AuthenticatedUser, id: string) {
    this.requireAdmin(admin);
    const conv = await this.convRepo.findOneByOrFail({ id });
    conv.assignedAdminId = admin.id;
    conv.state = SupportConversationState.AdminActive;
    await this.convRepo.save(conv);
    await this.saveMessage(conv, {
      role: SupportMessageRole.System,
      authorId: null,
      content: 'Admin took over the conversation.',
    });
    this.gateway.emitStateChanged(conv);
    return this.presentConversation(conv);
  }

  async releaseToAi(admin: AuthenticatedUser, id: string) {
    this.requireAdmin(admin);
    const conv = await this.convRepo.findOneByOrFail({ id });
    conv.assignedAdminId = null;
    conv.state = SupportConversationState.AiActive;
    await this.convRepo.save(conv);
    await this.saveMessage(conv, {
      role: SupportMessageRole.System,
      authorId: null,
      content: 'Admin handed the conversation back to the AI assistant.',
    });
    this.gateway.emitStateChanged(conv);
    return this.presentConversation(conv);
  }

  async resolve(admin: AuthenticatedUser, id: string) {
    this.requireAdmin(admin);
    const conv = await this.convRepo.findOneByOrFail({ id });
    conv.state = SupportConversationState.Resolved;
    await this.convRepo.save(conv);
    await this.saveMessage(conv, {
      role: SupportMessageRole.System,
      authorId: null,
      content: 'Conversation marked resolved.',
    });
    this.gateway.emitStateChanged(conv);
    return this.presentConversation(conv);
  }

  // --- Settings --------------------------------------------------------

  async getSettings() {
    const s = await this.ensureSettings();
    return {
      model: s.model,
      temperature: Number(s.temperature),
      maxOutputTokens: s.maxOutputTokens,
      systemPromptOverride: s.systemPromptOverride,
      enabled: s.enabled,
      updatedAt: s.updatedAt,
    };
  }

  async updateSettings(input: {
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
    systemPromptOverride?: string | null;
    enabled?: boolean;
  }) {
    const s = await this.ensureSettings();
    if (input.model !== undefined) {
      if (!input.model.trim()) {
        throw new BadRequestException('model must not be empty');
      }
      s.model = input.model.trim().slice(0, 200);
    }
    if (input.temperature !== undefined) {
      if (input.temperature < 0 || input.temperature > 2) {
        throw new BadRequestException('temperature must be between 0 and 2');
      }
      s.temperature = String(input.temperature);
    }
    if (input.maxOutputTokens !== undefined) {
      if (input.maxOutputTokens < 64 || input.maxOutputTokens > 4000) {
        throw new BadRequestException('maxOutputTokens must be between 64 and 4000');
      }
      s.maxOutputTokens = input.maxOutputTokens;
    }
    if (input.systemPromptOverride !== undefined) {
      s.systemPromptOverride = input.systemPromptOverride?.trim() || null;
    }
    if (input.enabled !== undefined) {
      s.enabled = input.enabled;
    }
    await this.settingsRepo.save(s);
    return this.getSettings();
  }

  // --- Internal helpers ------------------------------------------------

  private async findConvForUser(user: AuthenticatedUser, id: string) {
    const conv = await this.convRepo.findOneBy({ id });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (user.role !== UserRole.Admin && conv.userId !== user.id) {
      throw new ForbiddenException('Not your conversation');
    }
    return conv;
  }

  private requireAdmin(user: AuthenticatedUser) {
    if (user.role !== UserRole.Admin) {
      throw new ForbiddenException('Admin only');
    }
  }

  private async saveMessage(
    conv: SupportConversation,
    input: {
      role: SupportMessageRole;
      authorId: string | null;
      content: string;
      toolCalls?: SupportMessage['toolCalls'];
      model?: string | null;
    },
  ): Promise<MessageView> {
    const saved = await this.msgRepo.save(
      this.msgRepo.create({
        conversationId: conv.id,
        role: input.role,
        authorId: input.authorId,
        content: input.content,
        toolCalls: input.toolCalls ?? null,
        model: input.model ?? null,
      }),
    );
    conv.lastMessageAt = saved.createdAt;
    await this.convRepo.save(conv);
    return this.presentMessage(saved);
  }

  private async ensureSettings(): Promise<SupportAiSetting> {
    let s = await this.settingsRepo.findOneBy({ id: 'default' });
    if (!s) {
      s = await this.settingsRepo.save(
        this.settingsRepo.create({
          id: 'default',
          model: 'openai/gpt-4o-mini',
          temperature: '0.2',
          maxOutputTokens: 800,
          enabled: true,
        }),
      );
    }
    return s;
  }

  private async aiEnabled() {
    const s = await this.ensureSettings();
    return s.enabled;
  }

  // --- AI turn --------------------------------------------------------

  private async runAssistantTurn(
    conv: SupportConversation,
  ): Promise<MessageView | null> {
    const settings = await this.ensureSettings();
    const history = await this.buildHistory(conv);
    const systemPrompt =
      settings.systemPromptOverride?.trim() || DEFAULT_SUPPORT_SYSTEM_PROMPT;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history,
    ];

    let toolCallsCollected: SupportMessage['toolCalls'] = [];
    let assistantText = '';
    let handoffReason: string | null = null;

    for (let i = 0; i < MAX_TOOL_ITERATIONS; i += 1) {
      const response = await this.openRouter.chat({
        model: settings.model,
        messages,
        tools: SUPPORT_TOOLS,
        temperature: Number(settings.temperature),
        max_tokens: settings.maxOutputTokens,
        tool_choice: 'auto',
      });
      const choice = response.choices[0];
      if (!choice) break;
      const reply = choice.message;
      messages.push({
        role: 'assistant',
        content: reply.content ?? '',
        tool_calls: reply.tool_calls,
      });
      assistantText = reply.content ?? '';

      if (!reply.tool_calls || reply.tool_calls.length === 0) {
        break;
      }

      // Execute tools, append tool messages, loop.
      for (const call of reply.tool_calls) {
        const args = this.safeParseJson(call.function.arguments);
        const result = await this.tools.run(call.function.name, args, conv.userId);
        toolCallsCollected = [
          ...(toolCallsCollected ?? []),
          { name: call.function.name, args, result },
        ];
        if (
          call.function.name === 'request_human_handoff' &&
          typeof (result as Record<string, unknown>).handoffRequested === 'boolean'
        ) {
          handoffReason =
            String((result as Record<string, unknown>).reason ?? 'Handoff requested');
        }
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          name: call.function.name,
          content: JSON.stringify(result),
        });
      }
    }

    const aiMessage = await this.saveMessage(conv, {
      role: SupportMessageRole.Ai,
      authorId: null,
      content:
        assistantText.trim() ||
        'Sorry — I could not generate a reply. Try rephrasing, or ask me to bring in a human.',
      toolCalls: toolCallsCollected.length ? toolCallsCollected : null,
      model: settings.model,
    });
    this.gateway.emitMessage(conv.id, aiMessage);

    // If the model used the handoff tool, flip state + notify admins. We do
    // this AFTER persisting the assistant text so the user sees the reply
    // confirming the handoff.
    if (handoffReason) {
      const fresh = await this.convRepo.findOneByOrFail({ id: conv.id });
      if (fresh.state === SupportConversationState.AiActive) {
        fresh.state = SupportConversationState.WaitingAdmin;
        fresh.handoffReason = handoffReason;
        await this.convRepo.save(fresh);
        this.gateway.emitStateChanged(fresh);
        await this.notifyAdminsOfHandoff(fresh);
      }
    }

    // Notify the user if they're not connected to this conversation right now.
    await this.maybeNotifyUserOfReply(conv.userId, conv.id, aiMessage.content);

    return aiMessage;
  }

  private async buildHistory(conv: SupportConversation): Promise<ChatMessage[]> {
    const recent = await this.msgRepo.find({
      where: { conversationId: conv.id },
      order: { createdAt: 'DESC' },
      take: HISTORY_TOKEN_BUDGET,
    });
    return recent
      .reverse()
      .filter((m) => m.role !== SupportMessageRole.System)
      .map<ChatMessage>((m) => {
        if (m.role === SupportMessageRole.User) {
          return { role: 'user', content: m.content };
        }
        if (m.role === SupportMessageRole.Admin) {
          // Admin messages are visible to the model so it can take over after
          // a handback gracefully. Prefix to make the source obvious.
          return { role: 'user', content: `[Human admin replied]: ${m.content}` };
        }
        if (m.role === SupportMessageRole.Ai) {
          return { role: 'assistant', content: m.content };
        }
        return { role: 'user', content: m.content };
      });
  }

  private safeParseJson(value: string): Record<string, unknown> {
    if (!value) return {};
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'object' && parsed ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }

  private async notifyAdminsOfHandoff(conv: SupportConversation) {
    await this.notificationsService.create({
      audience: NotificationAudience.Admin,
      type: NotificationType.System,
      title: 'Support handoff requested',
      message:
        conv.handoffReason ?? 'A user has requested human assistance.',
      data: { conversationId: conv.id, userId: conv.userId, kind: 'support_handoff' },
    });
  }

  private async maybeNotifyAdminOfUserMessage(
    conv: SupportConversation,
    content: string,
  ) {
    // Only ping if no admin is actively reading the room.
    if (this.gateway.adminInRoom(conv.id)) return;
    await this.notificationsService.create({
      audience: NotificationAudience.Admin,
      type: NotificationType.System,
      title: 'New support message',
      message: content.length > 80 ? `${content.slice(0, 80)}…` : content,
      data: { conversationId: conv.id, userId: conv.userId, kind: 'support_message' },
    });
  }

  private async maybeNotifyUserOfReply(
    userId: string,
    conversationId: string,
    content: string,
  ) {
    if (this.gateway.userInRoom(userId, conversationId)) return;
    await this.notificationsService.create({
      audience: NotificationAudience.User,
      recipientId: userId,
      type: NotificationType.System,
      title: 'BidNaija Support replied',
      message: content.length > 80 ? `${content.slice(0, 80)}…` : content,
      data: { conversationId, kind: 'support_message' },
    });
  }

  // --- Presenters ------------------------------------------------------

  private presentConversation(conv: SupportConversation) {
    const unreadForUser =
      conv.lastMessageAt &&
      (!conv.userLastReadAt || conv.lastMessageAt > conv.userLastReadAt);
    const unreadForAdmin =
      conv.lastMessageAt &&
      (!conv.adminLastReadAt || conv.lastMessageAt > conv.adminLastReadAt);
    return {
      id: conv.id,
      userId: conv.userId,
      state: conv.state,
      subject: conv.subject,
      assignedAdminId: conv.assignedAdminId,
      handoffReason: conv.handoffReason,
      lastMessageAt: conv.lastMessageAt,
      userLastReadAt: conv.userLastReadAt,
      adminLastReadAt: conv.adminLastReadAt,
      unreadForUser: Boolean(unreadForUser),
      unreadForAdmin: Boolean(unreadForAdmin),
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    };
  }

  private presentMessage(m: SupportMessage): MessageView {
    return {
      id: m.id,
      conversationId: m.conversationId,
      role: m.role,
      authorId: m.authorId,
      content: m.content,
      toolCalls: m.toolCalls,
      model: m.model,
      createdAt: m.createdAt,
    };
  }
}
