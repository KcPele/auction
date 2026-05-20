"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useMe } from "@/app/components/auth/hooks/use-me";
import {
  useCreateKycSubaccount,
  useSendKycOtp,
  useVerifyKycBvn,
  useVerifyKycNin,
} from "@/app/components/kyc/hooks/use-kyc";
import { ApiError } from "@/app/lib/api/error";
import { AuthFormBody, AuthFormTop } from "../AuthFormBody";
import { AuthButton } from "../primitives/AuthButton";
import { Field, Input } from "../primitives/Field";
import { Icon } from "../primitives/Icon";
import { Stepper } from "../primitives/Stepper";

type Step = "nin" | "bvn" | "otp" | "subaccount";

const STEPS: Step[] = ["nin", "bvn", "otp", "subaccount"];

// Backend expects dd-mm-yyyy. HTML date input gives yyyy-mm-dd.
function toBackendDob(input: string): string {
  if (!input) return "";
  const [y, m, d] = input.split("-");
  if (!y || !m || !d) return input;
  return `${d}-${m}-${y}`;
}

export function KycFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const ctx = params.get("ctx") ?? "register";
  const isAccount = ctx === "account";
  const { data: me } = useMe();

  // NIN — kyc/nin/verify needs { numberNin, surname, firstname, birthdate, telephoneno }
  const [nin, setNin] = useState("");
  const [ninFirst, setNinFirst] = useState("");
  const [ninSurname, setNinSurname] = useState("");
  const [ninDob, setNinDob] = useState("");
  const [ninPhone, setNinPhone] = useState("");

  // BVN — kyc/bvn/verify needs { number, firstName, lastName, dateOfBirth, phoneNumber }
  const [bvn, setBvn] = useState("");
  const [bvnFirstName, setBvnFirstName] = useState("");
  const [bvnLastName, setBvnLastName] = useState("");
  const [bvnDob, setBvnDob] = useState("");
  const [bvnPhone, setBvnPhone] = useState("");

  // OTP — kyc/otp/send needs { phone, otp }
  const [otpPhone, setOtpPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Subaccount — kyc/subaccount needs { bvn, state, pin, address, country, business?, companyType?, cac? }
  const [subState, setSubState] = useState("");
  const [subPin, setSubPin] = useState("");
  const [subAddress, setSubAddress] = useState("");
  const [subBusiness, setSubBusiness] = useState("");

  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];

  // Hydrate sensible defaults from /users/me when available.
  if (me && stepIdx === 0 && !ninFirst && !ninSurname) {
    setNinFirst(me.firstName);
    setNinSurname(me.lastName);
    setBvnFirstName(me.firstName);
    setBvnLastName(me.lastName);
    if (me.phone) {
      setNinPhone(me.phone);
      setBvnPhone(me.phone);
      setOtpPhone(me.phone);
    }
    if (me.nin) setNin(me.nin);
  }

  const verifyNin = useVerifyKycNin();
  const verifyBvn = useVerifyKycBvn();
  const sendOtp = useSendKycOtp();
  const createSub = useCreateKycSubaccount();

  const onBack = () => {
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
    else router.push(isAccount ? "/dashboard/profile" : "/dashboard");
  };

  const goNext = () => {
    if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1);
    else router.push(isAccount ? "/dashboard/profile" : "/verified");
  };

  const reportError = (err: unknown, fallback: string) => {
    if (err instanceof ApiError) toast.error(err.message);
    else toast.error(fallback);
  };

  const onVerifyNin = async () => {
    try {
      await verifyNin.mutateAsync({
        numberNin: nin,
        surname: ninSurname.trim(),
        firstname: ninFirst.trim(),
        birthdate: toBackendDob(ninDob),
        telephoneno: ninPhone.trim(),
      });
      toast.success("NIN verified");
      goNext();
    } catch (err) {
      reportError(err, "NIN verification failed");
    }
  };

  const onVerifyBvn = async () => {
    try {
      await verifyBvn.mutateAsync({
        number: bvn,
        firstName: bvnFirstName.trim(),
        lastName: bvnLastName.trim(),
        dateOfBirth: toBackendDob(bvnDob),
        phoneNumber: bvnPhone.trim(),
      });
      toast.success("BVN verified");
      goNext();
    } catch (err) {
      reportError(err, "BVN verification failed");
    }
  };

  const onSendOtp = async () => {
    try {
      await sendOtp.mutateAsync({ phone: otpPhone, otp: "" });
      toast.success("OTP sent");
      setOtpSent(true);
    } catch (err) {
      reportError(err, "Could not send OTP");
    }
  };

  const onVerifyOtp = async () => {
    try {
      await sendOtp.mutateAsync({ phone: otpPhone, otp });
      toast.success("Phone verified");
      goNext();
    } catch (err) {
      reportError(err, "OTP verification failed");
    }
  };

  const onCreateSub = async () => {
    try {
      await createSub.mutateAsync({
        bvn,
        state: subState.trim(),
        pin: subPin,
        address: subAddress.trim(),
        country: "NG",
        ...(subBusiness ? { business: subBusiness.trim() } : {}),
      });
      toast.success("Subaccount created");
      goNext();
    } catch (err) {
      reportError(err, "Could not create subaccount");
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
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-fg-muted"
          >
            <Icon name="chevron-l" size={14} /> Back
          </button>
        }
        right={
          <button
            onClick={() =>
              router.push(isAccount ? "/dashboard/profile" : "/dashboard")
            }
            className="text-fg-muted hover:text-fg"
          >
            {isAccount ? "Cancel" : "Skip for now"}
          </button>
        }
      />
      <AuthFormBody
        stepper={
          isAccount ? undefined : (
            <Stepper steps={stepLabels} current={stepperCurrent} />
          )
        }
        eyebrow={
          isAccount
            ? `Account · Step ${stepIdx + 1} of 4`
            : `Step 3 of 3 · ${stepLabels[stepIdx] ?? "KYC"}`
        }
      >
        {step === "nin" && (
          <>
            <h1 className="m-0 mb-2 font-display text-4xl font-semibold leading-[1.1] tracking-[-0.025em]">
              Verify your NIN.
            </h1>
            <p className="m-0 mb-6 max-w-[420px] text-sm text-fg-muted">
              Type your NIN exactly as registered to complete identity
              verification.
            </p>

            <Field label="NIN" hint="11 digits">
              <Input
                inputMode="numeric"
                maxLength={11}
                placeholder="12345678901"
                value={nin}
                onChange={(e) => setNin(e.target.value.replace(/\D/g, ""))}
                leftIcon={<Icon name="shield" size={18} />}
              />
            </Field>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="First name">
                <Input
                  value={ninFirst}
                  onChange={(e) => setNinFirst(e.target.value)}
                />
              </Field>
              <Field label="Surname">
                <Input
                  value={ninSurname}
                  onChange={(e) => setNinSurname(e.target.value)}
                />
              </Field>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Date of birth">
                <Input
                  type="date"
                  value={ninDob}
                  onChange={(e) => setNinDob(e.target.value)}
                />
              </Field>
              <Field label="Phone">
                <Input
                  type="tel"
                  placeholder="08123456789"
                  value={ninPhone}
                  onChange={(e) => setNinPhone(e.target.value)}
                />
              </Field>
            </div>

            <AuthButton
              type="button"
              disabled={
                nin.length !== 11 ||
                !ninFirst ||
                !ninSurname ||
                !ninDob ||
                !ninPhone ||
                verifyNin.isPending
              }
              onClick={onVerifyNin}
            >
              {verifyNin.isPending ? "Verifying…" : "Verify NIN"}{" "}
              <Icon name="arrow-r" size={16} strokeWidth={2} />
            </AuthButton>
          </>
        )}

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
                <Input
                  value={bvnFirstName}
                  onChange={(e) => setBvnFirstName(e.target.value)}
                />
              </Field>
              <Field label="Last name">
                <Input
                  value={bvnLastName}
                  onChange={(e) => setBvnLastName(e.target.value)}
                />
              </Field>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Date of birth">
                <Input
                  type="date"
                  value={bvnDob}
                  onChange={(e) => setBvnDob(e.target.value)}
                />
              </Field>
              <Field label="Phone number">
                <Input
                  type="tel"
                  placeholder="08123456789"
                  value={bvnPhone}
                  onChange={(e) => setBvnPhone(e.target.value)}
                />
              </Field>
            </div>

            <AuthButton
              type="button"
              disabled={
                bvn.length !== 11 ||
                !bvnFirstName ||
                !bvnLastName ||
                !bvnDob ||
                !bvnPhone ||
                verifyBvn.isPending
              }
              onClick={onVerifyBvn}
            >
              {verifyBvn.isPending ? "Verifying…" : "Verify BVN"}{" "}
              <Icon name="arrow-r" size={16} strokeWidth={2} />
            </AuthButton>
          </>
        )}

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
              <AuthButton
                type="button"
                disabled={otpPhone.length < 8 || sendOtp.isPending}
                onClick={onSendOtp}
              >
                {sendOtp.isPending ? "Sending…" : "Send OTP"}{" "}
                <Icon name="arrow-r" size={16} strokeWidth={2} />
              </AuthButton>
            ) : (
              <AuthButton
                type="button"
                disabled={otp.length < 4 || sendOtp.isPending}
                onClick={onVerifyOtp}
              >
                {sendOtp.isPending ? "Verifying…" : "Verify OTP"}{" "}
                <Icon name="arrow-r" size={16} strokeWidth={2} />
              </AuthButton>
            )}
          </>
        )}

        {step === "subaccount" && (
          <>
            <h1 className="m-0 mb-2 font-display text-4xl font-semibold leading-[1.1] tracking-[-0.025em]">
              Payment account.
            </h1>
            <p className="m-0 mb-6 max-w-[420px] text-sm text-fg-muted">
              Create your payment subaccount to receive payouts when your items
              sell.
            </p>

            <Field label="State">
              <Input
                placeholder="Lagos"
                value={subState}
                onChange={(e) => setSubState(e.target.value)}
              />
            </Field>
            <Field label="Address" className="mt-3">
              <Input
                placeholder="12 Marina Road, Lagos"
                value={subAddress}
                onChange={(e) => setSubAddress(e.target.value)}
              />
            </Field>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Transaction PIN" hint="4–6 digits">
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••"
                  value={subPin}
                  onChange={(e) =>
                    setSubPin(e.target.value.replace(/\D/g, ""))
                  }
                />
              </Field>
              <Field label="Business name (optional)">
                <Input
                  placeholder="KC Pele Auctions"
                  value={subBusiness}
                  onChange={(e) => setSubBusiness(e.target.value)}
                />
              </Field>
            </div>

            <AuthButton
              type="button"
              disabled={
                !subState ||
                !subAddress ||
                subPin.length < 4 ||
                bvn.length !== 11 ||
                createSub.isPending
              }
              onClick={onCreateSub}
            >
              {createSub.isPending ? "Creating…" : "Create account"}{" "}
              <Icon name="arrow-r" size={16} strokeWidth={2} />
            </AuthButton>
          </>
        )}

        <div className="mt-5 flex items-start gap-3.5 rounded-[10px] border border-line bg-surface p-3.5 text-xs leading-[1.5] text-fg-muted">
          <Icon name="lock" size={16} />
          <div>
            Encrypted in transit and at rest. Only used to verify identity —
            never shared with sellers or third parties.
          </div>
        </div>
      </AuthFormBody>
    </>
  );
}
