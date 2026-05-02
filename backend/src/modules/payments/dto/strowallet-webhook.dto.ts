export type StrowalletWebhookDto = Record<string, unknown> & {
  accountReference?: string;
  accountNumber?: string;
  sessionId?: string;
  amount?: string | number;
  type?: string;
  status?: string;
};
