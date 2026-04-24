import type { ReactNode } from "react";
import { DashboardShell } from "@/app/components/user-dashboard/shell/DashboardShell";

export default function UserDashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
