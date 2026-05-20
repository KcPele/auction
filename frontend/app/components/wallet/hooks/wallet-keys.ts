import type { WithdrawalStatus } from "../types/wallet.types";

export const walletKeys = {
  all: ["wallets"] as const,
  me: () => [...walletKeys.all, "me"] as const,
  ledger: () => [...walletKeys.all, "ledger"] as const,
  ledgerPage: (p: { limit: number; offset: number }) =>
    [...walletKeys.ledger(), p] as const,
  withdrawals: () => [...walletKeys.all, "withdrawals"] as const,
  withdrawalsList: (p: {
    limit: number;
    offset: number;
    status?: WithdrawalStatus;
  }) => [...walletKeys.withdrawals(), p] as const,
  fundingAccount: () => [...walletKeys.all, "funding-account"] as const,
};
