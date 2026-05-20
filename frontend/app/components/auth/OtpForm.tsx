"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMe } from "@/app/components/auth/hooks/use-me";
import { ApiError } from "@/app/lib/api/error";
import { sendVerificationOtp, verifyEmailOtp } from "./api/auth.api";
import { AuthFormBody, AuthFormTop } from "./AuthFormBody";
import { useResendTimer } from "./hooks/useResendTimer";
import { AuthButton } from "./primitives/AuthButton";
import { Icon } from "./primitives/Icon";
import { OtpInput } from "./primitives/OtpInput";
import { Stepper } from "./primitives/Stepper";

export function OtpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const ctx = params.get("ctx") === "register" ? "register" : "login";

  const { data: me } = useMe();
  const queryEmail = params.get("email") ?? "";
  const email = queryEmail || me?.email || "";

  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const { isBlocked, label, reset } = useResendTimer(45);

  const send = useMutation({
    mutationFn: () => sendVerificationOtp(email),
    onSuccess: () => toast.success("Verification code sent"),
    onError: (err) => {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Could not send code");
    },
  });

  const verify = useMutation({
    mutationFn: (otp: string) => verifyEmailOtp({ email, otp }),
    onSuccess: () => {
      toast.success("Email verified");
      router.replace(ctx === "register" ? "/dashboard" : "/verified");
    },
    onError: (err) => {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Could not verify");
    },
  });

  // Auto-send on first mount when email is known.
  useEffect(() => {
    if (email && !send.data && !send.isPending) {
      send.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  const full = code.join("").length === 6;
  const backTo = ctx === "register" ? "/register" : "/login";

  return (
    <>
      <AuthFormTop
        left={
          <button
            onClick={() => router.push(backTo)}
            className="inline-flex items-center gap-1.5 text-fg-muted"
          >
            <Icon name="chevron-l" size={14} /> Back
          </button>
        }
        right={
          <>
            Wrong email?{" "}
            <button
              onClick={() => router.push(backTo)}
              className="font-semibold text-accent"
            >
              Change it
            </button>
          </>
        }
      />
      <AuthFormBody
        stepper={
          ctx === "register" ? (
            <Stepper steps={["Account", "Verify", "KYC"]} current={1} />
          ) : undefined
        }
        eyebrow="Verify your email"
        title="Enter the 6-digit code."
        subtitle={
          email ? (
            <>
              Sent to <strong className="text-fg">{email}</strong>.
            </>
          ) : (
            <span className="text-red">Email is missing — go back and try again.</span>
          )
        }
      >
        <OtpInput value={code} onChange={setCode} />

        <AuthButton
          type="button"
          disabled={!full || !email || verify.isPending}
          onClick={() => verify.mutate(code.join(""))}
        >
          {verify.isPending ? "Verifying…" : "Verify and continue"}{" "}
          <Icon name="arrow-r" size={16} strokeWidth={2} />
        </AuthButton>

        <div className="mt-4 text-center text-[13px] text-fg-muted">
          Didn&apos;t get it?{" "}
          <button
            disabled={isBlocked || send.isPending || !email}
            onClick={() => {
              send.mutate();
              reset();
            }}
            className="font-semibold text-accent disabled:cursor-not-allowed disabled:text-fg-dim"
          >
            {isBlocked ? `Resend in ${label}` : "Resend code"}
          </button>
        </div>

        <div className="mt-7 flex items-start gap-2.5 rounded-[10px] border border-[rgba(78,168,92,0.2)] bg-[rgba(78,168,92,0.06)] p-3.5 text-xs leading-[1.5] text-fg-muted">
          <div className="mt-px shrink-0 text-green">
            <Icon name="shield" size={16} />
          </div>
          <div>
            BidNaija will never ask for this code by phone or WhatsApp. Ignore
            anyone who does.
          </div>
        </div>
      </AuthFormBody>
    </>
  );
}
