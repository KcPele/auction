"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthFormBody, AuthFormTop } from "../AuthFormBody";
import { AuthButton } from "../primitives/AuthButton";
import { Field, Input } from "../primitives/Field";
import { Icon } from "../primitives/Icon";
import { NinVerifyField } from "../primitives/NinVerifyField";
import { Stepper } from "../primitives/Stepper";

type Step = "nin" | "bvn" | "otp" | "subaccount";

const STEPS: Step[] = ["nin", "bvn", "otp", "subaccount"];

export function KycFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const ctx = params.get("ctx") ?? "register";
  const isAccount = ctx === "account";

  // NIN step
  const [nin, setNin] = useState("");
  const [ninVerified, setNinVerified] = useState(false);

  // BVN step — matches VerifyBvnDto { number, firstName, lastName, dateOfBirth, phoneNumber }
  const [bvn, setBvn] = useState("");
  const [bvnFirstName, setBvnFirstName] = useState("");
  const [bvnLastName, setBvnLastName] = useState("");
  const [bvnDob, setBvnDob] = useState("");
  const [bvnPhone, setBvnPhone] = useState("");

  // OTP step — matches SendOtpDto { phone, otp }
  const [otpPhone, setOtpPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Subaccount step — matches CreateSubaccountDto { bvn, state, pin, address, country, business?, companyType?, cac? }
  const [subState, setSubState] = useState("");
  const [subPin, setSubPin] = useState("");
  const [subAddress, setSubAddress] = useState("");
  const [subCountry] = useState("NG");
  const [subBusiness, setSubBusiness] = useState("");

  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];

  const onBack = () => {
    if (stepIdx > 0) {
      setStepIdx(stepIdx - 1);
    } else {
      isAccount ? router.push("/dashboard/profile") : router.push("/otp?ctx=register");
    }
  };

  const goNext = () => {
    if (stepIdx < STEPS.length - 1) {
      setStepIdx(stepIdx + 1);
    } else {
      router.push(isAccount ? "/dashboard/profile" : "/verified");
    }
  };

  const stepLabels = isAccount
    ? ["NIN", "BVN", "OTP", "Account"]
    : ["Account", "Verify", "KYC"];
  const stepperCurrent = isAccount ? stepIdx : 2;

  return (
    <>
      <AuthFormTop
        left={
          <button onClick={onBack} className="inline-flex items-center gap-1.5 text-fg-muted">
            <Icon name="chevron-l" size={14} /> Back
          </button>
        }
        right={
          <button onClick={() => router.push(isAccount ? "/dashboard/profile" : "/verified")} className="text-fg-muted hover:text-fg">
            {isAccount ? "Cancel" : "Skip for now"}
          </button>
        }
      />
      <AuthFormBody
        stepper={isAccount ? undefined : <Stepper steps={stepLabels} current={stepperCurrent} />}
        eyebrow={isAccount ? `Account · Step ${stepIdx + 1} of 4` : `Step 3 of 3 · ${stepLabels[stepIdx] ?? "KYC"}`}
      >
        {/* Step 1: NIN Verification */}
        {step === "nin" && (
          <>
            <h1 className="m-0 mb-2 font-display text-4xl font-semibold leading-[1.1] tracking-[-0.025em]">
              Verify your NIN.
            </h1>
            <p className="m-0 mb-8 max-w-[420px] text-sm text-fg-muted">
              Type your NIN and tap Verify to complete identity verification.
            </p>

            <NinVerifyField
              label="NIN"
              hint="Required to bid"
              value={nin}
              onChange={setNin}
              onVerified={() => setNinVerified(true)}
              // Integration: POST /api/v1/kyc/nin/verify { numberNin, surname, firstname, birthdate, telephoneno }
              meta="Dial *346# from your registered phone to find your NIN."
            />

            <AuthButton disabled={!ninVerified} onClick={goNext}>
              Continue <Icon name="arrow-r" size={16} strokeWidth={2} />
            </AuthButton>
          </>
        )}

        {/* Step 2: BVN Verification */}
        {step === "bvn" && (
          <>
            <h1 className="m-0 mb-2 font-display text-4xl font-semibold leading-[1.1] tracking-[-0.025em]">
              Verify your BVN.
            </h1>
            <p className="m-0 mb-6 max-w-[420px] text-sm text-fg-muted">
              We need your Bank Verification Number for secure payments.
            </p>

            <Field label="BVN" hint="11 digits">
              <Input
                inputMode="numeric"
                maxLength={11}
                placeholder="12345678901"
                value={bvn}
                onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))}
                leftIcon={<Icon name="shield" size={18} />}
              />
            </Field>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="First name">
                <Input placeholder="Ada" value={bvnFirstName} onChange={(e) => setBvnFirstName(e.target.value)} />
              </Field>
              <Field label="Last name">
                <Input placeholder="Okafor" value={bvnLastName} onChange={(e) => setBvnLastName(e.target.value)} />
              </Field>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Date of birth">
                <Input type="date" value={bvnDob} onChange={(e) => setBvnDob(e.target.value)} />
              </Field>
              <Field label="Phone number">
                <Input type="tel" placeholder="08123456789" value={bvnPhone} onChange={(e) => setBvnPhone(e.target.value)} />
              </Field>
            </div>

            <AuthButton disabled={bvn.length < 11 || !bvnFirstName || !bvnLastName} onClick={() => {
              // Integration: POST /api/v1/kyc/bvn/verify { number, firstName, lastName, dateOfBirth, phoneNumber }
              goNext();
            }}>
              Verify BVN <Icon name="arrow-r" size={16} strokeWidth={2} />
            </AuthButton>
          </>
        )}

        {/* Step 3: OTP Verification */}
        {step === "otp" && (
          <>
            <h1 className="m-0 mb-2 font-display text-4xl font-semibold leading-[1.1] tracking-[-0.025em]">
              Verify your phone.
            </h1>
            <p className="m-0 mb-6 max-w-[420px] text-sm text-fg-muted">
              We&apos;ll send an OTP to confirm your phone number.
            </p>

            <Field label="Phone number">
              <Input
                type="tel"
                placeholder="08123456789"
                value={otpPhone}
                onChange={(e) => setOtpPhone(e.target.value)}
                leftIcon={<Icon name="phone" size={18} />}
              />
            </Field>

            {otpSent && (
              <Field label="OTP" hint="4–6 digits" className="mt-3">
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  leftIcon={<Icon name="key" size={18} />}
                />
              </Field>
            )}

            {!otpSent ? (
              <AuthButton disabled={otpPhone.length < 8} onClick={() => {
                // Integration: POST /api/v1/kyc/otp/send { phone, otp: "" }
                setOtpSent(true);
              }}>
                Send OTP <Icon name="arrow-r" size={16} strokeWidth={2} />
              </AuthButton>
            ) : (
              <AuthButton disabled={otp.length < 4} onClick={() => {
                // Integration: POST /api/v1/kyc/otp/send { phone, otp }
                goNext();
              }}>
                Verify OTP <Icon name="arrow-r" size={16} strokeWidth={2} />
              </AuthButton>
            )}
          </>
        )}

        {/* Step 4: Subaccount Creation */}
        {step === "subaccount" && (
          <>
            <h1 className="m-0 mb-2 font-display text-4xl font-semibold leading-[1.1] tracking-[-0.025em]">
              Payment account.
            </h1>
            <p className="m-0 mb-6 max-w-[420px] text-sm text-fg-muted">
              Create your payment subaccount to receive payouts when your items sell.
            </p>

            <Field label="State">
              <Input placeholder="Lagos" value={subState} onChange={(e) => setSubState(e.target.value)} />
            </Field>
            <Field label="Address" className="mt-3">
              <Input placeholder="12 Marina Road, Lagos" value={subAddress} onChange={(e) => setSubAddress(e.target.value)} />
            </Field>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Transaction PIN" hint="4–6 digits">
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••"
                  value={subPin}
                  onChange={(e) => setSubPin(e.target.value.replace(/\D/g, ""))}
                />
              </Field>
              <Field label="Business name (optional)">
                <Input placeholder="KC Pele Auctions" value={subBusiness} onChange={(e) => setSubBusiness(e.target.value)} />
              </Field>
            </div>

            <AuthButton disabled={!subState || !subAddress || subPin.length < 4} onClick={() => {
              // Integration: POST /api/v1/kyc/subaccount { bvn, state, pin, address, country, business?, companyType?, cac? }
              goNext();
            }}>
              Create account <Icon name="arrow-r" size={16} strokeWidth={2} />
            </AuthButton>
          </>
        )}

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
