"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthFormBody, AuthFormTop } from "../AuthFormBody";
import { Icon } from "../primitives/Icon";
import { Stepper } from "../primitives/Stepper";
import { KycBvn } from "./KycBvn";
import { KycSelfie } from "./KycSelfie";
import { KycUpload } from "./KycUpload";

const STEP_NAMES = ["BVN", "ID", "Selfie"] as const;

export function KycFlow() {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1 | 2>(0);

  const onBack = () => (step === 0 ? router.push("/otp?ctx=register") : setStep((step - 1) as 0 | 1));

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
          <button
            onClick={() => router.push("/")}
            className="text-fg-muted hover:text-fg"
          >
            Skip for now
          </button>
        }
      />
      <AuthFormBody
        stepper={<Stepper steps={["Account", "Verify", "KYC"]} current={2} />}
        eyebrow={`Step ${step + 1} of 3 · ${STEP_NAMES[step]}`}
      >
        {step === 0 && <KycBvn onNext={() => setStep(1)} />}
        {step === 1 && <KycUpload onNext={() => setStep(2)} />}
        {step === 2 && <KycSelfie onNext={() => router.push("/verified")} />}
      </AuthFormBody>
    </>
  );
}
