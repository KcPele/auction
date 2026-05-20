// Wire types match backend presenters in backend/src/modules/wallets/presenters/.

export type WalletDto = {
  id: string;
  userId: string;
  currency: "NGN";
  balanceKobo: number;
  heldKobo: number;
  availableKobo: number;
  createdAt: string;
  updatedAt: string;
};

export type GetWalletResponseDto = { wallet: WalletDto };

export type WalletLedgerType =
  | "WALLET_FUNDING_CONFIRMED"
  | "WITHDRAWAL_REQUESTED"
  | "WITHDRAWAL_FAILED"
  | "WITHDRAWAL_CONFIRMED"
  | "BID_HOLD_CREATED"
  | "BID_HOLD_RELEASED"
  | "BID_HOLD_APPLIED"
  | "BID_HOLD_FORFEITED"
  | "FINAL_PAYMENT_CONFIRMED"
  | "ADMIN_ADJUSTMENT";

export type LedgerEntryDto = {
  id: string;
  walletId: string;
  userId: string;
  type: WalletLedgerType;
  amountKobo: number;
  balanceBeforeKobo: number;
  balanceAfterKobo: number;
  heldBeforeKobo: number;
  heldAfterKobo: number;
  reference: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type ListLedgerResponseDto = { ledgerEntries: LedgerEntryDto[] };

export type WithdrawalStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "REVERSED";

export type WithdrawalDto = {
  id: string;
  userId: string;
  amountKobo: number;
  currency: "NGN";
  status: WithdrawalStatus;
  provider: string;
  providerReference: string | null;
  destinationBankCode: string;
  destinationBankName: string;
  destinationAccountNumber: string;
  destinationAccountName: string;
  narration: string | null;
  completedAt: string | null;
  failedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListWithdrawalsResponseDto = {
  items: WithdrawalDto[];
  total: number;
};

export type FundingAccountDto = {
  id: string;
  userId: string;
  provider: string;
  accountReference: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string | null;
  reservationReference: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type GetFundingAccountResponseDto = {
  fundingAccount: FundingAccountDto;
  created: boolean;
};

// View models
export type Wallet = {
  id: string;
  balance: number; // naira (total)
  available: number; // naira
  held: number; // naira
  updatedAt: Date;
};

export type LedgerEntry = {
  id: string;
  type: WalletLedgerType;
  /** + for credit, - for debit (display) */
  amount: number; // naira (signed)
  description: string;
  reference: string | null;
  createdAt: Date;
};

export type Withdrawal = {
  id: string;
  amount: number; // naira
  status: WithdrawalStatus;
  bankName: string;
  accountNumberMasked: string;
  accountName: string;
  narration: string | null;
  createdAt: Date;
  completedAt: Date | null;
};

export type FundingAccount = {
  accountNumber: string;
  accountName: string;
  bankName: string;
  reference: string;
};

export type CreateWithdrawalInput = {
  amountNaira: number;
  destinationBankCode: string;
  destinationBankName: string;
  destinationAccountNumber: string;
  destinationAccountName: string;
  narration?: string;
};
