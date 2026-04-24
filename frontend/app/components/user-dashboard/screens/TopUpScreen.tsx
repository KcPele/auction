"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "../primitives/Icon";
import { fmtNaira } from "../utils";

type MethodId = "paystack" | "transfer" | "flutter";
interface Method {
  id: MethodId;
  title: string;
  sub: string;
  icon: IconName;
}

const METHODS: Method[] = [
  { id: "paystack", title: "Paystack · Card / USSD", sub: "Instant · 1.5% fee capped at ₦2,000", icon: "zap" },
  { id: "transfer", title: "Bank transfer", sub: "Wema Bank · 1234567890 · BidNaija Escrow", icon: "arrow-r" },
  { id: "flutter", title: "Flutterwave", sub: "Card / Bank / Barter", icon: "refresh" },
];
const QUICK = [100_000, 250_000, 500_000, 1_000_000];

function feeFor(method: MethodId, amt: number) {
  if (method === "transfer") return "Free";
  return fmtNaira(Math.min(amt * 0.015, 2_000));
}
function methodLabel(m: MethodId) {
  return m === "paystack" ? "Paystack" : m === "flutter" ? "Flutterwave" : "bank details";
}

export function TopUpScreen() {
  const router = useRouter();
  const [amt, setAmt] = useState(500_000);
  const [method, setMethod] = useState<MethodId>("paystack");

  return (
    <>
      <div
        style={{
          fontSize: 12,
          color: "var(--fg-dim)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginTop: 8,
        }}
      >
        Amount
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 46,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          marginTop: 4,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <span style={{ color: "var(--fg-dim)", fontSize: 26 }}>₦</span>
        {amt.toLocaleString("en-NG")}
      </div>

      <div className="dash-quick-amounts">
        {QUICK.map((q) => (
          <button
            key={q}
            type="button"
            className={`dash-quick-amt ${amt === q ? "active" : ""}`}
            onClick={() => setAmt(q)}
          >
            {q >= 1_000_000 ? `${q / 1_000_000}M` : `${q / 1_000}k`}
          </button>
        ))}
      </div>

      <div className="dash-section-header">
        <div className="dash-section-h">Payment method</div>
      </div>
      <div className="dash-list">
        {METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            className="dash-list-item"
            onClick={() => setMethod(m.id)}
          >
            <div
              className="dash-list-item-icon"
              style={{
                background: method === m.id ? "rgba(232,183,85,0.12)" : undefined,
                color: method === m.id ? "var(--accent)" : undefined,
              }}
            >
              <Icon name={m.icon} size={16} />
            </div>
            <div className="dash-list-item-main">
              <div className="dash-list-item-title">{m.title}</div>
              <div className="dash-list-item-sub">{m.sub}</div>
            </div>
            <div className={method === m.id ? "" : "dash-list-item-chev"}>
              {method === m.id ? (
                <Icon name="check-c" size={18} style={{ color: "var(--accent)" }} />
              ) : (
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: "1.5px solid var(--line-strong)",
                  }}
                />
              )}
            </div>
          </button>
        ))}
      </div>

      <div
        style={{
          marginTop: 16,
          padding: 14,
          background: "var(--surface)",
          borderRadius: 12,
          border: "1px solid var(--line)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
          <span className="dash-muted">Amount</span>
          <span>{fmtNaira(amt)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
          <span className="dash-muted">Processing fee</span>
          <span>{feeFor(method, amt)}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 14,
            fontWeight: 600,
            paddingTop: 8,
            borderTop: "1px solid var(--line)",
          }}
        >
          <span>Wallet credit</span>
          <span style={{ color: "var(--accent-light)", fontFamily: "var(--font-mono)" }}>
            {fmtNaira(amt)}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="dash-bid-bar-btn"
        style={{ width: "100%", marginTop: 16, padding: 16 }}
        onClick={() => {
          alert(
            `Top up ${fmtNaira(amt)} via ${method} — in a live build, this redirects to the gateway.`,
          );
          router.back();
        }}
      >
        Continue to {methodLabel(method)}
      </button>
    </>
  );
}
