import { apiClient } from "@/app/lib/api/client";
import { toWithdrawal } from "@/app/components/wallet/api/wallet.api";
import type {
  ListWithdrawalsResponseDto,
  Withdrawal,
  WithdrawalDto,
  WithdrawalStatus,
} from "@/app/components/wallet/types/wallet.types";

type AdminPendingResponseDto = { withdrawals: WithdrawalDto[] };

export const listAdminPendingWithdrawals = async (): Promise<Withdrawal[]> => {
  const dto = await apiClient<AdminPendingResponseDto>(
    "/admin/wallet-withdrawals/pending",
  );
  return dto.withdrawals.map(toWithdrawal);
};

export const listAllAdminWithdrawals = async (
  params: { status?: WithdrawalStatus; limit?: number; offset?: number } = {},
): Promise<{ items: Withdrawal[]; total: number }> => {
  const dto = await apiClient<ListWithdrawalsResponseDto>(
    "/admin/wallet-withdrawals",
    {
      query: {
        status: params.status,
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
      },
    },
  );
  return { total: dto.total, items: dto.items.map(toWithdrawal) };
};
