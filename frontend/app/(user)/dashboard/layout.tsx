import type { ReactNode } from "react";
import { DashboardShell } from "@/app/components/user-dashboard/shell/DashboardShell";
import { RequireAuth, RequireRole } from "@/app/lib/auth/guards";

export default function UserDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <RequireRole
        role={["INDIVIDUAL_BIDDER", "CAR_DEALER", "MECHANIC"]}
        redirectTo="/admin"
      >
        <DashboardShell>{children}</DashboardShell>
      </RequireRole>
    </RequireAuth>
  );
}
