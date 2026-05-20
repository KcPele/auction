import type { ReactNode } from "react";
import { AdminShell } from "@/app/components/admin-dashboard/shell/AdminShell";
import { RequireAuth, RequireRole } from "@/app/lib/auth/guards";
import { AbilityProvider } from "@/app/lib/permissions/provider";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <RequireRole role="ADMIN" redirectTo="/dashboard">
        <AbilityProvider>
          <AdminShell>{children}</AdminShell>
        </AbilityProvider>
      </RequireRole>
    </RequireAuth>
  );
}
