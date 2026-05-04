"use client";
import Link from "next/link";
import { useState } from "react";
import { Icon, type IconName } from "../primitives/Icon";

interface NotifPref {
  id: "whatsappEnabled" | "readyToBid";
  label: string;
  sub: string;
  icon: IconName;
}
const NOTIF_PREFS: NotifPref[] = [
  { id: "whatsappEnabled", label: "WhatsApp alerts", sub: "+234 812 ••• 4471", icon: "wa" },
  { id: "readyToBid", label: "Bid alerts", sub: "Notify when auctions you watch go live", icon: "gavel" },
  // Integration: PATCH /api/v1/users/me/notification-preferences { whatsappEnabled, readyToBid, emailEnabled, pushEnabled }
];

const STATS = [
  { lbl: "Bids placed", val: "47" },
  { lbl: "Auctions won", val: "6" },
  { lbl: "Win rate", val: "38%" },
];
// Integration: GET /api/v1/users/me/stats → { bidsPlaced, auctionsWon, winRate, totalSpent }

interface SettingItem {
  label: string;
  sub: string;
  icon: IconName;
  href?: string;
  action?: () => void;
}
const AVATAR_BG = {
  background: "linear-gradient(135deg, var(--accent), var(--accent-deep))",
};

const HERO_BG = {
  background:
    "radial-gradient(ellipse at top right, rgba(232, 183, 85, 0.25), transparent 60%), linear-gradient(165deg, var(--surface-3, #281f13), var(--surface))",
};

const PRIMARY_BTN_BG = {
  background: "linear-gradient(180deg, var(--accent-light), var(--accent))",
};

export function ProfileScreen() {
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({
    whatsappEnabled: true,
    emailEnabled: true,
    pushEnabled: false,
    readyToBid: true,
  });
  const togglePref = (id: string) =>
    setNotifPrefs((s) => ({ ...s, [id]: !s[id] }));

  const [showEditDetails, setShowEditDetails] = useState(false);
  const [firstName, setFirstName] = useState("Adaeze");
  const [lastName, setLastName] = useState("Okafor");
  const [phone, setPhone] = useState("+234 812 345 6789");
  const [nin, setNin] = useState("");

  const SETTINGS: SettingItem[] = [
    { label: "Personal details", sub: "Name, phone, NIN", icon: "user", action: () => setShowEditDetails(true) },
    { label: "Saved payment methods", sub: "2 cards · 1 bank", icon: "wallet" },
    {
      label: "KYC & verification",
      sub: "Verify NIN",
      icon: "shield",
      href: "/kyc?ctx=account",
    },
    { label: "Watchlist", sub: "12 auctions", icon: "heart", href: "/dashboard/watchlist" },
    { label: "Help & support", sub: "FAQ · WhatsApp: +234 700 BIDNJA", icon: "help" },
    { label: "Terms & privacy", sub: "Last updated Mar 2026", icon: "lock" },
  ];

  return (
    <>
      <div className="flex flex-col items-center py-5 text-center">
        <div
          className="mb-3 flex h-20 w-20 items-center justify-center rounded-full text-[28px] font-bold text-[#0a0806]"
          style={AVATAR_BG}
        >
          {firstName[0]}{lastName[0]}
        </div>
        <div className="font-display text-[22px] font-semibold tracking-tight">{firstName} {lastName}</div>
        <div className="text-[13px] text-fg-muted">@{firstName.toLowerCase()}.{lastName.toLowerCase().charAt(0)} · Member since Mar 2025</div>
        <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full border border-accent/25 bg-accent/[0.08] px-2.5 py-1 text-[11px] font-semibold text-accent">
            <Icon name="key" size={10} strokeWidth={2.2} /> Ready-to-Bid
          </span>
        </div>
      </div>

      {/* Edit Personal Details Modal */}
      {showEditDetails && (
        <div className="mb-4 rounded-[14px] border border-line bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[15px] font-semibold tracking-tight">Edit personal details</div>
            <button
              type="button"
              onClick={() => setShowEditDetails(false)}
              className="rounded-lg p-1.5 text-fg-muted hover:bg-surface-2 hover:text-fg"
            >
              <Icon name="x" size={16} />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-fg-muted">First name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-[10px] border border-line-strong bg-surface-2 px-3.5 py-2.5 text-sm text-fg outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-fg-muted">Last name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-[10px] border border-line-strong bg-surface-2 px-3.5 py-2.5 text-sm text-fg outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-fg-muted">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-[10px] border border-line-strong bg-surface-2 px-3.5 py-2.5 text-sm text-fg outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-fg-muted">NIN</label>
              <input
                type="text"
                value={nin}
                onChange={(e) => setNin(e.target.value)}
                placeholder="11-digit NIN"
                className="w-full rounded-[10px] border border-line-strong bg-surface-2 px-3.5 py-2.5 text-sm text-fg outline-none focus:border-accent placeholder:text-fg-dim"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                // Integration: PATCH /api/v1/users/me { firstName, lastName, phone, nin }
                setShowEditDetails(false);
              }}
              className="mt-1 rounded-lg p-2.5 text-sm font-semibold text-[#1a0a00] accent-gradient-bg"
            >
              Save changes
            </button>
          </div>
        </div>
      )}

      <div
        className="relative mt-0 overflow-hidden rounded-[22px] border border-line-strong p-5"
        style={HERO_BG}
      >
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-fg-dim">
          <Icon name="key" size={11} /> Access code · Premium
        </div>
        <div className="my-2.5 mb-1 font-mono text-[30px] font-bold tracking-[0.15em] text-accent-light">
          BN-47K9-XQ2M
        </div>
        <div className="text-xs text-fg-muted">
          Active until <strong className="text-fg">30 Apr 2026</strong> · 3 of 8 auctions unlocked this month
        </div>
        <div className="relative z-10 mt-3.5 flex gap-2">
          <button
            type="button"
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border-none px-2.5 py-2.5 text-[13px] font-semibold text-[#1a0a00]"
            style={PRIMARY_BTN_BG}
          >
            <Icon name="copy" size={14} /> Copy code
          </button>
          <button
            type="button"
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-line-strong bg-white/[0.04] px-2.5 py-2.5 text-[13px] font-semibold text-fg"
          >
            <Icon name="refresh" size={14} /> Renew
          </button>
        </div>
      </div>

      <div className="my-3 mt-5 text-[15px] font-semibold tracking-tight">Your bidding</div>
      <div className="grid grid-cols-3 gap-2">
        {STATS.map((s) => (
          <div key={s.lbl} className="rounded-lg border border-line bg-surface p-3 text-center">
            <div className="font-display text-[22px] font-semibold tracking-tight text-accent-light">
              {s.val}
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-[0.08em] text-fg-dim">{s.lbl}</div>
          </div>
        ))}
      </div>

      <div className="my-3 mt-5 text-[15px] font-semibold tracking-tight">Notification preferences</div>
      <div className="overflow-hidden rounded-[14px] border border-line bg-surface">
        {NOTIF_PREFS.map((r) => (
          <div
            key={r.id}
            className="flex w-full items-center gap-3 border-b border-line px-4 py-3.5 text-left text-sm last:border-b-0"
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-fg-muted">
              <Icon name={r.icon} size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{r.label}</div>
              <div className="mt-0.5 text-xs text-fg-dim">{r.sub}</div>
            </div>
            <button
              type="button"
              onClick={() => togglePref(r.id)}
              aria-label={`Toggle ${r.label}`}
              className={`relative h-6 w-[42px] flex-shrink-0 cursor-pointer rounded-full border transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-[18px] after:w-[18px] after:rounded-full after:transition-all after:content-[''] ${
                notifPrefs[r.id]
                  ? "border-accent bg-accent after:left-[21px] after:bg-[#0a0806]"
                  : "border-line bg-surface-2 after:bg-fg-muted"
              }`}
            />
          </div>
        ))}
      </div>

      <div className="my-3 mt-5 text-[15px] font-semibold tracking-tight">Account</div>
      <div className="overflow-hidden rounded-[14px] border border-line bg-surface">
        {SETTINGS.map((r) => {
          const inner = (
            <>
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-fg-muted">
                <Icon name={r.icon} size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{r.label}</div>
                <div className="mt-0.5 text-xs text-fg-dim">{r.sub}</div>
              </div>
              <div className="text-fg-dim">
                <Icon name="chevron" size={16} />
              </div>
            </>
          );
          const cls =
            "flex w-full cursor-pointer items-center gap-3 border-b border-line px-4 py-3.5 text-left text-sm last:border-b-0";
          return r.href ? (
            <Link key={r.label} href={r.href} className={cls}>
              {inner}
            </Link>
          ) : (
            <button key={r.label} type="button" className={cls} onClick={r.action}>
              {inner}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="mt-4 w-full cursor-pointer rounded-xl border border-red/20 bg-transparent p-3.5 text-[13px] font-medium text-red"
      >
        Sign out
      </button>

      <div className="py-5 text-center text-[11px] text-fg-dim">
        BidNaija v1.4.2 · Lagos, Nigeria
      </div>
    </>
  );
}
