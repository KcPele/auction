import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportMessageRole } from '../../common/enums/support-conversation-state.enum';
import { SupportAiSetting } from './entities/support-ai-setting.entity';
import type { SupportConversation } from './entities/support-conversation.entity';
import { SupportMessage } from './entities/support-message.entity';
import { OpenRouterClient, type ChatMessage } from './openrouter.client';
import {
  DEFAULT_SUPPORT_SYSTEM_PROMPT,
  SUPPORT_TOOLS,
} from './support-ai.prompt';
import { SupportAiTools } from './support-ai.tools';

const MAX_TOOL_ITERATIONS = 4;
const HISTORY_TOKEN_BUDGET = 20;

@Injectable()
export class SupportAiRunner {
  constructor(
    @InjectRepository(SupportAiSetting)
    private readonly settings: Repository<SupportAiSetting>,
    @InjectRepository(SupportMessage)
    private readonly messages: Repository<SupportMessage>,
    private readonly tools: SupportAiTools,
    private readonly openRouter: OpenRouterClient,
  ) {}

  async isEnabled() {
    return (await this.ensureSettings()).enabled;
  }

  async getSettings() {
    const setting = await this.ensureSettings();
    return {
      model: setting.model,
      temperature: Number(setting.temperature),
      maxOutputTokens: setting.maxOutputTokens,
      systemPromptOverride: setting.systemPromptOverride,
      enabled: setting.enabled,
      updatedAt: setting.updatedAt,
    };
  }

  async updateSettings(input: {
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
    systemPromptOverride?: string | null;
    enabled?: boolean;
  }) {
    const setting = await this.ensureSettings();
    if (input.model !== undefined) {
      if (!input.model.trim())
        throw new BadRequestException('model must not be empty');
      setting.model = input.model.trim().slice(0, 200);
    }
    if (input.temperature !== undefined) {
      if (input.temperature < 0 || input.temperature > 2)
        throw new BadRequestException('temperature must be between 0 and 2');
      setting.temperature = String(input.temperature);
    }
    if (input.maxOutputTokens !== undefined) {
      if (input.maxOutputTokens < 64 || input.maxOutputTokens > 4000)
        throw new BadRequestException(
          'maxOutputTokens must be between 64 and 4000',
        );
      setting.maxOutputTokens = input.maxOutputTokens;
    }
    if (input.systemPromptOverride !== undefined)
      setting.systemPromptOverride =
        input.systemPromptOverride?.trim() || null;
    if (input.enabled !== undefined) setting.enabled = input.enabled;
    await this.settings.save(setting);
    return this.getSettings();
  }

  async generate(conversation: SupportConversation) {
    const setting = await this.ensureSettings();
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          setting.systemPromptOverride?.trim() ||
          DEFAULT_SUPPORT_SYSTEM_PROMPT,
      },
      ...(await this.buildHistory(conversation.id)),
    ];
    let toolCalls: SupportMessage['toolCalls'] = [];
    let content = '';
    let handoffReason: string | null = null;

    for (let index = 0; index < MAX_TOOL_ITERATIONS; index += 1) {
      const response = await this.openRouter.chat({
        model: setting.model,
        messages,
        tools: SUPPORT_TOOLS,
        temperature: Number(setting.temperature),
        max_tokens: setting.maxOutputTokens,
        tool_choice: 'auto',
      });
      const reply = response.choices[0]?.message;
      if (!reply) break;
      messages.push({
        role: 'assistant',
        content: reply.content ?? '',
        tool_calls: reply.tool_calls,
      });
      content = reply.content ?? '';
      if (!reply.tool_calls?.length) break;

      for (const call of reply.tool_calls) {
        const args = safeParseJson(call.function.arguments);
        const result = await this.tools.run(
          call.function.name,
          args,
          conversation.userId,
        );
        toolCalls = [
          ...(toolCalls ?? []),
          { name: call.function.name, args, result },
        ];
        if (call.function.name === 'request_human_handoff') {
          const output = result as Record<string, unknown>;
          if (typeof output.handoffRequested === 'boolean')
            handoffReason = String(output.reason ?? 'Handoff requested');
        }
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          name: call.function.name,
          content: JSON.stringify(result),
        });
      }
    }

    return {
      content:
        content.trim() ||
        'Sorry — I could not generate a reply. Try rephrasing, or ask me to bring in a human.',
      toolCalls: toolCalls?.length ? toolCalls : null,
      model: setting.model,
      handoffReason,
    };
  }

  private async ensureSettings() {
    let setting = await this.settings.findOneBy({ id: 'default' });
    if (!setting) {
      setting = await this.settings.save(
        this.settings.create({
          id: 'default',
          model: 'xiaomi/mimo-v2-flash',
          temperature: '0.2',
          maxOutputTokens: 800,
          enabled: true,
        }),
      );
    }
    return setting;
  }

  private async buildHistory(conversationId: string): Promise<ChatMessage[]> {
    const recent = await this.messages.find({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      take: HISTORY_TOKEN_BUDGET,
    });
    return recent
      .reverse()
      .filter((message) => message.role !== SupportMessageRole.System)
      .map((message) => {
        if (message.role === SupportMessageRole.User)
          return { role: 'user' as const, content: message.content };
        if (message.role === SupportMessageRole.Admin)
          return {
            role: 'user' as const,
            content: `[Human admin replied]: ${message.content}`,
          };
        if (message.role === SupportMessageRole.Ai)
          return { role: 'assistant' as const, content: message.content };
        return { role: 'user' as const, content: message.content };
      });
  }
}

function safeParseJson(value: string): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === 'object' && parsed
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}
