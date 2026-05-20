"use client";
import { createAuthClient } from "better-auth/react";
import { authBaseURL } from "../api/env";

export const authClient = createAuthClient({
  baseURL: authBaseURL(),
  fetchOptions: {
    credentials: "include",
  },
});

export const { useSession, signIn, signUp, signOut } = authClient;

export type AuthSession = ReturnType<typeof useSession>;
