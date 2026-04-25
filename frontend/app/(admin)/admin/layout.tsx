import type { ReactNode } from "react";
import { AdminShell } from "@/app/components/admin-dashboard/shell/AdminShell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
