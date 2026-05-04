"use client";
import { useState, type ReactNode } from "react";
import { Field, Input } from "./Field";
import { Icon, type IconName } from "./Icon";

type Status = "idle" | "checking" | "verified" | "error";

interface NinVerifyFieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  meta?: ReactNode;
  placeholder?: string;
  iconName?: IconName;
  /** digits required to enable verify */
  length?: number;
  /** async verifier; defaults to mock (resolves true after 900ms). 
   *  Integration: POST /api/v1/auth/verify-nin { nin } or POST /api/v1/kyc/nin/verify { numberNin, surname, firstname, birthdate, telephoneno }
   */
  verify?: (value: string) => Promise<boolean>;
  onVerified?: (value: string) => void;
  value: string;
  onChange: (v: string) => void;
}

export function NinVerifyField({
  label = "NIN",
  hint = "11 digits",
  meta,
  placeholder = "12345678901",
  iconName = "shield",
  length = 11,
  verify,
  onVerified,
  value,
  onChange,
}: NinVerifyFieldProps) {
  const [status, setStatus] = useState<Status>("idle");

  const ready = value.length === length;
  const verified = status === "verified";

  const handleVerify = async () => {
    if (!ready || verified) return;
    setStatus("checking");
    const ok = verify ? await verify(value) : await mockVerify();
    if (ok) {
      setStatus("verified");
      onVerified?.(value);
    } else {
      setStatus("error");
    }
  };

  const handleChange = (v: string) => {
    onChange(v);
    if (status !== "idle") setStatus("idle");
  };

  return (
    <Field
      label={label}
      hint={
        verified ? (
          <span className="inline-flex items-center gap-1 text-green">
            <Icon name="check" size={12} strokeWidth={2.5} /> Verified
          </span>
        ) : status === "error" ? (
          <span className="text-red">Couldn&apos;t verify — check the number</span>
        ) : (
          hint
        )
      }
      meta={meta}
    >
      <Input
        inputMode="numeric"
        maxLength={length}
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleChange(e.target.value.replace(/\D/g, ""))}
        leftIcon={<Icon name={iconName} size={18} />}
        readOnly={verified}
        rightSlot={
          <button
            type="button"
            onClick={handleVerify}
            disabled={!ready || verified || status === "checking"}
            className={`mr-1 inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors ${
              verified
                ? "bg-green/15 text-green"
                : ready
                  ? "bg-accent text-[#1a0a00] hover:bg-accent-light"
                  : "cursor-not-allowed bg-surface-2 text-fg-dim"
            }`}
          >
            {status === "checking" ? (
              "Verifying…"
            ) : verified ? (
              <>
                <Icon name="check" size={12} strokeWidth={2.5} /> Verified
              </>
            ) : (
              "Verify"
            )}
          </button>
        }
      />
    </Field>
  );
}

function mockVerify(): Promise<boolean> {
  return new Promise((resolve) => setTimeout(() => resolve(true), 900));
}
