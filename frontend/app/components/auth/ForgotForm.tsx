"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthFormBody, AuthFormTop } from "./AuthFormBody";
import { AuthButton } from "./primitives/AuthButton";
import { Field, Input } from "./primitives/Field";
import { Icon } from "./primitives/Icon";

export function ForgotForm() {
  const router = useRouter();
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
        eyebrow="Password reset"
        title="Forgot your password?"
        subtitle="Enter the email tied to your BidNaija account and we'll send a reset link valid for 30 minutes."
      >
        <Field label="Email address">
          <Input
            type="email"
            placeholder="adaeze@gmail.com"
            defaultValue="adaeze@gmail.com"
            leftIcon={<Icon name="mail" size={18} />}
          />
        </Field>

        <AuthButton onClick={() => router.push("/login")}>
          Send reset link <Icon name="arrow-r" size={16} strokeWidth={2} />
        </AuthButton>

        <div className="mt-6 text-center text-xs text-fg-dim">
          Still stuck? WhatsApp us at{" "}
          <a href="#" className="text-fg-muted hover:text-fg">+234 700 BIDNJA</a>.
        </div>
      </AuthFormBody>
    </>
  );
}
