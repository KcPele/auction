"use client";
// Compatibility shim. New code should use Better Auth's `useSession` from
// `@/app/lib/auth/client` and `useMe()` from `@/app/components/auth/hooks/use-me`.
import { useSession as useBetterAuthSession } from "@/app/lib/auth/client";
import { useMe } from "@/app/components/auth/hooks/use-me";
import { useSignOut } from "@/app/components/auth/hooks/use-me";

export function useSession() {
  const session = useBetterAuthSession();
  const me = useMe();
  const signOut = useSignOut();

  return {
    user: me.data ?? null,
    isLoading: session.isPending || (Boolean(session.data) && me.isLoading),
    isAuthenticated: Boolean(session.data),
    refresh: async () => {
      await me.refetch();
    },
    logout: async () => {
      await signOut.mutateAsync();
    },
  };
}
