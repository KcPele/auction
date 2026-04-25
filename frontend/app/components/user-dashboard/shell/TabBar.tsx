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
    <div
      className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-5 border-t border-line bg-[rgba(11,10,8,0.96)] pt-2 backdrop-blur-lg lg:hidden"
      style={{
        height: "calc(var(--nav-h) + env(safe-area-inset-bottom))",
        paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
      }}
    >
      {TABS.map((t) => {
        const active = t.match(path);
        return (
          <Link
            key={t.id}
            href={t.href}
            className={`relative flex flex-col items-center justify-center gap-1 text-[10px] font-medium tracking-[0.02em] transition-colors ${
              active
                ? "text-accent before:absolute before:-top-2 before:h-[3px] before:w-7 before:rounded-b before:bg-accent before:content-['']"
                : "text-fg-dim"
            }`}
          >
            <div className="flex h-[22px] w-[22px] items-center justify-center">
              <Icon name={t.icon} size={22} strokeWidth={active ? 2 : 1.5} />
            </div>
            <span>{t.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
