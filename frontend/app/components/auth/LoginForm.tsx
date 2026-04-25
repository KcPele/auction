"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthFormBody, AuthFormTop } from "./AuthFormBody";
import { AuthButton } from "./primitives/AuthButton";
import { Checkbox } from "./primitives/Checkbox";
import { Field, Input, PhoneInput } from "./primitives/Field";
import { Icon } from "./primitives/Icon";

type Method = "email" | "phone";

export function LoginForm() {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("email");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);

  const methodTab = (m: Method, label: string) => (
    <button
      key={m}
      onClick={() => setMethod(m)}
      className={`rounded-md px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition-colors ${
        method === m
          ? "bg-[rgba(232,183,85,0.12)] text-accent"
          : "text-fg-muted hover:text-fg"
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
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
        <div className="mb-5 inline-flex w-fit gap-1 rounded-lg border border-line bg-surface p-[3px]">
          {methodTab("email", "Email")}
          {methodTab("phone", "Phone")}
        </div>

        <Field label={method === "email" ? "Email address" : "Phone number"}>
          {method === "email" ? (
            <Input
              type="email"
              placeholder="adaeze@gmail.com"
              defaultValue="adaeze.okafor@gmail.com"
              leftIcon={<Icon name="mail" size={18} />}
            />
          ) : (
            <PhoneInput placeholder="812 345 6789" defaultValue="812 345 6789" />
          )}
        </Field>

        <Field
          label="Password"
          hint={
            <Link href="/forgot" className="text-xs text-accent">
              Forgot?
            </Link>
          }
        >
          <Input
            type={showPw ? "text" : "password"}
            defaultValue="passwordxx"
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
        </Field>

        <Checkbox checked={remember} onChange={setRemember}>
          Keep me signed in on this device for 30 days
        </Checkbox>

        <AuthButton onClick={() => router.push("/otp?ctx=login")}>
          Continue <Icon name="arrow-r" size={16} strokeWidth={2} />
        </AuthButton>

        <div className="mt-6 text-center text-xs text-fg-dim">
          By signing in you agree to our{" "}
          <a className="text-fg-muted hover:text-fg" href="#">Terms</a> and{" "}
          <a className="text-fg-muted hover:text-fg" href="#">Privacy Policy</a>.
        </div>
      </AuthFormBody>
    </>
  );
}
