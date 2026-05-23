"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMe } from "@/app/components/auth/hooks/use-me";
import { useUnreadCount } from "@/app/components/notifications/hooks/use-notifications";
import { SearchBox } from "@/app/components/search/SearchBox";
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
  const { data: me } = useMe();
  const { data: unread = 0 } = useUnreadCount();
  const initials = me
    ? `${me.firstName[0] ?? ""}${me.lastName[0] ?? ""}`.toUpperCase()
    : "";
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
      <SearchBox />
      <div className="ml-auto flex items-center gap-2">
        <Link href="/dashboard/notifications" className={ICON_BTN_CLASS}>
          <Icon name="bell" size={18} />
          {unread > 0 && (
            <span className="absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-bg bg-red px-1 font-mono text-[9px] font-bold text-fg">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
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
            {initials || "·"}
          </span>
          <span className="text-[13px] font-medium">{me?.firstName ?? "—"}</span>
          <Icon name="chevron" size={14} style={{ color: "var(--fg-dim)" }} />
        </Link>
      </div>
    </div>
  );
}
