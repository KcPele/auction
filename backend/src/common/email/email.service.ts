import { Global, Injectable, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/**
 * Sends transactional emails through Resend when RESEND_API_KEY is set, or
 * logs them to the console in dev so flows can be tested without a real
 * inbox. Failures throw so Better Auth surfaces the problem to the caller.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  async send(message: EmailMessage): Promise<void> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    const from = this.config.get<string>(
      'EMAIL_FROM',
      'no-reply@bidnaija.local',
    );

    if (!apiKey) {
      this.logger.log(
        `[dev-email] to=${message.to} subject="${message.subject}"\n${message.text ?? message.html}`,
      );
      return;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        ...(message.text ? { text: message.text } : {}),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Resend rejected message (${response.status}): ${body.slice(0, 200)}`,
      );
    }
  }
}

@Global()
@Module({ providers: [EmailService], exports: [EmailService] })
export class EmailModule {}
