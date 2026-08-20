"use client";

import { AuthFormBody, AuthFormTop } from "../AuthFormBody";
import { Icon } from "../primitives/Icon";
import { Stepper } from "../primitives/Stepper";
import {
  BvnOtpStep,
  BvnStep,
  KycSecurityNote,
  NinStep,
  SubaccountStep,
} from "./KycSteps";
import { useKycFlow } from "./useKycFlow";

const KYC_STEP_LABELS = ["NIN", "BVN", "Confirm BVN", "Payment account"];
const ONBOARDING_STEPS = ["Account", "Verify", "KYC"];

export function KycFlow() {
  const flow = useKycFlow();

  return (
    <>
      <AuthFormTop
        left={
          <button
            type="button"
            onClick={flow.goBack}
            className="inline-flex items-center gap-1.5 text-muted-foreground"
          >
            <Icon name="chevron-l" size={14} /> Back
          </button>
        }
        right={
          <button
            type="button"
            onClick={flow.exit}
            className="text-muted-foreground hover:text-foreground"
          >
            {flow.isAccount ? "Cancel" : "Skip for now"}
          </button>
        }
      />
      <AuthFormBody
        stepper={
          flow.isAccount ? undefined : (
            <Stepper steps={ONBOARDING_STEPS} current={2} />
          )
        }
        eyebrow={
          flow.isAccount
            ? `Account · Step ${flow.stepIdx + 1} of 4`
            : `Step 3 of 3 · KYC · ${KYC_STEP_LABELS[flow.stepIdx]}`
        }
      >
        {flow.step === "nin" && <NinStep flow={flow} />}
        {flow.step === "bvn" && <BvnStep flow={flow} />}
        {flow.step === "bvn-otp" && <BvnOtpStep flow={flow} />}
        {flow.step === "subaccount" && <SubaccountStep flow={flow} />}
        <KycSecurityNote />
      </AuthFormBody>
    </>
  );
}
