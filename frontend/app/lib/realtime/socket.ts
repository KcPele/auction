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

function getSocket(namespace: string): Socket {
  if (typeof window === "undefined") {
    throw new Error("getSocket must be called in the browser");
  }
  const existing = sockets.get(namespace);
  if (existing) return existing;

  const socket = io(`${WS_URL}/${namespace}`, {
    withCredentials: true,
    transports: ["websocket"],
    autoConnect: false,
  });
  sockets.set(namespace, socket);
  return socket;
}

export const auctionsSocket = (): Socket => getSocket("auctions");
export const notificationsSocket = (): Socket => getSocket("notifications");
