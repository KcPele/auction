"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ApiError } from "@/app/lib/api/error";
import { getMe } from "./api/auth.api";
import { AuthFormBody, AuthFormTop } from "./AuthFormBody";
import { useSignIn } from "./hooks/use-me";
import { AuthButton } from "./primitives/AuthButton";
import { Checkbox } from "./primitives/Checkbox";
import { Field, Input } from "./primitives/Field";
import { Icon } from "./primitives/Icon";
import { signInSchema, type SignInForm } from "./utils/auth.schema";

export function LoginForm() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", remember: true },
    mode: "onTouched",
  });

  const { mutateAsync: signIn, isPending } = useSignIn();

  const onSubmit = handleSubmit(async (data) => {
    try {
      await signIn({ email: data.email, password: data.password });
      const me = await getMe();
      toast.success("Welcome back");
      router.replace(me.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401 || err.code === "INVALID_EMAIL_OR_PASSWORD") {
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
        eyebrow="Sign in"
        title="Place your next bid."
        subtitle="Enter your credentials to get back into the auction floor."
      >
        <Field label="Email address" hint={errors.email?.message}>
          <Input
            type="email"
            placeholder="adaeze@gmail.com"
            leftIcon={<Icon name="mail" size={18} />}
            {...register("email")}
          />
        </Field>

        <Field
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
            type={showPw ? "text" : "password"}
            placeholder="Your password"
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
          {isPending ? "Signing in…" : "Continue"}{" "}
          <Icon name="arrow-r" size={16} strokeWidth={2} />
        </AuthButton>

        <div className="mt-6 text-center text-xs text-fg-dim">
          By signing in you agree to BidNaija&apos;s bidder terms and privacy policy.
        </div>
      </AuthFormBody>
    </form>
  );
}
