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

const ICON_BTN_CLASS =
  "relative flex h-[38px] w-[38px] items-center justify-center rounded-full border border-line text-fg-muted hover:border-line-strong hover:bg-surface hover:text-fg";

export function TopBar() {
  const router = useRouter();
  const path = usePathname() || "/dashboard";
  const canBack = BACK_PREFIXES.some((p) => path.startsWith(p));
  return (
    <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-line bg-[rgba(11,10,8,0.85)] px-8 py-4 backdrop-blur-md">
      {canBack && (
        <button className={ICON_BTN_CLASS} onClick={() => router.back()} type="button">
          <Icon name="chevron-l" size={18} />
        </button>
      )}
      <div className="font-display text-xl font-semibold tracking-[-0.02em]">
        {resolveTitle(path)}
      </div>
      <div className="flex max-w-[480px] flex-1 items-center gap-2.5 rounded-[10px] border border-line bg-surface px-3.5 py-[9px]">
        <Icon name="search" size={16} style={{ color: "var(--fg-muted)" }} />
        <input
          placeholder="Search auctions, sellers, categories…"
          className="flex-1 border-none bg-transparent text-[13px] text-fg outline-none"
        />
        <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-fg-dim">
          ⌘K
        </span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Link href="/dashboard/notifications" className={ICON_BTN_CLASS}>
          <Icon name="bell" size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-bg bg-red" />
        </Link>
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-2.5 rounded-[10px] border border-line py-1 pl-1 pr-1.5 hover:bg-surface"
        >
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-[#0a0806]"
            style={{
              background:
                "linear-gradient(135deg, var(--accent), var(--accent-deep))",
            }}
          >
            AO
          </span>
          <span className="text-[13px] font-medium">Adaeze</span>
          <Icon name="chevron" size={14} style={{ color: "var(--fg-dim)" }} />
        </Link>
      </div>
    </div>
  );
}
