import { BadRequestException } from '@nestjs/common';
import { SupportConversationState } from '../../common/enums/support-conversation-state.enum';
import { SupportAiRunner } from './support-ai-runner.service';

describe('SupportAiRunner', () => {
  const setting = {
    id: 'default',
    model: 'test/model',
    temperature: '0.2',
    maxOutputTokens: 800,
    systemPromptOverride: null,
    enabled: true,
    updatedAt: new Date(),
  };
  let settings: {
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let messages: { find: jest.Mock };
  let tools: { run: jest.Mock };
  let openRouter: { chat: jest.Mock };
  let runner: SupportAiRunner;

  beforeEach(() => {
    settings = {
      findOneBy: jest.fn().mockResolvedValue({ ...setting }),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    messages = { find: jest.fn().mockResolvedValue([]) };
    tools = { run: jest.fn() };
    openRouter = { chat: jest.fn() };
    runner = new SupportAiRunner(
      settings as never,
      messages as never,
      tools as never,
      openRouter as never,
    );
  });

  it('returns a safe fallback when the provider has no answer', async () => {
    openRouter.chat.mockResolvedValue({
      choices: [{ message: { content: '', tool_calls: [] } }],
    });

    await expect(runner.generate(conversation())).resolves.toEqual(
      expect.objectContaining({
        content: expect.stringContaining('could not generate a reply'),
        handoffReason: null,
        model: setting.model,
      }),
    );
  });

  it('executes tools and reports a requested human handoff', async () => {
    openRouter.chat
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: 'I will bring in a human.',
              tool_calls: [
                {
                  id: 'tool-1',
                  function: {
                    name: 'request_human_handoff',
                    arguments: '{"reason":"Payment issue"}',
                  },
                },
              ],
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: 'A human will reply.', tool_calls: [] } }],
      });
    tools.run.mockResolvedValue({
      handoffRequested: true,
      reason: 'Payment issue',
    });

    await expect(runner.generate(conversation())).resolves.toEqual(
      expect.objectContaining({ handoffReason: 'Payment issue' }),
    );
    expect(tools.run).toHaveBeenCalledWith(
      'request_human_handoff',
      { reason: 'Payment issue' },
      'user-id',
    );
  });

  it('validates settings before saving them', async () => {
    await expect(
      runner.updateSettings({ temperature: 3 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(settings.save).not.toHaveBeenCalled();
  });
});

function conversation() {
  return {
    id: 'conversation-id',
    userId: 'user-id',
    state: SupportConversationState.AiActive,
  } as never;
}
