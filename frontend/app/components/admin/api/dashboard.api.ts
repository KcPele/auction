import { apiClient } from "@/app/lib/api/client";
import { koboToNaira } from "@/app/lib/format/money";
import type {
  ActivityFeedItem,
  ActivityFeedResponseDto,
  AdminAuctionItem,
  AdminLedgerEntry,
  DashboardStats,
  DashboardStatsDto,
  ListAdminAuctionsResponseDto,
  ListAdminLedgerResponseDto,
  SystemHealthResponseDto,
  SystemServiceDto,
} from "../types/dashboard.types";

export const getDashboardStats = async (
  range: string,
): Promise<DashboardStats> => {
  const dto = await apiClient<DashboardStatsDto>("/admin/dashboard/stats", {
    query: { range },
  });
  return {
    gmv: koboToNaira(dto.gmvKobo),
    auctionsSettled: dto.auctionsSettled,
    walletHolds: koboToNaira(dto.walletHoldsKobo),
    activeBids: dto.activeBids,
    paymentSuccessRate: dto.paymentSuccessRate,
  };
};

export const getActivityFeed = async (
  params: { limit?: number; offset?: number; type?: string } = {},
): Promise<ActivityFeedItem[]> => {
  const dto = await apiClient<ActivityFeedResponseDto>("/admin/activity-feed", {
    query: {
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
      type: params.type,
    },
  });
  return dto.items.map((i) => ({
    id: i.id,
    type: i.type,
    handle: i.handle,
    label: i.label,
    amount:
      i.amountKobo !== undefined && i.amountKobo !== null
        ? koboToNaira(i.amountKobo)
        : null,
    ts: new Date(i.ts),
  }));
};

export const getSystemHealth = async (): Promise<SystemServiceDto[]> => {
  const dto = await apiClient<SystemHealthResponseDto>("/admin/health");
  return dto.services;
};

export const listAdminLedger = async (
  params: { limit?: number; offset?: number; type?: string } = {},
): Promise<{ items: AdminLedgerEntry[]; total: number }> => {
  const dto = await apiClient<ListAdminLedgerResponseDto>("/admin/ledger", {
    query: {
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
      type: params.type,
    },
  });
  return {
    total: dto.total,
    items: dto.items.map((e) => ({
      id: e.id,
      ts: new Date(e.ts),
      handle: e.handle,
      action: e.action,
      ref: e.ref,
      amount: koboToNaira(e.amountKobo),
      direction: e.direction,
    })),
  };
};

export const cancelAuction = (input: { id: string; reason?: string }) =>
  apiClient<unknown>(`/auctions/${input.id}/cancel`, {
    method: "POST",
    body: input.reason ? { reason: input.reason } : {},
  });

export const listAdminAuctions = async (
  params: { status?: string; limit?: number; offset?: number } = {},
): Promise<{ items: AdminAuctionItem[]; total: number }> => {
  const dto = await apiClient<ListAdminAuctionsResponseDto>("/admin/auctions", {
    query: {
      status: params.status,
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
    },
  });
  return {
    total: dto.total,
    items: dto.items.map((a) => ({
      id: a.id,
      title: a.title,
      category: a.category === "CAR" ? "cars" : "gadgets",
      status: a.status,
      currentBid: koboToNaira(a.currentBidKobo),
      basePrice: koboToNaira(a.basePriceKobo),
      bidderCount: a.bidderCount,
      holdPercent: a.holdPercent,
      endsAt: new Date(a.endsAt),
    })),
  };
};
