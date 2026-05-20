"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/app/components/wallet/hooks/use-wallet";
import { Icon, type IconName } from "../primitives/Icon";
import { fmtNaira } from "../utils";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  badge?: number;
  match?: (path: string) => boolean;
}

const MAIN: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: "home", match: (p) => p === "/dashboard" },
  { href: "/dashboard/browse", label: "Browse auctions", icon: "search" },
  { href: "/dashboard/bids", label: "My bids", icon: "gavel" },
  { href: "/dashboard/won", label: "Won auctions", icon: "trophy" },
  { href: "/dashboard/wallet", label: "Wallet", icon: "wallet" },
  { href: "/dashboard/listings", label: "My listings", icon: "tag" },
  { href: "/dashboard/listing-access", label: "Listing access", icon: "key" },
];
const META: NavItem[] = [
  { href: "/dashboard/notifications", label: "Notifications", icon: "bell" },
  { href: "/dashboard/watchlist", label: "Watchlist", icon: "heart" },
  { href: "/dashboard/profile", label: "Profile & settings", icon: "user" },
];

function isActive(item: NavItem, path: string) {
  if (item.match) return item.match(path);
  return path === item.href || path.startsWith(item.href + "/");
}

function NavList({ items, path }: { items: NavItem[]; path: string }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((n) => {
        const active = isActive(n, path);
        return (
          <Link
            key={n.href}
            href={n.href}
            className={`relative flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-accent/10 text-accent before:absolute before:-left-3.5 before:top-2.5 before:bottom-2.5 before:w-[3px] before:rounded-r before:bg-accent before:content-['']"
                : "text-fg-muted hover:bg-surface hover:text-fg"
            }`}
          >
            <Icon name={n.icon} size={18} /> {n.label}
            {n.badge && (
              <span className="ml-auto rounded-full bg-red px-1.5 py-px font-mono text-[10px] font-semibold text-white">
                {n.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const path = usePathname() || "/dashboard";
  const { data: wallet } = useWallet();

  return (
    <aside className="sticky top-0 flex h-screen flex-col gap-1 border-r border-line bg-bg-1 px-3.5 py-[22px]">
      <div className="flex items-center px-3 pb-[22px] pt-2">
        <span className="font-display text-xl font-bold tracking-[-0.02em]">
          Bid<span className="italic accent-gradient-text">Naija</span>
        </span>
      </div>
      <div className="px-3 pb-1.5 pt-[18px] font-mono text-[10px] uppercase tracking-[0.15em] text-fg-dim">
        Auctions
      </div>
      <NavList items={MAIN} path={path} />
      <div className="px-3 pb-1.5 pt-[18px] font-mono text-[10px] uppercase tracking-[0.15em] text-fg-dim">
        Account
      </div>
      <NavList items={META} path={path} />
      <div className="mt-auto rounded-xl border border-line bg-surface p-3.5">
        <div className="text-[10px] uppercase tracking-[0.1em] text-fg-dim">
          Available to bid
        </div>
        <div className="mt-0.5 font-mono text-lg font-bold">
          {wallet ? fmtNaira(wallet.available) : "—"}
        </div>
        <Link
          href="/dashboard/wallet/topup"
          className="mt-2.5 block w-full rounded-lg p-2 text-center text-xs font-bold text-[#1a0a00] accent-gradient-bg"
        >
          + Top up wallet
        </Link>
      </div>
    </aside>
  );
}
