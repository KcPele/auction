import type { WalletFundingAccount } from '../entities/wallet-funding-account.entity';

export function presentFundingAccount(account: WalletFundingAccount) {
  return {
    id: account.id,
    userId: account.userId,
    provider: account.provider,
    accountReference: account.accountReference,
    accountNumber: account.accountNumber,
    accountName: account.accountName,
    bankName: account.bankName,
    bankCode: account.bankCode,
    reservationReference: account.reservationReference,
    status: account.status,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}
