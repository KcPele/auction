import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type CreateVirtualAccountInput = {
  email: string;
  accountName: string;
  phone: string;
};

export type InitiateBankTransferInput = {
  amountKobo: number;
  bankCode: string;
  accountNumber: string;
  narration: string;
  nameEnquiryReference: string;
  senderName?: string;
};

export type VerifyBvnInput = {
  number: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber: string;
};

export type VerifyNinInput = {
  numberNin: string;
  surname: string;
  firstname: string;
  birthdate: string;
  telephoneno: string;
};

export type CreateSubaccountInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bvn: string;
  state: string;
  pin: string;
  address: string;
  country: string;
  websiteUrl?: string;
  cac?: string;
  business?: string;
  companyType?: string;
};

@Injectable()
export class StrowalletProvider {
  constructor(private readonly config: ConfigService) {}

  createVirtualAccount(input: CreateVirtualAccountInput) {
    return this.postJson<Record<string, unknown>>('/api/virtual-bank/new-customer', {
      public_key: this.publicKey,
      email: input.email,
      account_name: input.accountName,
      phone: input.phone,
      webhook_url: this.webhookUrl,
      mode: this.mode,
      ...(this.developerCode ? { developer_code: this.developerCode } : {}),
    });
  }

  getBanks() {
    return this.get<Record<string, unknown>>('/api/banks/lists', {
      public_key: this.publicKey,
    });
  }

  getAccountName(input: { bankCode: string; accountNumber: string }) {
    return this.get<Record<string, unknown>>('/api/banks/get-customer-name', {
      public_key: this.publicKey,
      bank_code: input.bankCode,
      account_number: input.accountNumber,
    });
  }

  initiateBankTransfer(input: InitiateBankTransferInput) {
    return this.postQuery<Record<string, unknown>>('/api/banks/request/', {
      public_key: this.publicKey,
      amount: String(input.amountKobo / 100),
      bank_code: input.bankCode,
      account_number: input.accountNumber,
      narration: input.narration,
      name_enquiry_reference: input.nameEnquiryReference,
      mode: this.mode,
      ...(input.senderName ? { SenderName: input.senderName } : {}),
    });
  }

  sendOtp(input: { phone: string; otp: string }) {
    return this.postQuery<Record<string, unknown>>('/api/Otp-sms/', {
      public_key: this.publicKey,
      phone: input.phone,
      otp: input.otp,
    });
  }

  verifyBvn(input: VerifyBvnInput) {
    return this.postQuery<Record<string, unknown>>('/api/kyc_bvn/', {
      public_key: this.publicKey,
      number: input.number,
      firstName: input.firstName.toUpperCase(),
      lastName: input.lastName.toUpperCase(),
      dateOfBirth: input.dateOfBirth,
      phoneNumber: input.phoneNumber,
      mode: this.mode,
    });
  }

  verifyNin(input: VerifyNinInput) {
    return this.postQuery<Record<string, unknown>>('/api/kyc_verinin/', {
      public_key: this.publicKey,
      number_nin: input.numberNin,
      surname: input.surname.toUpperCase(),
      firstname: input.firstname.toUpperCase(),
      birthdate: input.birthdate,
      telephoneno: input.telephoneno,
    });
  }

  createSubaccount(input: CreateSubaccountInput) {
    return this.postQuery<Record<string, unknown>>('/api/create_subaccount', {
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      phone: input.phone,
      bvn: input.bvn,
      state: input.state,
      pin: input.pin,
      address: input.address,
      country: input.country,
      secret_key: this.secretKey,
      merchant_id: this.merchantId,
      website_url: input.websiteUrl ?? this.websiteUrl,
      ...(input.cac ? { cac: input.cac } : {}),
      ...(input.business ? { business: input.business } : {}),
      ...(input.companyType ? { company_type: input.companyType } : {}),
    });
  }

  private async get<T>(path: string, params: Record<string, string>) {
    return this.request<T>(path, {
      method: 'GET',
      params,
    });
  }

  private async postQuery<T>(path: string, params: Record<string, string>) {
    return this.request<T>(path, {
      method: 'POST',
      params,
    });
  }

  private async postJson<T>(path: string, body: Record<string, unknown>) {
    return this.request<T>(path, {
      method: 'POST',
      body,
    });
  }

  private async request<T>(
    path: string,
    options: {
      method: 'GET' | 'POST';
      params?: Record<string, string>;
      body?: Record<string, unknown>;
    },
  ) {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(options.params ?? {})) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url, {
      method: options.method,
      headers: options.body ? { 'content-type': 'application/json' } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = (await response.json().catch(() => ({}))) as T & {
      success?: boolean;
      status?: boolean;
      message?: string;
      errors?: unknown;
    };

    if (!response.ok || data.success === false || data.status === false) {
      throw new ServiceUnavailableException(
        data.message || 'Strowallet request failed',
      );
    }

    return data;
  }

  private get baseUrl() {
    return this.config
      .get<string>('STROWALLET_BASE_URL', 'https://strowallet.com')
      .replace(/\/$/, '');
  }

  private get publicKey() {
    const key = this.config.get<string>('STROWALLET_PUBLIC_KEY');
    if (!key) throw new ServiceUnavailableException('Strowallet public key is not set');
    return key;
  }

  private get secretKey() {
    const key = this.config.get<string>('STROWALLET_SECRET_KEY');
    if (!key) throw new ServiceUnavailableException('Strowallet secret key is not set');
    return key;
  }

  private get merchantId() {
    const id = this.config.get<string>('STROWALLET_MERCHANT_ID');
    if (!id) throw new ServiceUnavailableException('Strowallet merchant id is not set');
    return id;
  }

  private get webhookUrl() {
    const url = this.config.get<string>('STROWALLET_WEBHOOK_URL');
    if (!url) throw new ServiceUnavailableException('Strowallet webhook url is not set');
    return url;
  }

  private get websiteUrl() {
    const url = this.config.get<string>('STROWALLET_WEBSITE_URL');
    if (!url) throw new ServiceUnavailableException('Strowallet website url is not set');
    return url;
  }

  private get developerCode() {
    return this.config.get<string>('STROWALLET_DEVELOPER_CODE');
  }

  private get mode() {
    return this.config.get<string>('STROWALLET_MODE', 'sandbox');
  }
}
