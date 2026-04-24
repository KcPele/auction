"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "../primitives/Icon";

interface TabDef {
  id: string;
  href: string;
  label: string;
  icon: IconName;
  match: (p: string) => boolean;
}

const TABS: TabDef[] = [
  { id: "home", href: "/dashboard", label: "Home", icon: "home", match: (p) => p === "/dashboard" },
  { id: "browse", href: "/dashboard/browse", label: "Browse", icon: "search", match: (p) => p.startsWith("/dashboard/browse") || p.startsWith("/dashboard/auction") },
  { id: "bids", href: "/dashboard/bids", label: "My bids", icon: "gavel", match: (p) => p.startsWith("/dashboard/bids") },
  { id: "wallet", href: "/dashboard/wallet", label: "Wallet", icon: "wallet", match: (p) => p.startsWith("/dashboard/wallet") },
  { id: "profile", href: "/dashboard/profile", label: "Profile", icon: "user", match: (p) => p.startsWith("/dashboard/profile") },
];

export function TabBar() {
  const path = usePathname() || "/dashboard";
  return (
    <div className="dash-tabs">
      {TABS.map((t) => {
        const active = t.match(path);
        return (
          <Link key={t.id} href={t.href} className={`dash-tab ${active ? "active" : ""}`}>
            <div className="dash-tab-icon">
              <Icon name={t.icon} size={22} strokeWidth={active ? 2 : 1.5} />
            </div>
            <span>{t.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
