"use client";
import { useState } from "react";
import { AuthButton } from "../primitives/AuthButton";
import { Field, Input } from "../primitives/Field";
import { Icon } from "../primitives/Icon";

interface KycBvnProps {
  onNext: () => void;
}

export function KycBvn({ onNext }: KycBvnProps) {
  const [bvn, setBvn] = useState("");
  const [dob, setDob] = useState("");
  const ready = bvn.length === 11 && dob.length > 0;

  return (
    <>
      <h1 className="m-0 mb-2 font-display text-4xl font-semibold leading-[1.1] tracking-[-0.025em]">
        Confirm your BVN.
      </h1>
      <p className="m-0 mb-8 max-w-[380px] text-sm text-fg-muted">
        Your Bank Verification Number lets us match you with your bank records. We only read your
        name, phone, and date of birth — never your account balances.
      </p>

      <Field label="BVN" hint="Dial *565*0# to find yours">
        <Input
          inputMode="numeric"
          maxLength={11}
          placeholder="22•••••••••"
          value={bvn}
          onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))}
          leftIcon={<Icon name="shield" size={18} />}
        />
      </Field>

      <Field label="Date of birth" meta="Must match the DOB on your BVN record.">
        <Input
          placeholder="DD / MM / YYYY"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          leftIcon={<Icon name="calendar" size={18} />}
        />
      </Field>

      <AuthButton disabled={!ready} onClick={onNext}>
        Verify BVN <Icon name="arrow-r" size={16} strokeWidth={2} />
      </AuthButton>

      <div className="mt-5 flex items-start gap-3.5 rounded-[10px] border border-line bg-surface p-3.5 text-xs leading-[1.5] text-fg-muted">
        <Icon name="lock" size={16} />
        <div>
          Encrypted in transit and at rest. Only used to verify identity — never shared with
          sellers or third parties.
        </div>
      </div>
    </>
  );
}
