"use client";
import { useEffect } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import {
  adminAssign,
  adminListMessages,
  adminPostMessage,
  adminRelease,
  adminResolve,
  createConversation,
  getSupportSettings,
  listAllConversations,
  listMessages,
  listMyConversations,
  markConversationRead,
  postMessage,
  requestHandoff,
  updateSupportSettings,
} from "../api/support.api";
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

export const supportKeys = {
  all: ["support"] as const,
  myConversations: () => [...supportKeys.all, "mine"] as const,
  conversation: (id: string) => [...supportKeys.all, "conv", id] as const,
  messages: (id: string) => [...supportKeys.all, "conv", id, "messages"] as const,
  adminList: (state?: SupportState) =>
    [...supportKeys.all, "admin", state ?? "all"] as const,
  settings: () => [...supportKeys.all, "settings"] as const,
};

// --- User-side hooks ------------------------------------------------------

export function useMyConversations() {
  return useQuery({
    queryKey: supportKeys.myConversations(),
    queryFn: listMyConversations,
    staleTime: 10_000,
  });
}

export function useConversationMessages(id: string | null) {
  return useQuery({
    queryKey: id ? supportKeys.messages(id) : ["support", "noop"],
    queryFn: () => listMessages(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (subject?: string) => createConversation(subject),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: supportKeys.myConversations() }),
  });
}

export function usePostMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => postMessage(conversationId, content),
    onSuccess: (resp) => {
      qc.setQueryData<SupportMessage[]>(
        supportKeys.messages(conversationId),
        (prev) => {
          const merged = prev ? [...prev] : [];
          const has = (id: string) => merged.some((m) => m.id === id);
          if (!has(resp.userMessage.id)) merged.push(resp.userMessage);
          if (resp.aiMessage && !has(resp.aiMessage.id))
            merged.push(resp.aiMessage);
          return merged;
        },
      );
      qc.invalidateQueries({ queryKey: supportKeys.myConversations() });
    },
  });
}

export function useRequestHandoff(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) => requestHandoff(conversationId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supportKeys.myConversations() });
    },
  });
}

export function useMarkRead() {
  return useMutation({ mutationFn: markConversationRead });
}

// --- Admin-side hooks -----------------------------------------------------

export function useAdminConversations(state?: SupportState) {
  return useQuery({
    queryKey: supportKeys.adminList(state),
    queryFn: () => listAllConversations(state),
    staleTime: 10_000,
  });
}

export function useAdminMessages(id: string | null) {
  return useQuery({
    queryKey: id ? supportKeys.messages(id) : ["support", "noop"],
    queryFn: () => adminListMessages(id as string),
    enabled: Boolean(id),
  });
}

export function useAdminPostMessage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => adminPostMessage(id, content),
    onSuccess: (msg) => {
      qc.setQueryData<SupportMessage[]>(supportKeys.messages(id), (prev) => {
        const list = prev ?? [];
        if (list.some((m) => m.id === msg.id)) return list;
        return [...list, msg];
      });
      qc.invalidateQueries({ queryKey: supportKeys.adminList() });
    },
  });
}

export function useAdminAssign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminAssign,
    onSuccess: () => qc.invalidateQueries({ queryKey: supportKeys.all }),
  });
}

export function useAdminRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminRelease,
    onSuccess: () => qc.invalidateQueries({ queryKey: supportKeys.all }),
  });
}

export function useAdminResolve() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminResolve,
    onSuccess: () => qc.invalidateQueries({ queryKey: supportKeys.all }),
  });
}

export function useSupportSettings() {
  return useQuery({
    queryKey: supportKeys.settings(),
    queryFn: getSupportSettings,
  });
}

export function useUpdateSupportSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateSupportSettings,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: supportKeys.settings() }),
  });
}

// --- Realtime --------------------------------------------------------------

let supportSocket: Socket | null = null;
const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL && process.env.NEXT_PUBLIC_WS_URL.length > 0
    ? process.env.NEXT_PUBLIC_WS_URL
    : "http://localhost:4000";

function getSocket(): Socket {
  if (!supportSocket) {
    supportSocket = io(`${WS_URL}/support`, {
      withCredentials: true,
      transports: ["websocket"],
    });
  }
  return supportSocket;
}

/**
 * Subscribes to live message + state updates for a conversation. Updates the
 * React Query cache directly so the chat UI doesn't need its own state.
 */
export function useSupportStream(conversationId: string | null, isAdmin = false) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;
    const socket = getSocket();
    if (!socket.connected) socket.connect();
    socket.emit("support.join", { conversationId });

    const onMessage = (payload: {
      conversationId: string;
      message: SupportMessageDto;
    }) => {
      if (payload.conversationId !== conversationId) return;
      const msg = toSupportMessage(payload.message);
      qc.setQueryData<SupportMessage[]>(
        supportKeys.messages(conversationId),
        (prev) => {
          const list = prev ?? [];
          if (list.some((m) => m.id === msg.id)) return list;
          return [...list, msg];
        },
      );
      // List screens may need re-sort.
      qc.invalidateQueries({
        queryKey: isAdmin
          ? supportKeys.adminList()
          : supportKeys.myConversations(),
      });
    };

    const onState = (payload: {
      conversationId: string;
      state: SupportState;
      assignedAdminId: string | null;
      handoffReason: string | null;
    }) => {
      if (payload.conversationId !== conversationId) return;
      qc.invalidateQueries({
        queryKey: isAdmin
          ? supportKeys.adminList()
          : supportKeys.myConversations(),
      });
    };

    socket.on("support.message", onMessage);
    socket.on("support.state", onState);

    return () => {
      socket.emit("support.leave", { conversationId });
      socket.off("support.message", onMessage);
      socket.off("support.state", onState);
    };
  }, [conversationId, qc, isAdmin]);
}

/** Admin subscribes to the global list-updated stream. */
export function useAdminSupportListStream() {
  const qc = useQueryClient();
  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();
    const onListUpdated = () =>
      qc.invalidateQueries({ queryKey: supportKeys.adminList() });
    socket.on("support.list-updated", onListUpdated);
    return () => {
      socket.off("support.list-updated", onListUpdated);
    };
  }, [qc]);
}

// Re-export converters for components that fetch outside the hooks.
export { toSupportConversation, toSupportMessage };
export type { SupportConversation, SupportConversationDto, SupportSettings };
