"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "../primitives/Icon";

const TITLE_MAP: Record<string, string> = {
  "/dashboard": "Home",
  "/dashboard/browse": "Browse auctions",
  "/dashboard/bids": "My bids",
  "/dashboard/wallet": "Wallet",
  "/dashboard/wallet/topup": "Top up wallet",
  "/dashboard/notifications": "Notifications",
  "/dashboard/profile": "Profile",
};

function resolveTitle(path: string): string {
  if (TITLE_MAP[path]) return TITLE_MAP[path];
  if (path.startsWith("/dashboard/auction/")) return "Auction";
  return "BidNaija";
}

const BACK_PREFIXES = ["/dashboard/auction/", "/dashboard/wallet/topup"];

export function TopBar() {
  const router = useRouter();
  const path = usePathname() || "/dashboard";
  const canBack = BACK_PREFIXES.some((p) => path.startsWith(p));
  return (
    <div className="dash-desktop-topbar">
      {canBack && (
        <button className="dash-icon-btn" onClick={() => router.back()} type="button">
          <Icon name="chevron-l" size={18} />
        </button>
      )}
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: "-0.02em",
        }}
      >
        {resolveTitle(path)}
      </div>
      <div className="dash-desktop-search">
        <Icon name="search" size={16} style={{ color: "var(--fg-muted)" }} />
        <input placeholder="Search auctions, sellers, categories…" />
        <span className="dash-desktop-kbd">⌘K</span>
      </div>
      <div className="dash-desktop-topbar-actions">
        <Link href="/dashboard/notifications" className="dash-icon-btn">
          <Icon name="bell" size={18} />
          <span className="dash-icon-badge" />
        </Link>
        <Link href="/dashboard/profile" className="dash-desktop-user">
          <span className="dash-desktop-user-avatar">AO</span>
          <span className="dash-desktop-user-name">Adaeze</span>
          <Icon name="chevron" size={14} style={{ color: "var(--fg-dim)" }} />
        </Link>
      </div>
    </div>
  );
}
