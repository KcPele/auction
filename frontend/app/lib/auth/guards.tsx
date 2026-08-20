"use client";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMe } from "@/app/components/auth/hooks/use-me";
import { ApiError } from "@/app/lib/api/error";
import { useSession } from "./client";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !data) {
      const next = `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [data, isPending, router]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-fg-muted">Loading…</div>
      </div>
    );
  }
  if (!data) return null;
  return <>{children}</>;
}

/**
 * Gate by backend role (`/users/me`). `redirectTo` lets the admin layout
 * bounce non-admins to `/dashboard` instead of rendering nothing.
 */
export function RequireRole({
  role,
  redirectTo,
  children,
}: {
  role: string | string[];
  redirectTo?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: me, isLoading, isError, error, refetch } = useMe();
  const allowed = useMemo(() => (Array.isArray(role) ? role : [role]), [role]);
  const sessionExpired = error instanceof ApiError && error.status === 401;

  useEffect(() => {
    if (!isLoading && me && redirectTo && !allowed.includes(me.role)) {
      router.replace(redirectTo);
    }
  }, [isLoading, me, redirectTo, router, allowed]);

  useEffect(() => {
    if (sessionExpired) {
      router.replace("/login");
    }
  }, [router, sessionExpired]);

  if (sessionExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-fg-muted">Session expired. Redirecting…</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <div className="text-sm text-fg-muted">Could not load your account.</div>
        <button
          type="button"
          onClick={() => void refetch()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          Try again
        </button>
      </div>
    );
  }

  if (isLoading || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-fg-muted">Loading…</div>
      </div>
    );
  }
  if (!allowed.includes(me.role)) return null;
  return <>{children}</>;
}
