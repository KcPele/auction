"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ApiError } from "@/app/lib/api/error";
import { AuthFormBody, AuthFormTop } from "./AuthFormBody";
import { useSignUp } from "./hooks/use-me";
import { usePasswordStrength } from "./hooks/usePasswordStrength";
import { AuthButton } from "./primitives/AuthButton";
import { Checkbox } from "./primitives/Checkbox";
import { Field, Input, PhoneInput } from "./primitives/Field";
import { Icon } from "./primitives/Icon";
import { NinVerifyField } from "./primitives/NinVerifyField";
import { signUpSchema, type SignUpForm } from "./utils/auth.schema";

export function RegisterForm() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [ninVerified, setNinVerified] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpForm>({
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

  const [pw, accept, nin] = useWatch({
    control,
    name: ["password", "accept", "nin"],
  });
  const strength = usePasswordStrength(pw ?? "");

  const { mutateAsync: signUp, isPending } = useSignUp();

  const onSubmit = handleSubmit(async (data) => {
    try {
      await signUp({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        appRole: data.appRole,
        nin: data.nin || undefined,
        referralCode: data.referralCode || undefined,
      });
      toast.success("Account created");
      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        // Surface field validation errors when backend sends them.
        if (err.isValidation && Array.isArray((err.details as { issues?: unknown[] })?.issues)) {
          for (const i of (err.details as { issues: { path: string[]; message: string }[] }).issues) {
            const field = i.path[0] as keyof SignUpForm | undefined;
            if (field) setError(field, { message: i.message });
          }
        }
        toast.error(err.message || "Could not create account");
      } else {
        toast.error("Network error. Try again.");
      }
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
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
        eyebrow="Step 1 of 2"
        title="Open your bidder account."
        subtitle="Your phone and email are used to confirm every bid and release escrow."
      >
        <div className="mb-1.5 grid grid-cols-2 gap-3">
          <Field label="First name" hint={errors.firstName?.message}>
            <Input placeholder="Adaeze" {...register("firstName")} />
          </Field>
          <Field label="Last name" hint={errors.lastName?.message}>
            <Input placeholder="Okafor" {...register("lastName")} />
          </Field>
        </div>

        <Field
          label="Email address"
          hint={errors.email?.message}
          meta="We'll use this for sign-in and account recovery."
        >
          <Input
            type="email"
            placeholder="adaeze@gmail.com"
            leftIcon={<Icon name="mail" size={18} />}
            {...register("email")}
          />
        </Field>

        <Field label="Phone number" hint={errors.phone?.message}>
          <Controller
            control={control}
            name="phone"
            render={({ field }) => (
              <PhoneInput placeholder="812 345 6789" {...field} />
            )}
          />
        </Field>

        <Field label="I am a" hint={errors.appRole?.message ?? "Select your role"}>
          <select
            {...register("appRole")}
            className="w-full rounded-[10px] border border-line-strong bg-surface px-3.5 py-3 text-[15px] text-fg outline-none transition-colors focus:border-accent focus:bg-surface-2"
          >
            <option value="INDIVIDUAL_BIDDER">Individual Bidder</option>
            <option value="CAR_DEALER">Car Dealer</option>
            <option value="MECHANIC">Mechanic</option>
          </select>
        </Field>

        <Field
          label="Password"
          hint={
            errors.password?.message ??
            (pw ? <span className={strength.labelColor}>{strength.label}</span> : undefined)
          }
        >
          <Input
            type={showPw ? "text" : "password"}
            placeholder="8+ characters"
            leftIcon={<Icon name="lock" size={18} />}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="rounded-md p-2 text-fg-muted hover:bg-surface-2 hover:text-fg"
              >
                <Icon name={showPw ? "x" : "check"} size={16} />
              </button>
            }
            {...register("password")}
          />
          <div className="mt-2 flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-[3px] flex-1 rounded-[3px] ${
                  i < strength.score ? strength.barClass : "bg-surface-2"
                }`}
              />
            ))}
          </div>
        </Field>

        <NinVerifyField
          label="NIN"
          hint={errors.nin?.message ?? "Optional · skip to verify later"}
          meta="Add your 11-digit NIN now, or skip and complete verification from Account → KYC."
          value={nin ?? ""}
          onChange={(v) => setValue("nin", v, { shouldValidate: true })}
          onVerified={() => setNinVerified(true)}
        />

        <Field
          label="Referral code"
          hint="Optional"
          meta="Enter a referral code if one was issued to you."
        >
          <Input
            placeholder="BN-XXXX-XXXX"
            leftIcon={<Icon name="tag" size={18} />}
            {...register("referralCode")}
          />
        </Field>

        <Controller
          control={control}
          name="accept"
          render={({ field }) => (
            <Checkbox
              checked={Boolean(field.value)}
              onChange={(v) => field.onChange(v)}
            >
              I agree to BidNaija&apos;s bidder terms, escrow policy, and consent to WhatsApp
              &amp; email alerts about my auctions.
            </Checkbox>
          )}
        />
        {errors.accept?.message && (
          <p className="mt-1 text-[11px] text-red-400">{errors.accept.message}</p>
        )}

        <AuthButton
          type="submit"
          disabled={!accept || isPending || isSubmitting}
        >
          {isPending ? "Creating…" : "Create account"}{" "}
          <Icon name="arrow-r" size={16} strokeWidth={2} />
        </AuthButton>

        {!ninVerified && (
          <p className="mt-2 text-center text-[11px] text-fg-dim">
            You can skip NIN now and verify later from your account settings.
          </p>
        )}
      </AuthFormBody>
    </form>
  );
}
