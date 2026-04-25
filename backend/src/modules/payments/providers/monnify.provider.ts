import { ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';

type MonnifyResponse<T> = {
  requestSuccessful: boolean;
  responseMessage: string;
  responseCode: string;
  responseBody: T;
};

type ReservedAccountResponse = {
  accountReference: string;
  accountName: string;
  accounts: Array<{
    bankCode?: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
  }>;
  reservationReference?: string;
  status: string;
};

type TransferResponse = {
  amount: number;
  reference: string;
  status: string;
  destinationAccountName?: string;
  destinationBankName?: string;
  destinationAccountNumber?: string;
  destinationBankCode?: string;
};

export type CreateReservedAccountInput = {
  accountReference: string;
  accountName: string;
  customerEmail: string;
  customerName: string;
  nin: string;
};

export type InitiateWithdrawalInput = {
  amountKobo: number;
  reference: string;
  narration: string;
  destinationBankCode: string;
  destinationBankName: string;
  destinationAccountNumber: string;
  destinationAccountName: string;
};

export class MonnifyProvider {
  private accessToken: string | null = null;
  private accessTokenExpiresAt = 0;

  constructor(private readonly config: ConfigService) {}

  async createReservedAccount(input: CreateReservedAccountInput) {
    const response = await this.request<ReservedAccountResponse>(
      '/api/v2/bank-transfer/reserved-accounts',
      {
        method: 'POST',
        body: {
          accountReference: input.accountReference,
          accountName: input.accountName,
          currencyCode: 'NGN',
          contractCode: this.contractCode,
          customerEmail: input.customerEmail,
          customerName: input.customerName,
          nin: input.nin,
          getAllAvailableBanks: true,
        },
      },
    );

    return response.responseBody;
  }

  async initiateWithdrawal(input: InitiateWithdrawalInput) {
    const body: Record<string, unknown> = {
      amount: input.amountKobo / 100,
      reference: input.reference,
      narration: input.narration,
      destinationBankCode: input.destinationBankCode,
      destinationBankName: input.destinationBankName,
      destinationAccountNumber: input.destinationAccountNumber,
      destinationAccountName: input.destinationAccountName,
      currency: 'NGN',
      async: true,
    };

    if (this.sourceAccountNumber) {
      body.sourceAccountNumber = this.sourceAccountNumber;
    }

    const response = await this.request<TransferResponse>(
      '/api/v2/disbursements/single',
      { method: 'POST', body },
    );

    return response.responseBody;
  }

  verifyWebhookSignature(payload: string, signature?: string) {
    if (!signature || !this.clientSecret) {
      return false;
    }

    return (
      createHmac('sha512', this.clientSecret).update(payload).digest('hex') ===
      signature
    );
  }

  private async request<T>(
    path: string,
    options: { method: 'GET' | 'POST'; body?: Record<string, unknown> },
  ) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: options.method,
      headers: {
        authorization: `Bearer ${await this.getAccessToken()}`,
        'content-type': 'application/json',
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = (await response.json()) as MonnifyResponse<T>;

    if (!response.ok || !data.requestSuccessful) {
      throw new ServiceUnavailableException(
        data.responseMessage || 'Monnify request failed',
      );
    }

    return data;
  }

  private async getAccessToken() {
    if (this.accessToken && Date.now() < this.accessTokenExpiresAt) {
      return this.accessToken;
    }

    if (!this.apiKey || !this.clientSecret) {
      throw new ServiceUnavailableException('Monnify credentials are not set');
    }

    const credentials = Buffer.from(
      `${this.apiKey}:${this.clientSecret}`,
    ).toString('base64');
    const response = await fetch(`${this.baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        authorization: `Basic ${credentials}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    const data = (await response.json()) as MonnifyResponse<{
      accessToken: string;
      expiresIn: number;
    }>;

    if (!response.ok || !data.requestSuccessful) {
      throw new ServiceUnavailableException(
        data.responseMessage || 'Monnify authentication failed',
      );
    }

    this.accessToken = data.responseBody.accessToken;
    this.accessTokenExpiresAt =
      Date.now() + Math.max(data.responseBody.expiresIn - 60, 0) * 1000;

    return this.accessToken;
  }

  private get baseUrl() {
    return this.config
      .get<string>('MONNIFY_BASE_URL', 'https://sandbox.monnify.com')
      .replace(/\/$/, '');
  }

  private get contractCode() {
    const contractCode = this.config.get<string>('MONNIFY_CONTRACT_CODE');

    if (!contractCode) {
      throw new ServiceUnavailableException('Monnify contract code is not set');
    }

    return contractCode;
  }

  private get apiKey() {
    return this.config.get<string>('MONNIFY_API_KEY');
  }

  private get clientSecret() {
    return this.config.get<string>('MONNIFY_CLIENT_SECRET');
  }

  private get sourceAccountNumber() {
    return this.config.get<string>('MONNIFY_SOURCE_ACCOUNT_NUMBER');
  }
}
