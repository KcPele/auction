"use client";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMe } from "@/app/components/auth/hooks/use-me";
import { useSession } from "./client";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !data) router.replace("/login");
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
  const { data: me, isLoading } = useMe();
  const allowed = useMemo(() => (Array.isArray(role) ? role : [role]), [role]);

  useEffect(() => {
    if (!isLoading && me && redirectTo && !allowed.includes(me.role)) {
      router.replace(redirectTo);
    }
  }, [isLoading, me, redirectTo, router, allowed]);

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
