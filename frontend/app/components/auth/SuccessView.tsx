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
        title="You're on the floor."
        subtitle="Your account is ready. Continue to the dashboard to finish any remaining verification steps before bidding or listing."
      >
        <div className="mx-auto mb-6 flex h-[88px] w-[88px] items-center justify-center rounded-full border-2 border-[rgba(78,168,92,0.3)] bg-[rgba(78,168,92,0.1)] text-green">
          <Icon name="check" size={44} strokeWidth={2.5} />
        </div>

        <div className="flex w-full max-w-[380px] flex-col gap-2.5">
          <AuthButton onClick={() => router.push("/dashboard")}>
            Start bidding <Icon name="arrow-r" size={16} strokeWidth={2} />
          </AuthButton>
          <AuthButton variant="ghost" onClick={() => router.push("/dashboard/wallet/topup")}>
            Top up wallet first
          </AuthButton>
        </div>
      </AuthFormBody>
    </>
  );
}
