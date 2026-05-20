import { apiClient } from "@/app/lib/api/client";
import { koboToNaira } from "@/app/lib/format/money";
import type {
  AdminUserItem,
  AdminUserItemDto,
  AdminUserStatus,
  AdminUserWallet,
  AdminUserWalletResponseDto,
  ListAdminUsersResponseDto,
} from "../types/users.types";

const toUser = (dto: AdminUserItemDto): AdminUserItem => ({
  id: dto.id,
  handle: dto.handle,
  firstName: dto.firstName,
  lastName: dto.lastName,
  fullName: `${dto.firstName} ${dto.lastName}`.trim(),
  email: dto.email,
  phone: dto.phone,
  role: dto.role,
  isActive: dto.isActive,
  isBanned: dto.isBanned,
  walletBalance: koboToNaira(dto.walletBalanceKobo),
  walletHold: koboToNaira(dto.walletHoldKobo),
  createdAt: new Date(dto.createdAt),
});

export const listAdminUsers = async (
  params: {
    search?: string;
    status?: AdminUserStatus;
    limit?: number;
    offset?: number;
  } = {},
): Promise<{ items: AdminUserItem[]; total: number }> => {
  const dto = await apiClient<ListAdminUsersResponseDto>("/admin/users", {
    query: {
      search: params.search,
      status: params.status,
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
    },
  });
  return { total: dto.total, items: dto.items.map(toUser) };
};

export const banUser = (input: { id: string; reason: string }) =>
  apiClient<unknown>(`/admin/users/${input.id}/ban`, {
    method: "POST",
    body: { reason: input.reason },
  });

export const unbanUser = (id: string) =>
  apiClient<unknown>(`/admin/users/${id}/unban`, { method: "POST" });

export const getAdminUserWallet = async (id: string): Promise<AdminUserWallet> => {
  const dto = await apiClient<AdminUserWalletResponseDto>(
    `/admin/users/${id}/wallet`,
  );
  return {
    balance: koboToNaira(dto.balanceKobo),
    hold: koboToNaira(dto.holdKobo),
    ledger: dto.ledger.map((e) => ({
      id: e.id,
      type: e.type,
      amount: koboToNaira(e.amountKobo),
      reference: e.reference,
      createdAt: new Date(e.createdAt),
    })),
  };
};
