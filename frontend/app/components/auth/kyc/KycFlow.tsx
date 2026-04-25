"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthFormBody, AuthFormTop } from "../AuthFormBody";
import { AuthButton } from "../primitives/AuthButton";
import { Icon } from "../primitives/Icon";
import { NinVerifyField } from "../primitives/NinVerifyField";
import { Stepper } from "../primitives/Stepper";

export function KycFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const ctx = params.get("ctx") ?? "register";
  const isAccount = ctx === "account";

  const [nin, setNin] = useState("");
  const [ninVerified, setNinVerified] = useState(false);

  const onBack = () =>
    isAccount ? router.push("/dashboard/profile") : router.push("/otp?ctx=register");

  const goNext = () => router.push(isAccount ? "/dashboard/profile" : "/verified");

  return (
    <>
      <AuthFormTop
        left={
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-fg-muted"
          >
            <Icon name="chevron-l" size={14} /> Back
          </button>
        }
        right={
          <button onClick={goNext} className="text-fg-muted hover:text-fg">
            {isAccount ? "Cancel" : "Skip for now"}
          </button>
        }
      />
      <AuthFormBody
        stepper={
          isAccount ? undefined : <Stepper steps={["Account", "Verify", "KYC"]} current={2} />
        }
        eyebrow={isAccount ? "Account · Verify identity" : "Step 3 of 3 · Identity"}
      >
        <h1 className="m-0 mb-2 font-display text-4xl font-semibold leading-[1.1] tracking-[-0.025em]">
          Verify your identity.
        </h1>
        <p className="m-0 mb-8 max-w-[420px] text-sm text-fg-muted">
          Type your NIN and tap Verify to complete your identity verification.
        </p>

        <NinVerifyField
          label="NIN"
          hint="Required to bid"
          value={nin}
          onChange={setNin}
          onVerified={() => setNinVerified(true)}
          meta="Dial *346# from your registered phone to find your NIN."
        />

        <AuthButton disabled={!ninVerified} onClick={goNext}>
          {ninVerified ? "Continue" : "Verify NIN to continue"}
          <Icon name="arrow-r" size={16} strokeWidth={2} />
        </AuthButton>

        <div className="mt-5 flex items-start gap-3.5 rounded-[10px] border border-line bg-surface p-3.5 text-xs leading-[1.5] text-fg-muted">
          <Icon name="lock" size={16} />
          <div>
            Encrypted in transit and at rest. Only used to verify identity — never shared with
            sellers or third parties.
          </div>
        </div>
      </AuthFormBody>
    </>
  );
}
