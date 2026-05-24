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
    // Optimistically paint the user's bubble the instant they hit Send so the
    // chat feels live. We tag it with an `optimistic:` id and remove it again
    // in onSuccess (replaced by the real message returned by the API).
    onMutate: async (content: string) => {
      await qc.cancelQueries({ queryKey: supportKeys.messages(conversationId) });
      const previous =
        qc.getQueryData<SupportMessage[]>(supportKeys.messages(conversationId)) ?? [];
      const optimistic: SupportMessage = {
        id: `optimistic:${Date.now()}`,
        conversationId,
        role: "USER",
        authorId: null,
        content,
        toolCalls: null,
        model: null,
        createdAt: new Date(),
      };
      qc.setQueryData<SupportMessage[]>(
        supportKeys.messages(conversationId),
        [...previous, optimistic],
      );
      return { previous, optimisticId: optimistic.id };
    },
    onError: (_err, _content, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(supportKeys.messages(conversationId), ctx.previous);
      }
    },
    onSuccess: (resp, _content, ctx) => {
      qc.setQueryData<SupportMessage[]>(
        supportKeys.messages(conversationId),
        (prev) => {
          // Drop the optimistic placeholder.
          const stripped = (prev ?? []).filter((m) => m.id !== ctx?.optimisticId);
          const has = (id: string) => stripped.some((m) => m.id === id);
          if (!has(resp.userMessage.id)) stripped.push(resp.userMessage);
          if (resp.aiMessage && !has(resp.aiMessage.id))
            stripped.push(resp.aiMessage);
          return stripped;
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
    onMutate: async (content: string) => {
      await qc.cancelQueries({ queryKey: supportKeys.messages(id) });
      const previous =
        qc.getQueryData<SupportMessage[]>(supportKeys.messages(id)) ?? [];
      const optimistic: SupportMessage = {
        id: `optimistic:${Date.now()}`,
        conversationId: id,
        role: "ADMIN",
        authorId: null,
        content,
        toolCalls: null,
        model: null,
        createdAt: new Date(),
      };
      qc.setQueryData<SupportMessage[]>(supportKeys.messages(id), [
        ...previous,
        optimistic,
      ]);
      return { previous, optimisticId: optimistic.id };
    },
    onError: (_err, _content, ctx) => {
      if (ctx?.previous)
        qc.setQueryData(supportKeys.messages(id), ctx.previous);
    },
    onSuccess: (msg, _content, ctx) => {
      qc.setQueryData<SupportMessage[]>(supportKeys.messages(id), (prev) => {
        const stripped = (prev ?? []).filter((m) => m.id !== ctx?.optimisticId);
        if (stripped.some((m) => m.id === msg.id)) return stripped;
        return [...stripped, msg];
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
      // Allow polling fallback — needed when WS upgrade is blocked (some
      // proxies / corp networks) or the cookie can't ride the upgrade.
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
    });
    if (typeof window !== "undefined") {
      supportSocket.on("connect_error", (err) => {
        // Surfaces auth/CORS issues that previously failed silently.
        console.error("[support socket] connect_error", err.message);
      });
      supportSocket.on("support.error", (payload) => {
        console.error("[support socket] server error", payload);
      });
    }
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

    // Wait for server auth (`support.ready`) before joining the room.
    // Otherwise `support.join` can race past async `handleConnection` and
    // `client.data.user` is still undefined when onJoin runs → silent no-op.
    const joinRoom = () => socket.emit("support.join", { conversationId });
    if (socket.connected) joinRoom();
    socket.on("support.ready", joinRoom);
    // Also re-join on every reconnect — room membership is lost on disconnect.
    socket.on("connect", joinRoom);

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
          // Already in the list (mutation already merged it) — skip.
          if (list.some((m) => m.id === msg.id)) return list;
          // Replace a matching optimistic placeholder (same role + content)
          // so the user doesn't briefly see their own bubble twice while
          // the POST round-trip is still in flight.
          const optimisticIdx = list.findIndex(
            (m) =>
              m.id.startsWith("optimistic:") &&
              m.role === msg.role &&
              m.content === msg.content,
          );
          if (optimisticIdx !== -1) {
            const copy = [...list];
            copy[optimisticIdx] = msg;
            return copy;
          }
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
      socket.off("support.ready", joinRoom);
      socket.off("connect", joinRoom);
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
