import type { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

describe('EmailService', () => {
  afterEach(() => jest.restoreAllMocks());

  it('keeps local test email inside development even when a provider key exists', async () => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'RESEND_API_KEY') return 'configured-key';
        if (key === 'NODE_ENV') return 'development';
        return undefined;
      }),
    };
    const fetchSpy = jest.spyOn(global, 'fetch');
    const service = new EmailService(config as unknown as ConfigService);

    await service.send({
      to: 'qa.user@bidnaija.local',
      subject: 'Verification code',
      html: '<p>123456</p>',
      text: '123456',
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
