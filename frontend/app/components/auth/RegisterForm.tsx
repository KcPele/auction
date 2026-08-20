"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { AuthFormBody, AuthFormTop } from "./AuthFormBody";
import { AuthButton } from "./primitives/AuthButton";
import { RegisterProgress } from "./register/RegisterProgress";
import {
  AccountStep,
  ProfileStep,
  SecurityStep,
} from "./register/RegisterSteps";
import { useRegisterFlow } from "./register/useRegisterFlow";

export function RegisterForm() {
  const flow = useRegisterFlow();
  const { form } = flow;

  return (
    <form onSubmit={flow.submit} noValidate>
      <AuthFormTop
        left="Create account"
        right={
          <>
            Already with us?{" "}
            <Link href="/login" className="font-semibold text-accent">
              Sign in
            </Link>
          </>
        }
      />
      <AuthFormBody
        eyebrow="Create your account"
        title={flow.current.title}
        subtitle={flow.current.subtitle}
      >
        <RegisterProgress currentStep={flow.step} />

        {flow.step === 0 && (
          <AccountStep register={form.register} errors={form.formState.errors} />
        )}
        {flow.step === 1 && (
          <ProfileStep
            control={form.control}
            register={form.register}
            errors={form.formState.errors}
          />
        )}
        {flow.step === 2 && (
          <SecurityStep
            control={form.control}
            register={form.register}
            errors={form.formState.errors}
            showPassword={flow.showPassword}
            hasPassword={flow.hasPassword}
            onTogglePassword={flow.togglePassword}
            strength={flow.strength}
          />
        )}

        <div className={`mt-6 grid gap-3 ${flow.step > 0 ? "grid-cols-2" : "grid-cols-1"}`}>
          {flow.step > 0 && (
            <AuthButton type="button" variant="ghost" onClick={flow.back}>
              <ArrowLeft aria-hidden="true" size={16} /> Back
            </AuthButton>
          )}
          <AuthButton type="submit" disabled={flow.isPending}>
            {flow.step === 2
              ? flow.isPending ? "Creating…" : "Create account"
              : "Continue"}
            <ArrowRight aria-hidden="true" size={16} />
          </AuthButton>
        </div>
      </AuthFormBody>
    </form>
  );
}
