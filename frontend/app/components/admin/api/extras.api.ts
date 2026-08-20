import { apiClient } from "@/app/lib/api/client";

// Mechanics
export type AdminMechanicDto = {
  id: string;
  userId: string;
  name: string;
  shopName: string | null;
  city: string | null;
  inspectionCount: number;
  rating: number;
  status: string;
  isActive: boolean;
  isBanned: boolean;
};

export const listAdminMechanics = async (
  params: {
    mechanicId?: string;
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {},
): Promise<{ items: AdminMechanicDto[]; total: number }> => {
  return apiClient<{ items: AdminMechanicDto[]; total: number }>(
    "/admin/mechanics",
    {
      query: {
        mechanicId: params.mechanicId,
        search: params.search,
        status: params.status,
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
      },
    },
  );
};

export const verifyMechanic = (id: string) =>
  apiClient<unknown>(`/admin/mechanics/${id}/verify`, { method: "POST" });

export const revokeMechanic = (id: string) =>
  apiClient<unknown>(`/admin/mechanics/${id}/revoke`, { method: "POST" });

// Disputes
export type AdminDisputeDto = {
  id: string;
  auctionId: string;
  buyerId: string;
  sellerId: string;
  amountKobo: number | string;
  reason: string;
  status: string;
  resolution: string | null;
  resolvedById: string | null;
  resolvedAt: string | null;
  createdAt: string;
};

export const listAdminDisputes = async (
  params: { status?: string; limit?: number; offset?: number } = {},
): Promise<{ items: AdminDisputeDto[]; total: number }> => {
  return apiClient<{ items: AdminDisputeDto[]; total: number }>(
    "/admin/disputes",
    {
      query: {
        status: params.status,
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
      },
    },
  );
};

export const investigateDispute = (id: string) =>
  apiClient<unknown>(`/admin/disputes/${id}/investigate`, { method: "POST" });

export const resolveDispute = (input: { id: string; resolution: string }) =>
  apiClient<unknown>(`/admin/disputes/${input.id}/resolve`, {
    method: "POST",
    body: { resolution: input.resolution },
  });

// Notification logs
export type AdminNotificationLogDto = {
  id: string;
  channel: string;
  status: string;
  recipient: string;
  template: string;
  createdAt: string;
};

export const listNotificationLogs = async (
  params: {
    channel?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {},
): Promise<{ items: AdminNotificationLogDto[]; total: number }> => {
  return apiClient<{ items: AdminNotificationLogDto[]; total: number }>(
    "/admin/notification-logs",
    {
      query: {
        channel: params.channel,
        status: params.status,
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
      },
    },
  );
};

export type AdminInAppNotificationDto = {
  id: string;
  audience: string;
  recipientId: string | null;
  recipient: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
};

export const listInAppNotifications = async (
  params: { limit?: number; offset?: number } = {},
): Promise<{ items: AdminInAppNotificationDto[]; total: number }> =>
  apiClient<{ items: AdminInAppNotificationDto[]; total: number }>(
    "/admin/in-app-notifications",
    {
      query: {
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
      },
    },
  );
