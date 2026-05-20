"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useBiddingSetting,
  useEscrowSetting,
  usePaymentAccount,
  usePlatformFees,
  usePlatformToggles,
  useUpdateBiddingSetting,
  useUpdateEscrowSetting,
  useUpdatePaymentAccount,
  useUpdatePlatformFee,
  useUpdatePlatformToggles,
} from "@/app/components/admin/hooks/use-admin-settings";
import { ApiError } from "@/app/lib/api/error";
import { Card, CardBody, CardHead } from "../widgets/Card";
import { NumberInput } from "../../ui/NumberInput";
import { SectionHeader } from "./SectionHeader";

const PRIMARY_BTN = {
  background: "linear-gradient(180deg, var(--accent-2), var(--accent))",
};

const wrap = (err: unknown, fallback: string) => {
  if (err instanceof ApiError) toast.error(err.message);
  else toast.error(fallback);
};

const syncAfterPaint = (fn: () => void) => {
  const frame = window.requestAnimationFrame(fn);
  return () => window.cancelAnimationFrame(frame);
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

export function SettingsScreen() {
  return (
    <>
      <SectionHeader
        title="Platform settings"
        sub="Fee structure per category, bidding qualification, payment account, escrow, and platform toggles."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <FeesCard category="cars" label="Car fees" />
        <FeesCard category="gadgets" label="Gadget fees" />
        <BiddingCard />
        <PaymentAccountCard />
        <EscrowCard />
        <TogglesCard />
      </div>
    </>
  );
}

// ---------- Fees ----------

function FeesCard({
  category,
  label,
}: {
  category: "cars" | "gadgets";
  label: string;
}) {
  const fees = usePlatformFees();
  const update = useUpdatePlatformFee();

  const [sellerPct, setSellerPct] = useState(0);
  const [buyerPct, setBuyerPct] = useState(0);

  const wireCat = category === "cars" ? "CAR" : "GADGET";
  const fee = fees.data?.find((f) => f.category === wireCat);

  useEffect(() => {
    if (!fee) return;
    return syncAfterPaint(() => {
      setSellerPct(fee.sellerFeeBps / 100);
      setBuyerPct(fee.buyerFeeBps / 100);
    });
  }, [fee]);

  const save = async () => {
    try {
      await update.mutateAsync({
        category,
        sellerFeePct: sellerPct,
        buyerFeePct: buyerPct,
      });
      toast.success(`${label} updated`);
    } catch (err) {
      wrap(err, `Could not update ${label.toLowerCase()}`);
    }
  };

  return (
    <Card>
      <CardHead
        title={label}
        action={
          <button
            type="button"
            disabled={update.isPending}
            onClick={save}
            className="rounded-md px-3 py-1 text-xs font-semibold text-[#1a0a00] disabled:opacity-60"
            style={PRIMARY_BTN}
          >
            {update.isPending ? "Saving…" : "Save"}
          </button>
        }
      />
      <CardBody>
        <div className="grid grid-cols-2 gap-4">
          <NumInputField
            label="Seller fee"
            value={sellerPct}
            onChange={setSellerPct}
            suffix="%"
            step={0.1}
          />
          <NumInputField
            label="Buyer fee"
            value={buyerPct}
            onChange={setBuyerPct}
            suffix="%"
            step={0.1}
          />
        </div>
      </CardBody>
    </Card>
  );
}

// ---------- Bidding ----------

function BiddingCard() {
  const bidding = useBiddingSetting();
  const update = useUpdateBiddingSetting();
  const [pct, setPct] = useState(10);

  useEffect(() => {
    if (!bidding.data) return;
    return syncAfterPaint(() => setPct(bidding.data.bidRequirementPercent));
  }, [bidding.data]);

  const save = async () => {
    try {
      await update.mutateAsync({ bidRequirementPercent: pct });
      toast.success("Bidding updated");
    } catch (err) {
      wrap(err, "Could not update bidding");
    }
  };

  return (
    <Card>
      <CardHead
        title="Bidding"
        action={
          <button
            type="button"
            disabled={update.isPending}
            onClick={save}
            className="rounded-md px-3 py-1 text-xs font-semibold text-[#1a0a00] disabled:opacity-60"
            style={PRIMARY_BTN}
          >
            {update.isPending ? "Saving…" : "Save"}
          </button>
        }
      />
      <CardBody>
        <NumInputField
          label="Bid requirement"
          sub="Minimum wallet % of base price to place a bid"
          value={pct}
          onChange={setPct}
          suffix="%"
        />
      </CardBody>
    </Card>
  );
}

// ---------- Payment account ----------

function PaymentAccountCard() {
  const account = usePaymentAccount();
  const update = useUpdatePaymentAccount();

  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  useEffect(() => {
    const data = account.data;
    if (!data) return;
    return syncAfterPaint(() => {
      setBankName(data.bankName);
      setAccountNumber(data.accountNumber);
      setAccountName(data.accountName);
    });
  }, [account.data]);

  const save = async () => {
    try {
      await update.mutateAsync({ bankName, accountNumber, accountName });
      toast.success("Payment account updated");
    } catch (err) {
      wrap(err, "Could not update payment account");
    }
  };

  return (
    <Card>
      <CardHead
        title="Payment account"
        action={
          <button
            type="button"
            disabled={update.isPending}
            onClick={save}
            className="rounded-md px-3 py-1 text-xs font-semibold text-[#1a0a00] disabled:opacity-60"
            style={PRIMARY_BTN}
          >
            {update.isPending ? "Saving…" : "Save"}
          </button>
        }
      />
      <CardBody>
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-fg-muted">
              Bank name
            </label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full rounded-[10px] border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-fg outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-fg-muted">
              Account number
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) =>
                setAccountNumber(e.target.value.replace(/\D/g, ""))
              }
              className="w-full rounded-[10px] border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-fg outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-fg-muted">
              Account name
            </label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full rounded-[10px] border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-fg outline-none focus:border-accent"
            />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// ---------- Escrow ----------

function EscrowCard() {
  const escrow = useEscrowSetting();
  const update = useUpdateEscrowSetting();

  const [holdMin, setHoldMin] = useState(10);
  const [holdMax, setHoldMax] = useState(20);
  const [paymentWindowHrs, setPaymentWindowHrs] = useState(24);
  const [autoExtend, setAutoExtend] = useState(0);

  useEffect(() => {
    if (!escrow.data) return;
    return syncAfterPaint(() => {
      setHoldMin(escrow.data.minHoldBps / 100);
      setHoldMax(escrow.data.maxHoldBps / 100);
      setPaymentWindowHrs(escrow.data.paymentWindowHours);
      setAutoExtend(escrow.data.autoExtendMinutes);
    });
  }, [escrow.data]);

  const save = async () => {
    try {
      await update.mutateAsync({
        minHoldBps: Math.round(holdMin * 100),
        maxHoldBps: Math.round(holdMax * 100),
        paymentWindowHours: paymentWindowHrs,
        autoExtendMinutes: autoExtend,
      });
      toast.success("Escrow updated");
    } catch (err) {
      wrap(err, "Could not update escrow");
    }
  };

  return (
    <Card className="lg:col-span-2">
      <CardHead
        title="Holds & escrow"
        action={
          <button
            type="button"
            disabled={update.isPending}
            onClick={save}
            className="rounded-md px-3 py-1 text-xs font-semibold text-[#1a0a00] disabled:opacity-60"
            style={PRIMARY_BTN}
          >
            {update.isPending ? "Saving…" : "Save"}
          </button>
        }
      />
      <CardBody>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <NumInputField
            label="Min hold"
            sub="On low-value bids"
            value={holdMin}
            onChange={setHoldMin}
            suffix="%"
            step={0.1}
          />
          <NumInputField
            label="Max hold"
            sub="On high-value bids"
            value={holdMax}
            onChange={setHoldMax}
            suffix="%"
            step={0.1}
          />
          <NumInputField
            label="Payment window"
            sub="After auction win"
            value={paymentWindowHrs}
            onChange={setPaymentWindowHrs}
            suffix="hours"
          />
          <NumInputField
            label="Auto-extend"
            sub="On last-minute bid"
            value={autoExtend}
            onChange={setAutoExtend}
            suffix="min"
          />
        </div>
      </CardBody>
    </Card>
  );
}

// ---------- Toggles ----------

function TogglesCard() {
  const toggles = usePlatformToggles();
  const update = useUpdatePlatformToggles();

  const [email, setEmail] = useState(true);
  const [wa, setWa] = useState(true);
  const [pause, setPause] = useState(false);

  useEffect(() => {
    if (!toggles.data) return;
    return syncAfterPaint(() => {
      setEmail(toggles.data.emailNotifications);
      setWa(toggles.data.whatsappNotifications);
      setPause(toggles.data.pauseNewListings);
    });
  }, [toggles.data]);

  const set = async (
    key: "emailNotifications" | "whatsappNotifications" | "pauseNewListings",
    value: boolean,
  ) => {
    try {
      await update.mutateAsync({ [key]: value });
    } catch (err) {
      wrap(err, "Could not update toggles");
    }
  };

  return (
    <Card className="lg:col-span-2">
      <CardHead title="Platform toggles" />
      <CardBody>
        <Toggle
          label="Email notifications"
          sub="Send transactional emails"
          on={email}
          onChange={(v) => {
            setEmail(v);
            set("emailNotifications", v);
          }}
        />
        <div className="border-t border-line" />
        <Toggle
          label="WhatsApp notifications"
          sub="WhatsApp Business API"
          on={wa}
          onChange={(v) => {
            setWa(v);
            set("whatsappNotifications", v);
          }}
        />
        <div className="border-t border-line" />
        <Toggle
          label="Pause new listings"
          sub="Block new submissions while issues are investigated"
          on={pause}
          onChange={(v) => {
            setPause(v);
            set("pauseNewListings", v);
          }}
        />
      </CardBody>
    </Card>
  );
}
