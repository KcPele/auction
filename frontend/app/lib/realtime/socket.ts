"use client";
import { io, type Socket } from "socket.io-client";

// One Socket.IO connection per namespace per session, lazily created and
// shared across hooks. Auth is cookie-based (Better Auth session) — the socket
// must be opened against the backend origin directly (NOT through the Next.js
// rewrite) because Next rewrites buffer responses and break long-lived ws.

const WS_URL =
  (typeof window !== "undefined" &&
    (process.env.NEXT_PUBLIC_WS_URL ?? "")) ||
  "http://localhost:4000";

const sockets = new Map<string, Socket>();

function getSocket(namespace: string, sessionToken?: string): Socket {
  if (typeof window === "undefined") {
    throw new Error("getSocket must be called in the browser");
  }
  const existing = sockets.get(namespace);
  if (existing) {
    const currentToken = (existing.auth as { sessionToken?: string })?.sessionToken;
    if (sessionToken && currentToken !== sessionToken) {
      existing.auth = { sessionToken };
      if (existing.connected) existing.disconnect();
    }
    return existing;
  }

  const socket = io(`${WS_URL}/${namespace}`, {
    withCredentials: true,
    transports: ["websocket"],
    autoConnect: false,
    auth: sessionToken ? { sessionToken } : {},
  });
  sockets.set(namespace, socket);
  return socket;
}

export const auctionsSocket = (sessionToken?: string): Socket =>
  getSocket("auctions", sessionToken);
export const notificationsSocket = (sessionToken?: string): Socket =>
  getSocket("notifications", sessionToken);
