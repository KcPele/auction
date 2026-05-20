"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/app/lib/api/error";
import { resetPassword } from "./api/auth.api";
import { AuthFormBody, AuthFormTop } from "./AuthFormBody";
import { AuthButton } from "./primitives/AuthButton";
import { Field, Input } from "./primitives/Field";
import { Icon } from "./primitives/Icon";

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const match = password === confirm && password.length >= 8;

  const reset = useMutation({
    mutationFn: () => resetPassword({ token, newPassword: password }),
    onSuccess: () => {
      toast.success("Password reset — sign in to continue");
      router.replace("/login");
    },
    onError: (err) => {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Could not reset password");
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
        eyebrow="Set new password"
        title="Create new password."
        subtitle="Must be at least 8 characters with a mix of letters, numbers, and symbols."
      >
        {!token && (
          <div className="mb-3 rounded-[10px] border border-red/30 bg-red/[0.06] p-3 text-xs text-red">
            Reset link is missing the token. Request a new link from{" "}
            <Link href="/forgot" className="underline">
              forgot password
            </Link>
            .
          </div>
        )}

        <Field label="New password">
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Icon name="lock" size={18} />}
          />
        </Field>

        <Field label="Confirm password">
          <Input
            type="password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            leftIcon={<Icon name="lock" size={18} />}
          />
        </Field>

        <AuthButton
          type="button"
          disabled={!match || !token || reset.isPending}
          onClick={() => reset.mutate()}
        >
          {reset.isPending ? "Resetting…" : "Reset password"}{" "}
          <Icon name="arrow-r" size={16} strokeWidth={2} />
        </AuthButton>
      </AuthFormBody>
    </>
  );
}
