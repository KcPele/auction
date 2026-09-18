"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ApiError } from "@/app/lib/api/error";
import { getMe } from "./api/auth.api";
import { AuthFormBody, AuthFormTop } from "./AuthFormBody";
import { usePhoneSignIn, useSignIn } from "./hooks/use-me";
import { AuthButton } from "./primitives/AuthButton";
import { Checkbox } from "./primitives/Checkbox";
import { Field, Input, PhoneInput } from "./primitives/Field";
import { signInSchema, type SignInForm } from "./utils/auth.schema";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [showPw, setShowPw] = useState(false);
  const [method, setMethod] = useState<"email" | "phone">("email");
  const requestedNext = params.get("next");
  const nextPath =
    requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : null;

  const {
    clearErrors,
    control,
    handleSubmit,
    register,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      method: "email",
      email: params.get("email") ?? "",
      phone: "",
      password: "",
      remember: true,
    },
    mode: "onTouched",
  });

  const { mutateAsync: signIn, isPending: isEmailPending } = useSignIn();
  const { mutateAsync: signInWithPhone, isPending: isPhonePending } =
    usePhoneSignIn();
  const isPending = isEmailPending || isPhonePending;

  const selectMethod = (nextMethod: "email" | "phone") => {
    setMethod(nextMethod);
    setValue("method", nextMethod, { shouldValidate: false });
    clearErrors(["email", "phone"]);
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (data.method === "phone") {
        await signInWithPhone({
          phone: data.phone,
          password: data.password,
          rememberMe: Boolean(data.remember),
        });
      } else {
        await signIn({
          email: data.email,
          password: data.password,
          rememberMe: Boolean(data.remember),
        });
      }
      const me = await getMe();
      toast.success("Welcome back");
      const roleSafeNext =
        me.role === "ADMIN"
          ? nextPath?.startsWith("/admin")
            ? nextPath
            : "/admin"
          : nextPath?.startsWith("/admin")
            ? "/dashboard"
            : (nextPath ?? "/dashboard");
      if (data.method === "phone") {
        window.location.assign(roleSafeNext);
      } else {
        router.replace(roleSafeNext);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (
          data.method === "email" &&
          err.status === 403 &&
          err.code === "EMAIL_NOT_VERIFIED"
        ) {
          const query = new URLSearchParams({
            ctx: "login",
            email: data.email,
            next: nextPath ?? "/dashboard",
          });
          toast.error("Verify your email to continue");
          router.push(`/otp?${query.toString()}`);
        } else if (
          err.status === 401 ||
          err.code === "INVALID_EMAIL_OR_PASSWORD"
        ) {
          toast.error("Invalid email or password");
        } else {
          toast.error(err.message || "Could not sign in");
        }
      } else {
        toast.error("Network error. Try again.");
      }
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <AuthFormTop
        left="Welcome back"
        right={
          <>
            New here?{" "}
            <Link href="/register" className="font-semibold text-accent">
              Create an account
            </Link>
          </>
        }
      />
      <AuthFormBody
        eyebrow="Secure sign in"
        title="Welcome back."
        subtitle="Sign in to manage your bids, payments, and listings."
      >
        {params.get("verified") === "1" && (
          <div className="mb-5 rounded-lg border border-success/30 bg-success-soft px-3.5 py-3 text-sm text-success">
            Email verified. Sign in to continue.
          </div>
        )}
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            className="text-xs font-semibold text-accent hover:text-accent-hover"
            onClick={() =>
              selectMethod(method === "email" ? "phone" : "email")
            }
          >
            {method === "email" ? "Use phone number" : "Use email address"}
          </button>
        </div>

        {method === "email" ? (
          <Field
            htmlFor="login-email"
            label="Email address"
            hint={errors.email?.message}
          >
            <Input
              autoComplete="email"
              id="login-email"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail aria-hidden="true" size={18} />}
              {...register("email")}
            />
          </Field>
        ) : (
          <Field
            htmlFor="login-phone"
            label="Phone number"
            hint={errors.phone?.message}
          >
            <PhoneInput
              autoComplete="tel-national"
              id="login-phone"
              placeholder="812 345 6789"
              {...register("phone")}
            />
          </Field>
        )}

        <Field
          htmlFor="login-password"
          label="Password"
          hint={
            errors.password?.message ?? (
              <Link href="/forgot" className="text-xs text-accent">
                Forgot?
              </Link>
            )
          }
        >
          <Input
            autoComplete="current-password"
            id="login-password"
            type={showPw ? "text" : "password"}
            placeholder="Your password"
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
        </Field>

        <Controller
          control={control}
          name="remember"
          render={({ field }) => (
            <Checkbox
              checked={Boolean(field.value)}
              onChange={(v) => field.onChange(v)}
            >
              Keep me signed in on this device for 30 days
            </Checkbox>
          )}
        />

        <AuthButton type="submit" disabled={isPending || isSubmitting}>
          {isPending ? "Signing in…" : "Sign in"}{" "}
          <ArrowRight aria-hidden="true" size={16} strokeWidth={2} />
        </AuthButton>

        <div className="mt-6 text-center text-xs text-subtle-foreground">
          By signing in you agree to BidNaija&apos;s bidder terms and privacy policy.
        </div>
      </AuthFormBody>
    </form>
  );
}
