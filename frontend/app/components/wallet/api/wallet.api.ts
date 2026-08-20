import { apiClient } from "@/app/lib/api/client";
import { koboToNaira, nairaToKobo } from "@/app/lib/format/money";
import type {
  BankOption,
  CreateWithdrawalInput,
  FundingAccount,
  GetFundingAccountResponseDto,
  GetWalletResponseDto,
  LedgerEntry,
  LedgerPage,
  LedgerEntryDto,
  ListLedgerResponseDto,
  ListWithdrawalsResponseDto,
  Wallet,
  Withdrawal,
  WithdrawalDto,
  WithdrawalStatus,
  ResolvedBankAccount,
} from "../types/wallet.types";
import type { ActivityBucket } from "../utils/ledger-display";

const TYPE_LABEL: Record<LedgerEntryDto["type"], string> = {
  WALLET_FUNDING_CONFIRMED: "Wallet top-up",
  WITHDRAWAL_REQUESTED: "Withdrawal requested",
  WITHDRAWAL_FAILED: "Withdrawal failed",
  WITHDRAWAL_CONFIRMED: "Withdrawal completed",
  BID_HOLD_CREATED: "Bid hold placed",
  BID_HOLD_RELEASED: "Bid hold released",
  BID_HOLD_APPLIED: "Bid hold applied",
  BID_HOLD_FORFEITED: "Bid forfeited",
  FINAL_PAYMENT_CONFIRMED: "Final payment confirmed",
  ADMIN_ADJUSTMENT: "Admin adjustment",
};

// Sign the amount based on whether the entry credits or debits the wallet.
const CREDIT_TYPES = new Set<LedgerEntryDto["type"]>([
  "WALLET_FUNDING_CONFIRMED",
  "BID_HOLD_RELEASED",
  "WITHDRAWAL_FAILED",
]);

export const toLedgerEntry = (dto: LedgerEntryDto): LedgerEntry => {
  const naira = koboToNaira(dto.amountKobo);
  const signed =
    dto.balanceAfterKobo > dto.balanceBeforeKobo
      ? Math.abs(naira)
      : dto.balanceAfterKobo < dto.balanceBeforeKobo
        ? -Math.abs(naira)
        : CREDIT_TYPES.has(dto.type)
          ? Math.abs(naira)
          : -Math.abs(naira);
  return {
    id: dto.id,
    type: dto.type,
    amount: signed,
    description: TYPE_LABEL[dto.type] ?? dto.type,
    reference: dto.reference,
    createdAt: new Date(dto.createdAt),
  };
};

const maskAccount = (n: string): string =>
  n.length <= 4 ? `****${n}` : `****${n.slice(-4)}`;

export const toWithdrawal = (dto: WithdrawalDto): Withdrawal => ({
  id: dto.id,
  amount: koboToNaira(dto.amountKobo),
  status: dto.status,
  bankName: dto.destinationBankName,
  accountNumberMasked: maskAccount(dto.destinationAccountNumber),
  accountName: dto.destinationAccountName,
  narration: dto.narration,
  createdAt: new Date(dto.createdAt),
  completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
});

export const getWallet = async (): Promise<Wallet> => {
  const { wallet } = await apiClient<GetWalletResponseDto>("/wallets/me");
  return {
    id: wallet.id,
    balance: koboToNaira(wallet.balanceKobo),
    available: koboToNaira(wallet.availableKobo),
    held: koboToNaira(wallet.heldKobo),
    updatedAt: new Date(wallet.updatedAt),
  };
};

export const getLedger = async (
  params: { limit?: number; offset?: number; activity?: ActivityBucket } = {},
): Promise<LedgerPage> => {
  const { ledgerEntries, total } = await apiClient<ListLedgerResponseDto>(
    "/wallets/me/ledger",
    {
      query: {
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
        activity: params.activity,
      },
    },
  );
  return { items: ledgerEntries.map(toLedgerEntry), total };
};

export const listMyWithdrawals = async (
  params: {
    limit?: number;
    offset?: number;
    status?: WithdrawalStatus;
  } = {},
): Promise<{ items: Withdrawal[]; total: number }> => {
  const dto = await apiClient<ListWithdrawalsResponseDto>(
    "/wallets/me/withdrawals",
    {
      query: {
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
        status: params.status,
      },
    },
  );
  return { items: dto.items.map(toWithdrawal), total: dto.total };
};

export const getFundingAccount = async (): Promise<FundingAccount> => {
  const { fundingAccount } = await apiClient<GetFundingAccountResponseDto>(
    "/wallets/funding-account",
    { method: "POST" },
  );
  return {
    accountNumber: fundingAccount.accountNumber,
    accountName: fundingAccount.accountName,
    bankName: fundingAccount.bankName,
    reference: fundingAccount.accountReference,
  };
};

export const initiateTopup = (input: {
  amountNaira: number;
  method: "bank_transfer";
  category?: string;
}): Promise<FundingAccount> =>
  apiClient<FundingAccount>("/wallets/topup/initiate", {
    method: "POST",
    body: {
      amountKobo: nairaToKobo(input.amountNaira),
      method: input.method,
      ...(input.category ? { category: input.category } : {}),
    },
    headers: { "Idempotency-Key": crypto.randomUUID() },
  });

/**
 * Sandbox-only: instantly credit the caller's wallet without a real transfer.
 * Backend rejects this in production. Wired to the Simulate button on the
 * funding instructions screen.
 */
export const simulateTopup = (input: { amountNaira: number }) =>
  apiClient<unknown>("/wallets/topup/simulate", {
    method: "POST",
    body: { amountNaira: input.amountNaira },
    headers: { "Idempotency-Key": crypto.randomUUID() },
  });

export const createWithdrawal = (input: CreateWithdrawalInput) =>
  apiClient<{ withdrawal: WithdrawalDto }>("/wallets/withdrawals", {
    method: "POST",
    body: {
      amountKobo: nairaToKobo(input.amountNaira),
      destinationBankCode: input.destinationBankCode,
      destinationBankName: input.destinationBankName,
      destinationAccountNumber: input.destinationAccountNumber,
      destinationAccountName: input.destinationAccountName,
      ...(input.narration ? { narration: input.narration } : {}),
    },
    headers: { "Idempotency-Key": crypto.randomUUID() },
  });

export const listSupportedBanks = async (): Promise<BankOption[]> => {
  const { banks } = await apiClient<{ banks: BankOption[] }>("/payments/banks");
  return banks;
};

export const resolveBankAccount = (input: {
  bankCode: string;
  accountNumber: string;
}) =>
  apiClient<ResolvedBankAccount>("/payments/banks/account-name", {
    query: input,
  });
