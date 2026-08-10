"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Tag } from "lucide-react";
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
import { signUpSchema, type SignUpForm } from "./utils/auth.schema";

export function RegisterForm() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);

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
        eyebrow="Create your account"
        title="Start bidding securely."
        subtitle="Set up your profile now. Identity verification can be completed from your dashboard."
      >
        <div className="mb-1.5 grid grid-cols-2 gap-3">
          <Field htmlFor="register-first-name" label="First name" hint={errors.firstName?.message}>
            <Input autoComplete="given-name" id="register-first-name" placeholder="Adaeze" {...register("firstName")} />
          </Field>
          <Field htmlFor="register-last-name" label="Last name" hint={errors.lastName?.message}>
            <Input autoComplete="family-name" id="register-last-name" placeholder="Okafor" {...register("lastName")} />
          </Field>
        </div>

        <Field
          htmlFor="register-email"
          label="Email address"
          hint={errors.email?.message}
          meta="We'll use this for sign-in and account recovery."
        >
          <Input
            autoComplete="email"
            id="register-email"
            type="email"
            placeholder="you@example.com"
            leftIcon={<Mail aria-hidden="true" size={18} />}
            {...register("email")}
          />
        </Field>

        <Field htmlFor="register-phone" label="Phone number" hint={errors.phone?.message}>
          <Controller
            control={control}
            name="phone"
            render={({ field }) => (
              <PhoneInput autoComplete="tel-national" id="register-phone" placeholder="812 345 6789" {...field} />
            )}
          />
        </Field>

        <Field htmlFor="register-role" label="Account type" hint={errors.appRole?.message}>
          <select
            id="register-role"
            {...register("appRole")}
            className="w-full rounded-lg border border-border-strong bg-surface px-3.5 py-3 text-base text-foreground outline-none transition-colors focus:border-primary focus:bg-surface-subtle"
          >
            <option value="INDIVIDUAL_BIDDER">Individual Bidder</option>
            <option value="CAR_DEALER">Car Dealer</option>
            <option value="MECHANIC">Mechanic</option>
          </select>
        </Field>

        <Field
          htmlFor="register-password"
          label="Password"
          hint={
            errors.password?.message ??
            (pw ? <span className={strength.labelColor}>{strength.label}</span> : undefined)
          }
        >
          <Input
            autoComplete="new-password"
            id="register-password"
            type={showPw ? "text" : "password"}
            placeholder="8+ characters"
            leftIcon={<LockKeyhole aria-hidden="true" size={18} />}
            rightSlot={
              <button
                aria-label={showPw ? "Hide password" : "Show password"}
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="rounded-md p-2 text-muted-foreground hover:bg-surface-subtle hover:text-foreground"
              >
                {showPw ? <EyeOff aria-hidden="true" size={16} /> : <Eye aria-hidden="true" size={16} />}
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

        <Field
          htmlFor="register-nin"
          label="NIN"
          hint={errors.nin?.message ?? "Optional"}
          meta="You can add your 11-digit NIN now or verify later from account settings."
        >
          <Input
            id="register-nin"
            inputMode="numeric"
            leftIcon={<ShieldCheck aria-hidden="true" size={18} />}
            maxLength={11}
            onChange={(event) => setValue("nin", event.target.value.replace(/\D/g, ""), { shouldValidate: true })}
            placeholder="12345678901"
            value={nin ?? ""}
          />
        </Field>

        <Field
          htmlFor="register-referral"
          label="Referral code"
          hint="Optional"
          meta="Enter a referral code if one was issued to you."
        >
          <Input
            id="register-referral"
            placeholder="BN-XXXX-XXXX"
            leftIcon={<Tag aria-hidden="true" size={18} />}
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
          <p className="mt-1 text-xs text-danger">{errors.accept.message}</p>
        )}

        <AuthButton
          type="submit"
          disabled={!accept || isPending || isSubmitting}
        >
          {isPending ? "Creating…" : "Create account"}{" "}
          <ArrowRight aria-hidden="true" size={16} strokeWidth={2} />
        </AuthButton>
      </AuthFormBody>
    </form>
  );
}
