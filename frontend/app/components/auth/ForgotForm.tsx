"use client";
import Link from "next/link";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/app/lib/api/error";
import { requestPasswordReset } from "./api/auth.api";
import { AuthFormBody, AuthFormTop } from "./AuthFormBody";
import { AuthButton } from "./primitives/AuthButton";
import { Field, Input } from "./primitives/Field";
import { Icon } from "./primitives/Icon";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const send = useMutation({
    mutationFn: () =>
      requestPasswordReset({
        email: email.trim(),
        callbackURL:
          typeof window !== "undefined"
            ? `${window.location.origin}/reset`
            : "/reset",
      }),
    onSuccess: () => {
      setSent(true);
      toast.success("Reset link sent — check your email");
    },
    onError: (err) => {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Could not send reset link");
    },
  });

  return (
    <>
      <AuthFormTop
        left={
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-fg-muted"
          >
            <Icon name="chevron-l" size={14} /> Back to sign in
          </Link>
        }
      />
      <AuthFormBody
        eyebrow="Password reset"
        title="Forgot your password?"
        subtitle="Enter the email tied to your BidNaija account and we'll send a reset link valid for 30 minutes."
      >
        {sent ? (
          <div className="rounded-[10px] border border-green/30 bg-green/[0.06] p-4 text-sm text-fg-muted">
            We sent a reset link to <strong className="text-fg">{email}</strong>
            . Check your inbox (and spam folder).
          </div>
        ) : (
          <>
            <Field label="Email address">
              <Input
                type="email"
                placeholder="adaeze@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Icon name="mail" size={18} />}
              />
            </Field>

            <AuthButton
              type="button"
              disabled={!email || send.isPending}
              onClick={() => send.mutate()}
            >
              {send.isPending ? "Sending…" : "Send reset link"}{" "}
              <Icon name="arrow-r" size={16} strokeWidth={2} />
            </AuthButton>
          </>
        )}
      </AuthFormBody>
    </>
  );
}
