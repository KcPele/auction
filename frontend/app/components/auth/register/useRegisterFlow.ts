"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { ApiError } from "@/app/lib/api/error";
import { useSignUp } from "../hooks/use-me";
import { usePasswordStrength } from "../hooks/usePasswordStrength";
import { signUpSchema, type SignUpForm } from "../utils/auth.schema";
import { REGISTER_STEPS } from "./register.config";

export function useRegisterFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      appRole: "INDIVIDUAL_BIDDER",
      nin: "",
      referralCode: "",
      accept: false as unknown as true,
    },
    mode: "onTouched",
  });
  const password = useWatch({ control: form.control, name: "password" });
  const strength = usePasswordStrength(password ?? "");
  const signup = useSignUp();

  const next = async () => {
    const valid = await form.trigger(REGISTER_STEPS[step].fields, {
      shouldFocus: true,
    });
    if (valid) setStep((current) => Math.min(current + 1, REGISTER_STEPS.length - 1));
  };

  const createAccount = form.handleSubmit(async (data) => {
    try {
      await signup.mutateAsync({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        appRole: data.appRole,
        referralCode: data.referralCode || undefined,
      });
      toast.success("Account created");
      const query = new URLSearchParams({
        ctx: "register",
        email: data.email,
        next: "/kyc?ctx=register",
      });
      router.replace(`/otp?${query.toString()}`);
    } catch (error) {
      if (!(error instanceof ApiError)) {
        toast.error("Network error. Try again.");
        return;
      }
      if (error.isValidation && Array.isArray((error.details as { issues?: unknown[] })?.issues)) {
        const issues = (error.details as { issues: { path: string[]; message: string }[] }).issues;
        for (const issue of issues) {
          const field = issue.path[0] as keyof SignUpForm | undefined;
          if (field) form.setError(field, { message: issue.message });
        }
        const firstField = issues[0]?.path[0] as keyof SignUpForm | undefined;
        const targetStep = REGISTER_STEPS.findIndex(({ fields }) =>
          firstField ? fields.includes(firstField) : false,
        );
        if (targetStep >= 0) setStep(targetStep);
      } else {
        const lowerMsg = (error.message || "").toLowerCase();
        if (lowerMsg.includes("phone")) {
          form.setError("phone", { message: error.message });
          const targetStep = REGISTER_STEPS.findIndex(({ fields }) =>
            fields.includes("phone"),
          );
          if (targetStep >= 0) setStep(targetStep);
        } else if (lowerMsg.includes("email")) {
          form.setError("email", { message: error.message });
          const targetStep = REGISTER_STEPS.findIndex(({ fields }) =>
            fields.includes("email"),
          );
          if (targetStep >= 0) setStep(targetStep);
        }
      }
      toast.error(error.message || "Could not create account");
    }
  });

  const submit = step === REGISTER_STEPS.length - 1
    ? createAccount
    : (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void next();
      };

  return {
    back: () => setStep((current) => Math.max(0, current - 1)),
    current: REGISTER_STEPS[step],
    form,
    hasPassword: Boolean(password),
    isPending: signup.isPending || form.formState.isSubmitting,
    showPassword,
    step,
    strength,
    submit,
    togglePassword: () => setShowPassword((visible) => !visible),
  };
}
