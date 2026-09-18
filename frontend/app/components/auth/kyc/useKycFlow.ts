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

  useEffect(() => {
    if (!kycStatus || statusApplied.current) return;
    statusApplied.current = true;
    const frame = window.requestAnimationFrame(() => {
      if (!kycStatus.ninVerifiedAt) setStepIdx(0);
      else if (!kycStatus.bvnVerifiedAt) setStepIdx(1);
      else if (!kycStatus.subaccountCreated) setStepIdx(3);
      else router.replace(isAccount ? "/dashboard/profile" : "/verified");
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isAccount, kycStatus, router]);

  useEffect(() => {
    if (!me || defaultsApplied.current) return;
    defaultsApplied.current = true;
    const frame = window.requestAnimationFrame(() => {
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
      subaccount: createSubaccount.isPending,
    },
    step: STEPS[stepIdx],
    stepIdx,
    submitBvn,
    submitBvnOtp,
    submitNin,
    submitSubaccount,
    updateField,
  };
}

export type KycFlowController = ReturnType<typeof useKycFlow>;
