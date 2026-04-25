"use client";
import { useState } from "react";
import { Icon, type IconName } from "../primitives/Icon";

interface AlertChannel {
  id: "wa" | "email" | "push";
  label: string;
  sub: string;
  icon: IconName;
}
const ALERT_CHANNELS: AlertChannel[] = [
  { id: "wa", label: "WhatsApp", sub: "+234 812 ••• 4471", icon: "wa" },
  { id: "email", label: "Email", sub: "adaeze@gmail.com", icon: "mail" },
  { id: "push", label: "Push notifications", sub: "This device", icon: "bell" },
];

const STATS = [
  { lbl: "Bids placed", val: "47" },
  { lbl: "Auctions won", val: "6" },
  { lbl: "Win rate", val: "38%" },
];

interface SettingItem {
  label: string;
  sub: string;
  icon: IconName;
}
const SETTINGS: SettingItem[] = [
  { label: "Personal details", sub: "Name, phone, address", icon: "user" },
  { label: "Saved payment methods", sub: "2 cards · 1 bank", icon: "wallet" },
  { label: "KYC & verification", sub: "BVN confirmed", icon: "shield" },
  { label: "Watchlist", sub: "12 auctions", icon: "heart" },
  { label: "Help & support", sub: "FAQ · WhatsApp: +234 700 BIDNJA", icon: "help" },
  { label: "Terms & privacy", sub: "Last updated Mar 2026", icon: "lock" },
];

export function ProfileScreen() {
  const [alerts, setAlerts] = useState<Record<AlertChannel["id"], boolean>>({
    wa: true,
    email: true,
    push: false,
  });
  const toggle = (id: AlertChannel["id"]) =>
    setAlerts((s) => ({ ...s, [id]: !s[id] }));

  return (
    <>
      <div className="dash-profile-header">
        <div className="dash-profile-avatar-big">AO</div>
        <div className="dash-profile-name">Adaeze Okafor</div>
        <div className="dash-profile-handle">@adaeze.o · Member since Mar 2025</div>
        <div className="dash-profile-badges">
          <span className="dash-profile-badge verified">
            <Icon name="shield" size={10} strokeWidth={2.2} /> BVN verified
          </span>
          <span className="dash-profile-badge code">
            <Icon name="key" size={10} strokeWidth={2.2} /> Ready-to-Bid
          </span>
        </div>
      </div>

      <div className="dash-wallet-hero" style={{ marginTop: 0 }}>
        <div className="dash-wallet-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="key" size={11} /> Access code · Premium
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: "0.15em",
            margin: "10px 0 4px",
            color: "var(--accent-light)",
          }}
        >
          BN-47K9-XQ2M
        </div>
        <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>
          Active until <strong style={{ color: "var(--fg)" }}>30 Apr 2026</strong> · 3 of 8
          auctions unlocked this month
        </div>
        <div className="dash-wallet-actions">
          <button type="button" className="dash-wallet-btn primary">
            <Icon name="copy" size={14} /> Copy code
          </button>
          <button type="button" className="dash-wallet-btn ghost">
            <Icon name="refresh" size={14} /> Renew
          </button>
        </div>
      </div>

      <div className="dash-section-header">
        <div className="dash-section-h">Your bidding</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {STATS.map((s) => (
          <div key={s.lbl} className="dash-fact" style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                fontWeight: 600,
                color: "var(--accent-light)",
                letterSpacing: "-0.02em",
              }}
            >
              {s.val}
            </div>
            <div className="dash-fact-lbl" style={{ marginTop: 2 }}>
              {s.lbl}
            </div>
          </div>
        ))}
      </div>

      <div className="dash-section-header">
        <div className="dash-section-h">Alerts</div>
      </div>
      <div className="dash-list">
        {ALERT_CHANNELS.map((r) => (
          <div key={r.id} className="dash-list-item" style={{ cursor: "default" }}>
            <div className="dash-list-item-icon">
              <Icon name={r.icon} size={16} />
            </div>
            <div className="dash-list-item-main">
              <div className="dash-list-item-title">{r.label}</div>
              <div className="dash-list-item-sub">{r.sub}</div>
            </div>
            <button
              type="button"
              className={`dash-switch ${alerts[r.id] ? "on" : ""}`}
              onClick={() => toggle(r.id)}
              aria-label={`Toggle ${r.label}`}
            />
          </div>
        ))}
      </div>

      <div className="dash-section-header">
        <div className="dash-section-h">Account</div>
      </div>
      <div className="dash-list">
        {SETTINGS.map((r) => (
          <button key={r.label} type="button" className="dash-list-item">
            <div className="dash-list-item-icon">
              <Icon name={r.icon} size={16} />
            </div>
            <div className="dash-list-item-main">
              <div className="dash-list-item-title">{r.label}</div>
              <div className="dash-list-item-sub">{r.sub}</div>
            </div>
            <div className="dash-list-item-chev">
              <Icon name="chevron" size={16} />
            </div>
          </button>
        ))}
      </div>

      <button
        type="button"
        style={{
          width: "100%",
          padding: 14,
          marginTop: 16,
          background: "transparent",
          color: "var(--red)",
          border: "1px solid rgba(239,74,58,0.2)",
          borderRadius: 12,
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        Sign out
      </button>

      <div style={{ textAlign: "center", padding: "20px 0", fontSize: 11, color: "var(--fg-dim)" }}>
        BidNaija v1.4.2 · Lagos, Nigeria
      </div>
    </>
  );
}
