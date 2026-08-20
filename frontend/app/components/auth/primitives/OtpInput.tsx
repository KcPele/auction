"use client";
import type { ChangeEvent } from "react";

interface OtpInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  length?: number;
}

export function OtpInput({ value, onChange, length = 6 }: OtpInputProps) {
  const code = value.join("");

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, length);
    onChange(Array.from({ length }, (_, index) => digits[index] ?? ""));
  };

  return (
    <input
      aria-label="Verification code"
      autoComplete="one-time-code"
      autoFocus
      className="otp-code-input my-2 mb-6 h-14 w-full rounded-xl border border-border-strong bg-surface px-4 text-center font-mono text-2xl font-semibold text-foreground outline-none transition-colors placeholder:text-subtle-foreground focus:border-primary focus:bg-surface-subtle"
      inputMode="numeric"
      maxLength={length}
      onChange={handleChange}
      pattern="[0-9]*"
      placeholder="000000"
      value={code}
    />
  );
}
