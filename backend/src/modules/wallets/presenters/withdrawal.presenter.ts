import type { WalletWithdrawal } from '../entities/wallet-withdrawal.entity';

export function presentWithdrawal(withdrawal: WalletWithdrawal) {
  return {
    id: withdrawal.id,
    userId: withdrawal.userId,
    amountKobo: withdrawal.amountKobo,
    currency: withdrawal.currency,
    status: withdrawal.status,
    provider: withdrawal.provider,
    providerReference: withdrawal.providerReference,
    destinationBankCode: withdrawal.destinationBankCode,
    destinationBankName: withdrawal.destinationBankName,
    destinationAccountNumber: withdrawal.destinationAccountNumber,
    destinationAccountName: withdrawal.destinationAccountName,
    narration: withdrawal.narration,
    completedAt: withdrawal.completedAt,
    failedAt: withdrawal.failedAt,
    createdAt: withdrawal.createdAt,
    updatedAt: withdrawal.updatedAt,
  };
}
