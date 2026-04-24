import Link from "next/link";
import { Icon } from "../primitives/Icon";
import { fmtNaira } from "../utils";
import { WALLET_BALANCE, WALLET_HOLD } from "../data";

interface WalletHeroProps {
  showActions?: boolean;
}

export function WalletHero({ showActions = true }: WalletHeroProps) {
  const available = WALLET_BALANCE;
  const held = WALLET_HOLD;
  const total = available + held;
  return (
    <div className="dash-wallet-hero">
      <div className="dash-wallet-label">Wallet balance</div>
      <div className="dash-wallet-total">
        <span className="dash-wallet-currency">₦</span>
        {total.toLocaleString("en-NG")}
      </div>
      <div className="dash-wallet-split">
        <div className="dash-wallet-split-box">
          <div className="dash-wallet-split-lbl">
            <span className="dash-dot dash-dot-avail" /> Available
          </div>
          <div className="dash-wallet-split-val">{fmtNaira(available)}</div>
        </div>
        <div className="dash-wallet-split-box">
          <div className="dash-wallet-split-lbl">
            <span className="dash-dot dash-dot-held" /> Held for bids
          </div>
          <div className="dash-wallet-split-val">{fmtNaira(held)}</div>
        </div>
      </div>
      {showActions && (
        <div className="dash-wallet-actions">
          <Link href="/dashboard/wallet/topup" className="dash-wallet-btn primary">
            <Icon name="plus" size={14} /> Top up
          </Link>
          <Link href="/dashboard/wallet" className="dash-wallet-btn ghost">
            <Icon name="chart" size={14} /> Activity
          </Link>
        </div>
      )}
    </div>
  );
}
