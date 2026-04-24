"use client";
import { useRouter } from "next/navigation";
import { AuthFormBody, AuthFormTop } from "./AuthFormBody";
import { AuthButton } from "./primitives/AuthButton";
import { Icon } from "./primitives/Icon";

export function SuccessView() {
  const router = useRouter();
  return (
    <>
      <AuthFormTop left="All set" />
      <AuthFormBody
        centered
        eyebrow="Account verified"
        title="You're on the floor, Adaeze."
        subtitle="Your BVN and ID check cleared instantly. Your first Ready-to-Bid code has been emailed — use it to unlock any live auction."
      >
        <div className="mx-auto mb-6 flex h-[88px] w-[88px] items-center justify-center rounded-full border-2 border-[rgba(78,168,92,0.3)] bg-[rgba(78,168,92,0.1)] text-green">
          <Icon name="check" size={44} strokeWidth={2.5} />
        </div>

        <div className="mb-6 w-full max-w-[380px] rounded-xl border border-line-strong bg-surface p-4 text-left">
          <div className="text-[10px] uppercase tracking-[0.12em] text-fg-dim">
            Ready-to-bid access code
          </div>
          <div className="my-1 font-mono text-[26px] font-bold tracking-[0.12em] accent-gradient-text">
            BN-47K9-XQ2M
          </div>
          <div className="text-xs text-fg-muted">
            Active until 30 Apr 2026 · 8 auction unlocks
          </div>
        </div>

        <div className="flex w-full max-w-[380px] flex-col gap-2.5">
          <AuthButton onClick={() => router.push("/")}>
            Start bidding <Icon name="arrow-r" size={16} strokeWidth={2} />
          </AuthButton>
          <AuthButton variant="ghost" onClick={() => router.push("/")}>
            Top up wallet first
          </AuthButton>
        </div>
      </AuthFormBody>
    </>
  );
}
