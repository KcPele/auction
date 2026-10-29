"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useMe } from "@/app/components/auth/hooks/use-me";
import {
  useConfirmKycBvn,
  useCreateKycSubaccount,
  useKycStatus,
  useVerifyKycBvn,
  useVerifyKycNin,
} from "@/app/components/kyc/hooks/use-kyc";
import { ApiError } from "@/app/lib/api/error";
import {
  bvnOtpSchema,
  bvnSchema,
  firstValidationIssue,
  ninSchema,
  subaccountSchema,
} from "./kyc.schema";
import { useCooldown } from "./useCooldown";

export type KycStep = "nin" | "bvn" | "bvn-otp" | "subaccount";

interface KycFields {
  nin: string;
  ninFirst: string;
  ninSurname: string;
  ninDob: string;
  ninPhone: string;
  bvn: string;
  bvnFirstName: string;
  bvnLastName: string;
  bvnDob: string;
  bvnPhone: string;
  bvnTransactionId: string;
  otp: string;
  subState: string;
  subPin: string;
  subAddress: string;
  subBusiness: string;
}

const STEPS: KycStep[] = ["nin", "bvn", "bvn-otp", "subaccount"];
/** Each resend bills a real SMS, so space them out. */
const RESEND_COOLDOWN_SECONDS = 60;
const INITIAL_FIELDS: KycFields = {
  nin: "",
  ninFirst: "",
  ninSurname: "",
  ninDob: "",
  ninPhone: "",
  bvn: "",
  bvnFirstName: "",
  bvnLastName: "",
  bvnDob: "",
  bvnPhone: "",
  bvnTransactionId: "",
  otp: "",
  subState: "",
  subPin: "",
  subAddress: "",
  subBusiness: "",
};

function toBackendDob(input: string): string {
  if (!input) return "";
  const [year, month, day] = input.split("-");
  return year && month && day ? `${day}-${month}-${year}` : input;
}

export function useKycFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const isAccount = params.get("ctx") === "account";
  const { data: me } = useMe();
  const { data: kycStatus } = useKycStatus();
  const statusApplied = useRef(false);
  const defaultsApplied = useRef(false);
  const [fields, setFields] = useState(INITIAL_FIELDS);
  const [stepIdx, setStepIdx] = useState(0);

  const verifyNin = useVerifyKycNin();
  const verifyBvn = useVerifyKycBvn();
  const confirmBvn = useConfirmKycBvn();
  const createSubaccount = useCreateKycSubaccount();
  const resendCooldown = useCooldown(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (!kycStatus || statusApplied.current) return;
    // The guard is claimed inside the frame, not before it. Strict Mode runs
    // this effect twice (run, clean up, run), and cancelling the frame while
    // the guard was already set meant the step was never applied at all.
    const frame = window.requestAnimationFrame(() => {
      statusApplied.current = true;
      const pendingOtp = Boolean(kycStatus.pendingBvnTransactionId);
      if (!kycStatus.ninVerifiedAt) setStepIdx(0);
      else if (kycStatus.bvnVerifiedAt) {
        if (!kycStatus.subaccountCreated) setStepIdx(3);
        else router.replace(isAccount ? "/dashboard/profile" : "/verified");
      } else if (pendingOtp) {
        // A BVN check is already waiting on its OTP, so resume there rather
        // than making the user redo a verification the server still holds.
        setFields((current) => ({
          ...current,
          bvnTransactionId: kycStatus.pendingBvnTransactionId ?? "",
        }));
        setStepIdx(2);
      } else setStepIdx(1);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isAccount, kycStatus, router]);

  useEffect(() => {
    if (!me || defaultsApplied.current) return;
    const frame = window.requestAnimationFrame(() => {
      defaultsApplied.current = true;
      setFields((current) => ({
        ...current,
        nin: me.nin ?? current.nin,
        ninFirst: me.firstName,
        ninSurname: me.lastName,
        ninPhone: me.phone ?? current.ninPhone,
        bvnFirstName: me.firstName,
        bvnLastName: me.lastName,
        bvnPhone: me.phone ?? current.bvnPhone,
      }));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [me]);

  const updateField = <Key extends keyof KycFields>(
    key: Key,
    value: KycFields[Key],
  ) => setFields((current) => ({ ...current, [key]: value }));

  const destination = isAccount ? "/dashboard/profile" : "/verified";
  const exitDestination = isAccount ? "/dashboard/profile" : "/dashboard";
  const goNext = () => {
    if (stepIdx === STEPS.length - 1) router.push(destination);
    else setStepIdx((current) => current + 1);
  };
  const goBack = () => {
    if (stepIdx === 0) router.push(exitDestination);
    else setStepIdx((current) => current - 1);
  };
  const exit = () => router.push(exitDestination);
  const reportError = (error: unknown, fallback: string) => {
    toast.error(error instanceof ApiError ? error.message : fallback);
  };

  const ninInput = {
    numberNin: fields.nin,
    surname: fields.ninSurname,
    firstname: fields.ninFirst,
    birthdate: fields.ninDob,
    telephoneno: fields.ninPhone,
  };
  const bvnInput = {
    number: fields.bvn,
    firstName: fields.bvnFirstName,
    lastName: fields.bvnLastName,
    dateOfBirth: fields.bvnDob,
    phoneNumber: fields.bvnPhone,
  };
  const otpInput = {
    transactionId: fields.bvnTransactionId,
    otp: fields.otp,
  };
  const subaccountInput = {
    bvn: fields.bvn,
    state: fields.subState,
    pin: fields.subPin,
    address: fields.subAddress,
    business: fields.subBusiness,
  };

  const submitNin = async () => {
    const issue = firstValidationIssue(ninSchema, ninInput);
    if (issue) return toast.error(issue);
    try {
      await verifyNin.mutateAsync({
        ...ninInput,
        birthdate: toBackendDob(ninInput.birthdate),
      });
      toast.success("NIN verified");
      goNext();
    } catch (error) {
      const providerMessage =
        error instanceof ApiError ? error.message.toLowerCase() : "";
      if (providerMessage.includes("mismatch") || providerMessage.includes("match")) {
        toast.error(
          "Your details did not match the NIN record. Check your first name, surname, date of birth, and NIN-linked phone number.",
        );
      } else {
        reportError(error, "NIN verification failed");
      }
    }
  };

  const submitBvn = async () => {
    const issue = firstValidationIssue(bvnSchema, bvnInput);
    if (issue) return toast.error(issue);
    try {
      const result = await verifyBvn.mutateAsync({
        ...bvnInput,
        dateOfBirth: toBackendDob(bvnInput.dateOfBirth),
      });
      updateField("bvnTransactionId", result.transactionId);
      toast.success("BVN matched. Enter the OTP sent to your phone");
      goNext();
    } catch (error) {
      reportError(error, "BVN verification failed");
    }
  };

  /**
   * Strowallet has no resend endpoint — verifying the BVN again is what issues
   * a fresh OTP, and it returns a new transaction id that replaces the old one.
   * That needs the BVN details, which only live in this form, so a reloaded
   * page has to go back a step rather than silently failing.
   */
  const resendBvnOtp = async () => {
    if (resendCooldown.active || verifyBvn.isPending) return;
    if (firstValidationIssue(bvnSchema, bvnInput)) {
      toast.error("Enter your BVN details again to get a new OTP");
      setStepIdx(1);
      return;
    }
    try {
      const result = await verifyBvn.mutateAsync({
        ...bvnInput,
        dateOfBirth: toBackendDob(bvnInput.dateOfBirth),
      });
      updateField("bvnTransactionId", result.transactionId);
      updateField("otp", "");
      resendCooldown.start();
      toast.success("New OTP sent to your registered phone");
    } catch (error) {
      reportError(error, "Could not send a new OTP");
    }
  };

  const submitBvnOtp = async () => {
    const issue = firstValidationIssue(bvnOtpSchema, otpInput);
    if (issue) return toast.error(issue);
    try {
      await confirmBvn.mutateAsync(otpInput);
      toast.success("BVN and phone verified");
      goNext();
    } catch (error) {
      reportError(error, "OTP verification failed");
    }
  };

  const submitSubaccount = async () => {
    const issue = firstValidationIssue(subaccountSchema, subaccountInput);
    if (issue) return toast.error(issue);
    try {
      await createSubaccount.mutateAsync({ ...subaccountInput, country: "NG" });
      toast.success("Subaccount created");
      goNext();
    } catch (error) {
      reportError(error, "Could not create subaccount");
    }
  };

  return {
    // What the server already has on file. A step that is done is not
    // re-submitted when the user walks back to it.
    completed: {
      nin: Boolean(kycStatus?.ninVerifiedAt),
      bvn: Boolean(kycStatus?.bvnVerifiedAt),
      subaccount: Boolean(kycStatus?.subaccountCreated),
    },
    goNext,
    canSubmit: {
      nin: !firstValidationIssue(ninSchema, ninInput),
      bvn: !firstValidationIssue(bvnSchema, bvnInput),
      bvnOtp: !firstValidationIssue(bvnOtpSchema, otpInput),
      subaccount: !firstValidationIssue(subaccountSchema, subaccountInput),
    },
    exit,
    fields,
    goBack,
    isAccount,
    pending: {
      nin: verifyNin.isPending,
      bvn: verifyBvn.isPending,
      bvnOtp: confirmBvn.isPending,
      bvnResend: verifyBvn.isPending,
      subaccount: createSubaccount.isPending,
    },
    step: STEPS[stepIdx],
    stepIdx,
    resendBvnOtp,
    resendCooldown: {
      active: resendCooldown.active,
      remaining: resendCooldown.remaining,
    },
    submitBvn,
    submitBvnOtp,
    submitNin,
    submitSubaccount,
    updateField,
  };
}

export type KycFlowController = ReturnType<typeof useKycFlow>;
