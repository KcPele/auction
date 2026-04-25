"use client";
import { useState } from "react";
import { Card, CardBody, CardHead } from "../widgets/Card";
import { SectionHeader } from "./SectionHeader";
import { NumberInput } from "../../ui/NumberInput";

interface SettingsState {
  holdMin: number;
  holdMax: number;
  paymentWindowHrs: number;
  buyerFeePct: number;
  sellerFeePct: number;
  autoExtendMin: number;
  emailEnabled: boolean;
  waEnabled: boolean;
  pauseNewListings: boolean;
}

const DEFAULTS: SettingsState = {
  holdMin: 10,
  holdMax: 20,
  paymentWindowHrs: 24,
  buyerFeePct: 2.5,
  sellerFeePct: 5,
  autoExtendMin: 2,
  emailEnabled: true,
  waEnabled: true,
  pauseNewListings: false,
};

function NumInput({
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
  const [s, setS] = useState<SettingsState>(DEFAULTS);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const upd = <K extends keyof SettingsState>(k: K, v: SettingsState[K]) =>
    setS((p) => ({ ...p, [k]: v }));

  const save = () => {
    setSavedAt(new Date().toLocaleTimeString());
  };

  return (
    <>
      <SectionHeader
        title="Platform settings"
        sub="Hold percentage range, payment window, fee structure, and platform-wide toggles."
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
        <Card>
          <CardHead title="Holds & escrow" />
          <CardBody>
            <div className="grid grid-cols-2 gap-4">
              <NumInput
                label="Min hold"
                sub="On low-value bids"
                value={s.holdMin}
                onChange={(v) => upd("holdMin", v)}
                suffix="%"
              />
              <NumInput
                label="Max hold"
                sub="On high-value bids"
                value={s.holdMax}
                onChange={(v) => upd("holdMax", v)}
                suffix="%"
              />
              <NumInput
                label="Payment window"
                sub="After auction win"
                value={s.paymentWindowHrs}
                onChange={(v) => upd("paymentWindowHrs", v)}
                suffix="hours"
              />
              <NumInput
                label="Auto-extend"
                sub="On last-minute bid"
                value={s.autoExtendMin}
                onChange={(v) => upd("autoExtendMin", v)}
                suffix="min"
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHead title="Fees" />
          <CardBody>
            <div className="grid grid-cols-2 gap-4">
              <NumInput
                label="Buyer fee"
                sub="On final bid"
                value={s.buyerFeePct}
                onChange={(v) => upd("buyerFeePct", v)}
                suffix="%"
                step={0.1}
              />
              <NumInput
                label="Seller fee"
                sub="On payout"
                value={s.sellerFeePct}
                onChange={(v) => upd("sellerFeePct", v)}
                suffix="%"
                step={0.1}
              />
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHead title="Platform toggles" />
          <CardBody>
            <Toggle
              label="Email notifications"
              sub="Resend integration"
              on={s.emailEnabled}
              onChange={(v) => upd("emailEnabled", v)}
            />
            <div className="border-t border-line" />
            <Toggle
              label="WhatsApp notifications"
              sub="WhatsApp Business API"
              on={s.waEnabled}
              onChange={(v) => upd("waEnabled", v)}
            />
            <div className="border-t border-line" />
            <Toggle
              label="Pause new listings"
              sub="Block new submissions while issues are investigated"
              on={s.pauseNewListings}
              onChange={(v) => upd("pauseNewListings", v)}
            />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
