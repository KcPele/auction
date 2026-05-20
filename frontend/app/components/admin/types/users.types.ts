export type AdminUserStatus = "active" | "banned";

export type AdminUserItemDto = {
  id: string;
  handle: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  isBanned: boolean;
  walletBalanceKobo: number;
  walletHoldKobo: number;
  createdAt: string;
};

export type ListAdminUsersResponseDto = {
  items: AdminUserItemDto[];
  total: number;
};

export type AdminUserItem = {
  id: string;
  handle: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  isBanned: boolean;
  walletBalance: number; // naira
  walletHold: number; // naira
  createdAt: Date;
};

export type AdminUserWalletLedgerDto = {
  id: string;
  type: string;
  amountKobo: number;
  reference: string | null;
  createdAt: string;
};

export type AdminUserWalletResponseDto = {
  balanceKobo: number;
  holdKobo: number;
  ledger: AdminUserWalletLedgerDto[];
};

export type AdminUserWallet = {
  balance: number;
  hold: number;
  ledger: {
    id: string;
    type: string;
    amount: number; // naira
    reference: string | null;
    createdAt: Date;
  }[];
};
