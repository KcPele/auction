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
};

export const listAdminMechanics = async (
  params: { search?: string; status?: string } = {},
): Promise<AdminMechanicDto[]> => {
  const dto = await apiClient<{ items: AdminMechanicDto[] }>(
    "/admin/mechanics",
    { query: params },
  );
  return dto.items;
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
  params: { status?: string } = {},
): Promise<{ items: AdminDisputeDto[]; total: number }> => {
  return apiClient<{ items: AdminDisputeDto[]; total: number }>(
    "/admin/disputes",
    { query: params },
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
  params: { channel?: string; status?: string } = {},
): Promise<AdminNotificationLogDto[]> => {
  const dto = await apiClient<{ items: AdminNotificationLogDto[] }>(
    "/admin/notification-logs",
    { query: params },
  );
  return dto.items;
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

export const listInAppNotifications = async (): Promise<
  AdminInAppNotificationDto[]
> => {
  const dto = await apiClient<{ items: AdminInAppNotificationDto[] }>(
    "/admin/in-app-notifications",
  );
  return dto.items;
};
