import { apiClient } from "@/app/lib/api/client";
import {
  toSupportConversation,
  toSupportMessage,
  type SupportConversation,
  type SupportConversationDto,
  type SupportMessage,
  type SupportMessageDto,
  type SupportSettings,
  type SupportState,
} from "../types/support.types";

// --- User endpoints --------------------------------------------------------

export const createConversation = async (
  subject?: string,
): Promise<SupportConversation> => {
  const dto = await apiClient<SupportConversationDto>("/support/conversations", {
    method: "POST",
    body: { subject },
  });
  return toSupportConversation(dto);
};

export const listMyConversations = async (): Promise<SupportConversation[]> => {
  const dto = await apiClient<SupportConversationDto[]>("/support/conversations");
  return dto.map(toSupportConversation);
};

export const getConversation = async (
  id: string,
): Promise<SupportConversation> => {
  const dto = await apiClient<SupportConversationDto>(
    `/support/conversations/${id}`,
  );
  return toSupportConversation(dto);
};

export const listMessages = async (id: string): Promise<SupportMessage[]> => {
  const dto = await apiClient<SupportMessageDto[]>(
    `/support/conversations/${id}/messages`,
  );
  return dto.map(toSupportMessage);
};

export const postMessage = async (
  id: string,
  content: string,
): Promise<{
  userMessage: SupportMessage;
  aiMessage?: SupportMessage;
  state: SupportState;
}> => {
  const dto = await apiClient<{
    userMessage: SupportMessageDto;
    aiMessage?: SupportMessageDto;
    state: SupportState;
  }>(`/support/conversations/${id}/messages`, {
    method: "POST",
    body: { content },
  });
  return {
    userMessage: toSupportMessage(dto.userMessage),
    aiMessage: dto.aiMessage ? toSupportMessage(dto.aiMessage) : undefined,
    state: dto.state,
  };
};

export const requestHandoff = async (
  id: string,
  reason?: string,
): Promise<SupportConversation> => {
  const dto = await apiClient<SupportConversationDto>(
    `/support/conversations/${id}/handoff`,
    { method: "POST", body: { reason } },
  );
  return toSupportConversation(dto);
};

export const markConversationRead = async (id: string) =>
  apiClient<{ ok: true }>(`/support/conversations/${id}/read`, {
    method: "POST",
  });

// --- Admin endpoints -------------------------------------------------------

export const listAllConversations = async (
  state?: SupportState,
): Promise<SupportConversation[]> => {
  const dto = await apiClient<SupportConversationDto[]>(
    "/admin/support/conversations",
    { query: state ? { state } : {} },
  );
  return dto.map(toSupportConversation);
};

export const adminListMessages = async (id: string): Promise<SupportMessage[]> => {
  const dto = await apiClient<SupportMessageDto[]>(
    `/admin/support/conversations/${id}/messages`,
  );
  return dto.map(toSupportMessage);
};

export const adminPostMessage = async (
  id: string,
  content: string,
): Promise<SupportMessage> => {
  const dto = await apiClient<SupportMessageDto>(
    `/admin/support/conversations/${id}/messages`,
    { method: "POST", body: { content } },
  );
  return toSupportMessage(dto);
};

export const adminAssign = (id: string) =>
  apiClient<SupportConversationDto>(
    `/admin/support/conversations/${id}/assign`,
    { method: "POST" },
  ).then(toSupportConversation);

export const adminRelease = (id: string) =>
  apiClient<SupportConversationDto>(
    `/admin/support/conversations/${id}/release`,
    { method: "POST" },
  ).then(toSupportConversation);

export const adminResolve = (id: string) =>
  apiClient<SupportConversationDto>(
    `/admin/support/conversations/${id}/resolve`,
    { method: "POST" },
  ).then(toSupportConversation);

export const getSupportSettings = () =>
  apiClient<SupportSettings>("/admin/support/settings");

export const updateSupportSettings = (input: Partial<SupportSettings>) =>
  apiClient<SupportSettings>("/admin/support/settings", {
    method: "PATCH",
    body: input,
  });
