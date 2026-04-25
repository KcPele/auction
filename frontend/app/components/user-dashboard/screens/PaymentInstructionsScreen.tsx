"use client";
import { Icon } from "../primitives/Icon";
import { fmtNaira } from "../utils";

const PRIMARY_BTN_BG = {
  background: "linear-gradient(180deg, var(--accent-light), var(--accent))",
};

interface PaymentInstructionsData {
  auctionTitle: string;
  amountKobo: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  deadline: string;
}

export function PaymentInstructionsScreen({ data }: { data?: PaymentInstructionsData }) {
  // Integration: fetch from GET /api/v1/auctions/{id}/payment-instructions
  const info: PaymentInstructionsData = data ?? {
    auctionTitle: "2019 Toyota Camry XLE",
    amountKobo: 12_800_000,
    bankName: "Providus Bank",
    accountNumber: "3635734512",
    accountName: "KcPele Auctions",
    deadline: "24 hours after win",
  };

  return (
    <>
      <h1 className="m-0 font-display text-[26px] font-semibold tracking-tight">Payment</h1>
      <div className="mt-1 text-sm text-fg-muted">You won the auction!</div>

      <div className="mt-4 rounded-[14px] border border-line bg-surface p-4">
        <div className="text-[13px] font-semibold">{info.auctionTitle}</div>
        <div className="mt-3 rounded-lg border border-accent/20 bg-accent/[0.04] p-3">
          <div className="text-[10px] uppercase tracking-[0.1em] text-fg-dim">Amount to pay</div>
          <div className="mt-1 font-display text-[28px] font-bold text-accent-light">{fmtNaira(info.amountKobo)}</div>
        </div>
      </div>

      <div className="mt-4 rounded-[14px] border border-line bg-surface p-4">
        <div className="mb-3 text-[13px] font-semibold">Bank details</div>
        <div className="flex flex-col gap-2.5 text-[13px]">
          <div className="flex justify-between">
            <span className="text-fg-muted">Bank</span>
            <span className="font-medium">{info.bankName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-fg-muted">Account number</span>
            <span className="font-mono font-medium">{info.accountNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-fg-muted">Account name</span>
            <span className="font-medium">{info.accountName}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-red/20 bg-red/[0.06] p-3 text-xs text-fg-muted">
        <Icon name="clock" size={16} className="text-red" />
        <div>
          Payment deadline: <strong className="text-fg">{info.deadline}</strong>. Failure to pay will result in hold forfeit and account flag.
        </div>
      </div>

      <button
        type="button"
        className="mt-6 w-full cursor-pointer rounded-xl border-none p-4 text-sm font-bold text-[#1a0a00]"
        style={PRIMARY_BTN_BG}
      >
        I&apos;ve made the transfer
      </button>
    </>
  );
}
