"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthFormBody, AuthFormTop } from "./AuthFormBody";
import { useResendTimer } from "./hooks/useResendTimer";
import { AuthButton } from "./primitives/AuthButton";
import { Icon } from "./primitives/Icon";
import { OtpInput } from "./primitives/OtpInput";
import { Stepper } from "./primitives/Stepper";

export function OtpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const ctx = params.get("ctx") === "register" ? "register" : "login";
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const { isBlocked, label, reset } = useResendTimer(45);

  const full = code.join("").length === 6;
  const backTo = ctx === "register" ? "/register" : "/login";
  const onSubmit = () => router.push(ctx === "register" ? "/kyc" : "/verified");

  return (
    <>
      <AuthFormTop
        left={
          <button
            onClick={() => router.push(backTo)}
            className="inline-flex items-center gap-1.5 text-fg-muted"
          >
            <Icon name="chevron-l" size={14} /> Back
          </button>
        }
        right={
          <>
            Wrong number?{" "}
            <button
              onClick={() => router.push(backTo)}
              className="font-semibold text-accent"
            >
              Change it
            </button>
          </>
        }
      />
      <AuthFormBody
        stepper={ctx === "register" ? <Stepper steps={["Account", "Verify", "KYC"]} current={1} /> : undefined}
        eyebrow="Verify your number"
        title="Enter the 6-digit code."
        subtitle={
          <>
            Sent to <strong className="text-fg">+234 812 ••• 6789</strong> via SMS and WhatsApp.
          </>
        }
      >
        <OtpInput value={code} onChange={setCode} />

        <AuthButton disabled={!full} onClick={onSubmit}>
          Verify and continue <Icon name="arrow-r" size={16} strokeWidth={2} />
        </AuthButton>

        <div className="mt-4 text-center text-[13px] text-fg-muted">
          Didn&apos;t get it?{" "}
          <button
            disabled={isBlocked}
            onClick={reset}
            className="font-semibold text-accent disabled:cursor-not-allowed disabled:text-fg-dim"
          >
            {isBlocked ? `Resend in ${label}` : "Resend code"}
          </button>
        </div>

        <div className="mt-7 flex items-start gap-2.5 rounded-[10px] border border-[rgba(78,168,92,0.2)] bg-[rgba(78,168,92,0.06)] p-3.5 text-xs leading-[1.5] text-fg-muted">
          <div className="mt-px shrink-0 text-green">
            <Icon name="shield" size={16} />
          </div>
          <div>
            BidNaija will never ask for this code by phone or WhatsApp. Ignore anyone who does.
          </div>
        </div>
      </AuthFormBody>
    </>
  );
}
