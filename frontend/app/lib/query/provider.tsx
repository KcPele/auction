"use client";
import { QueryClientProvider, isServer } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect, useRef } from "react";
import { ApiError } from "../api/error";
import { makeQueryClient } from "./client";

let browserClient: ReturnType<typeof makeQueryClient> | undefined;

function getQueryClient() {
  if (isServer) return makeQueryClient();
  return (browserClient ??= makeQueryClient());
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const client = getQueryClient();
  const wired = useRef(false);

  useEffect(() => {
    if (wired.current) return;
    wired.current = true;
    // Global 401 handler — clear cache, send to /login.
    const unsub = client.getQueryCache().subscribe((event) => {
      if (
        event.type === "updated" &&
        event.action.type === "error" &&
        event.action.error instanceof ApiError &&
        event.action.error.status === 401 &&
        typeof window !== "undefined"
      ) {
        const path = window.location.pathname;
        if (path !== "/login" && !path.startsWith("/register")) {
          client.clear();
          window.location.assign("/login");
        }
      }
    });
    return () => unsub();
  }, [client]);

  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  );
}
