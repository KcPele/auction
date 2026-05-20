"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useSession } from "@/app/lib/auth/client";
import {
  getMe,
  signInEmail,
  signOutCall,
  signUpEmail,
} from "../api/auth.api";
import { authKeys } from "./auth-keys";

export function useMe() {
  const { data: session, isPending } = useSession();
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: getMe,
    enabled: !isPending && Boolean(session?.user),
  });
}

export function useSignUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: signUpEmail,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}

export function useSignIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: signInEmail,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}

export function useSignOut() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: signOutCall,
    onSettled: () => {
      qc.clear();
      router.replace("/login");
    },
  });
}
