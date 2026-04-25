"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthFormBody, AuthFormTop } from "./AuthFormBody";
import { usePasswordStrength } from "./hooks/usePasswordStrength";
import { AuthButton } from "./primitives/AuthButton";
import { Checkbox } from "./primitives/Checkbox";
import { Field, Input, PhoneInput } from "./primitives/Field";
import { Icon } from "./primitives/Icon";
import { NinVerifyField } from "./primitives/NinVerifyField";

export function RegisterForm() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [accept, setAccept] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [nin, setNin] = useState("");
  const [ninVerified, setNinVerified] = useState(false);
  const strength = usePasswordStrength(pw);

  return (
    <>
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
        eyebrow="Step 1 of 3"
        title="Open your bidder account."
        subtitle="Your phone and email are used to confirm every bid and release escrow."
      >
        <div className="mb-1.5 grid grid-cols-2 gap-3">
          <Field label="First name">
            <Input placeholder="Adaeze" defaultValue="Adaeze" />
          </Field>
          <Field label="Last name">
            <Input placeholder="Okafor" defaultValue="Okafor" />
          </Field>
        </div>

        <Field label="Email address" meta="We'll send a 6-digit code to verify.">
          <Input
            type="email"
            placeholder="adaeze@gmail.com"
            leftIcon={<Icon name="mail" size={18} />}
          />
        </Field>

        <Field label="Phone number">
          <PhoneInput placeholder="812 345 6789" />
        </Field>

        <Field
          label="Password"
          hint={pw ? <span className={strength.labelColor}>{strength.label}</span> : undefined}
        >
          <Input
            type={showPw ? "text" : "password"}
            placeholder="8+ characters"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
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
          hint="Optional · skip to verify later"
          meta="Type your 11-digit NIN and tap Verify, or skip and complete in Account → KYC."
          value={nin}
          onChange={setNin}
          onVerified={() => setNinVerified(true)}
        />

        <Field
          label="Referral code"
          hint="Optional"
          meta="Get ₦5,000 top-up credit on your first won auction."
        >
          <Input placeholder="BN-XXXX-XXXX" leftIcon={<Icon name="tag" size={18} />} />
        </Field>

        <Checkbox checked={accept} onChange={setAccept}>
          I agree to BidNaija&apos;s{" "}
          <a href="#" className="text-accent">Bidder Terms</a>,{" "}
          <a href="#" className="text-accent">escrow policy</a>, and consent to WhatsApp &amp;
          email alerts about my auctions.
        </Checkbox>

        <AuthButton
          disabled={!accept}
          onClick={() =>
            router.push(`/otp?ctx=register${ninVerified ? "&kyc=nin" : ""}`)
          }
        >
          Create account <Icon name="arrow-r" size={16} strokeWidth={2} />
        </AuthButton>

        {!ninVerified && (
          <p className="mt-2 text-center text-[11px] text-fg-dim">
            You can skip NIN now and verify later from your account settings.
          </p>
        )}
      </AuthFormBody>
    </>
  );
}
