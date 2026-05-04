"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthFormBody, AuthFormTop } from "./AuthFormBody";
import { AuthButton } from "./primitives/AuthButton";
import { Field, Input } from "./primitives/Field";
import { Icon } from "./primitives/Icon";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const match = password === confirm && password.length >= 8;

  return (
    <>
      <AuthFormTop
        left={
          <Link href="/login" className="inline-flex items-center gap-1.5 text-fg-muted">
            <Icon name="chevron-l" size={14} /> Back to sign in
          </Link>
        }
      />
      <AuthFormBody
        eyebrow="Set new password"
        title="Create new password."
        subtitle="Must be at least 8 characters with a mix of letters, numbers, and symbols."
      >
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

        <AuthButton disabled={!match} onClick={() => {
          // Integration: POST /api/v1/auth/reset-password { password, token }
          router.push("/login");
        }}>
          Reset password <Icon name="arrow-r" size={16} strokeWidth={2} />
        </AuthButton>
      </AuthFormBody>
    </>
  );
}
