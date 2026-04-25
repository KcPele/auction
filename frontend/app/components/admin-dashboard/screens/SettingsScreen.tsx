"use client";
import { useState } from "react";
import { Card, CardBody, CardHead } from "../widgets/Card";
import { SectionHeader } from "./SectionHeader";
import { NumberInput } from "../../ui/NumberInput";

// --- Platform fees per category (backend: /admin/settings/platform-fees) ---
interface CategoryFees {
  sellerFeeBps: number;
  buyerFeeBps: number;
}

interface FeesState {
  CAR: CategoryFees;
  GADGET: CategoryFees;
}

// --- Bidding (backend: /admin/settings/bidding) ---
interface BiddingState {
  bidRequirementPercent: number;
}

// --- Payment account (backend: /admin/settings/payment-account) ---
interface PaymentAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

// --- Holds & escrow (backend: /admin/settings/escrow) ---
interface EscrowState {
  holdMin: number;
  holdMax: number;
  paymentWindowHrs: number;
  autoExtendMin: number;
}

const DEFAULT_FEES: FeesState = {
  CAR: { sellerFeeBps: 300, buyerFeeBps: 0 },
  GADGET: { sellerFeeBps: 500, buyerFeeBps: 250 },
};

const DEFAULT_BIDDING: BiddingState = {
  bidRequirementPercent: 10,
};

const DEFAULT_PAYMENT: PaymentAccount = {
  bankName: "Providus Bank",
  accountNumber: "3635734512",
  accountName: "KcPele Auctions",
};

const DEFAULT_ESCROW: EscrowState = {
  holdMin: 10,
  holdMax: 20,
  paymentWindowHrs: 24,
  autoExtendMin: 2,
};

function NumInputField({
  label,
  sub,
  value,
  onChange,
  suffix,
  step = 1,
}: {
  label: string;
  sub?: string;
  value: number;
  onChange: (n: number) => void;
  suffix?: string;
  step?: number;
}) {
  return (
    <label className="block">
      <div className="text-[13px] font-medium">{label}</div>
      {sub && <div className="mt-0.5 text-[11px] text-fg-dim">{sub}</div>}
      <div className="mt-2">
        <NumberInput
          value={value}
          onChange={onChange}
          step={step}
          suffix={suffix}
          ariaLabel={label}
        />
      </div>
    </label>
  );
}

function Toggle({
  label,
  sub,
  on,
  onChange,
}: {
  label: string;
  sub?: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <div className="text-[13px] font-medium">{label}</div>
        {sub && <div className="mt-0.5 text-[11px] text-fg-dim">{sub}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!on)}
        aria-label={`Toggle ${label}`}
        className={`relative h-6 w-[42px] flex-shrink-0 cursor-pointer rounded-full border transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-[18px] after:w-[18px] after:rounded-full after:transition-all after:content-[''] ${
          on
            ? "border-accent bg-accent after:left-[21px] after:bg-[#0a0806]"
            : "border-line bg-surface-2 after:bg-fg-muted"
        }`}
      />
    </div>
  );
}

function bpsToPercent(bps: number): number {
  return bps / 100;
}

function percentToBps(pct: number): number {
  return Math.round(pct * 100);
}

export function SettingsScreen() {
  const [fees, setFees] = useState<FeesState>(DEFAULT_FEES);
  const [bidding, setBidding] = useState<BiddingState>(DEFAULT_BIDDING);
  const [payment, setPayment] = useState<PaymentAccount>(DEFAULT_PAYMENT);
  const [escrow, setEscrow] = useState<EscrowState>(DEFAULT_ESCROW);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [waEnabled, setWaEnabled] = useState(true);
  const [pauseNewListings, setPauseNewListings] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const updateFee = (cat: "CAR" | "GADGET", field: keyof CategoryFees, bps: number) =>
    setFees((p) => ({ ...p, [cat]: { ...p[cat], [field]: bps } }));

  const save = () => {
    // API calls for integration:
    // PATCH /admin/settings/platform-fees (per category)
    // PATCH /admin/settings/bidding
    // PATCH /admin/settings/payment-account
    // PATCH /admin/settings/escrow
    // PATCH /admin/settings/toggles
    setSavedAt(new Date().toLocaleTimeString());
  };

  return (
    <>
      <SectionHeader
        title="Platform settings"
        sub="Fee structure per category, bidding qualification, payment account, and platform toggles."
        action={
          <div className="flex items-center gap-3">
            {savedAt && <span className="text-[11px] text-green">Saved · {savedAt}</span>}
            <button
              type="button"
              onClick={save}
              className="rounded-md border border-transparent px-3 py-1.5 text-xs font-semibold text-[#1a0a00]"
              style={{ background: "linear-gradient(180deg, var(--accent-2), var(--accent))" }}
            >
              Save changes
            </button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Car fees */}
        <Card>
          <CardHead title="Car fees" />
          <CardBody>
            <div className="grid grid-cols-2 gap-4">
              <NumInputField
                label="Seller fee"
                sub={`${bpsToPercent(fees.CAR.sellerFeeBps)}%`}
                value={bpsToPercent(fees.CAR.sellerFeeBps)}
                onChange={(v) => updateFee("CAR", "sellerFeeBps", percentToBps(v))}
                suffix="%"
                step={0.1}
              />
              <NumInputField
                label="Buyer fee"
                sub={`${bpsToPercent(fees.CAR.buyerFeeBps)}%`}
                value={bpsToPercent(fees.CAR.buyerFeeBps)}
                onChange={(v) => updateFee("CAR", "buyerFeeBps", percentToBps(v))}
                suffix="%"
                step={0.1}
              />
            </div>
          </CardBody>
        </Card>

        {/* Gadget fees */}
        <Card>
          <CardHead title="Gadget fees" />
          <CardBody>
            <div className="grid grid-cols-2 gap-4">
              <NumInputField
                label="Seller fee"
                sub={`${bpsToPercent(fees.GADGET.sellerFeeBps)}%`}
                value={bpsToPercent(fees.GADGET.sellerFeeBps)}
                onChange={(v) => updateFee("GADGET", "sellerFeeBps", percentToBps(v))}
                suffix="%"
                step={0.1}
              />
              <NumInputField
                label="Buyer fee"
                sub={`${bpsToPercent(fees.GADGET.buyerFeeBps)}%`}
                value={bpsToPercent(fees.GADGET.buyerFeeBps)}
                onChange={(v) => updateFee("GADGET", "buyerFeeBps", percentToBps(v))}
                suffix="%"
                step={0.1}
              />
            </div>
          </CardBody>
        </Card>

        {/* Bidding qualification */}
        <Card>
          <CardHead title="Bidding" />
          <CardBody>
            <NumInputField
              label="Bid requirement"
              sub="Minimum wallet % of base price to place a bid"
              value={bidding.bidRequirementPercent}
              onChange={(v) => setBidding({ bidRequirementPercent: v })}
              suffix="%"
            />
          </CardBody>
        </Card>

        {/* Payment account */}
        <Card>
          <CardHead title="Payment account" />
          <CardBody>
            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-fg-muted">Bank name</label>
                <input
                  type="text"
                  value={payment.bankName}
                  onChange={(e) => setPayment((p) => ({ ...p, bankName: e.target.value }))}
                  className="w-full rounded-[10px] border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-fg outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-fg-muted">Account number</label>
                <input
                  type="text"
                  value={payment.accountNumber}
                  onChange={(e) => setPayment((p) => ({ ...p, accountNumber: e.target.value }))}
                  className="w-full rounded-[10px] border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-fg outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-fg-muted">Account name</label>
                <input
                  type="text"
                  value={payment.accountName}
                  onChange={(e) => setPayment((p) => ({ ...p, accountName: e.target.value }))}
                  className="w-full rounded-[10px] border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-fg outline-none focus:border-accent"
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Holds & escrow */}
        <Card className="lg:col-span-2">
          <CardHead title="Holds & escrow" />
          <CardBody>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <NumInputField
                label="Min hold"
                sub="On low-value bids"
                value={escrow.holdMin}
                onChange={(v) => setEscrow((p) => ({ ...p, holdMin: v }))}
                suffix="%"
              />
              <NumInputField
                label="Max hold"
                sub="On high-value bids"
                value={escrow.holdMax}
                onChange={(v) => setEscrow((p) => ({ ...p, holdMax: v }))}
                suffix="%"
              />
              <NumInputField
                label="Payment window"
                sub="After auction win"
                value={escrow.paymentWindowHrs}
                onChange={(v) => setEscrow((p) => ({ ...p, paymentWindowHrs: v }))}
                suffix="hours"
              />
              <NumInputField
                label="Auto-extend"
                sub="On last-minute bid"
                value={escrow.autoExtendMin}
                onChange={(v) => setEscrow((p) => ({ ...p, autoExtendMin: v }))}
                suffix="min"
              />
            </div>
          </CardBody>
        </Card>

        {/* Platform toggles */}
        <Card className="lg:col-span-2">
          <CardHead title="Platform toggles" />
          <CardBody>
            <Toggle
              label="Email notifications"
              sub="Resend integration"
              on={emailEnabled}
              onChange={setEmailEnabled}
            />
            <div className="border-t border-line" />
            <Toggle
              label="WhatsApp notifications"
              sub="WhatsApp Business API"
              on={waEnabled}
              onChange={setWaEnabled}
            />
            <div className="border-t border-line" />
            <Toggle
              label="Pause new listings"
              sub="Block new submissions while issues are investigated"
              on={pauseNewListings}
              onChange={setPauseNewListings}
            />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
