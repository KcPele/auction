"use client";
import { useState } from "react";
import { AuthButton } from "../primitives/AuthButton";
import { Icon } from "../primitives/Icon";

interface KycSelfieProps {
  onNext: () => void;
}

export function KycSelfie({ onNext }: KycSelfieProps) {
  const [captured, setCaptured] = useState(false);

  return (
    <>
      <h1 className="m-0 mb-2 font-display text-4xl font-semibold leading-[1.1] tracking-[-0.025em]">
        One quick selfie.
      </h1>
      <p className="m-0 mb-6 max-w-[380px] text-sm text-fg-muted">
        Center your face in the frame. We compare it with your ID to confirm it&apos;s really you.
        No makeup bans, no strict lighting — just keep it clear.
      </p>

      <div
        className="relative mx-auto mb-5 flex aspect-[4/5] w-full max-w-[280px] items-center justify-center overflow-hidden rounded-[20px] border-[1.5px] border-line-strong before:absolute before:left-3.5 before:top-3.5 before:h-10 before:w-10 before:rounded-tl-xl before:border-l-2 before:border-t-2 before:border-accent before:content-[''] after:absolute after:bottom-3.5 after:right-3.5 after:h-10 after:w-10 after:rounded-br-xl after:border-b-2 after:border-r-2 after:border-accent after:content-['']"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(232,183,85,0.08), transparent 70%), linear-gradient(180deg, var(--surface-2), var(--surface))",
        }}
      >
        {captured ? (
          <div className="text-center text-green">
            <Icon name="check-c" size={56} />
            <div className="mt-2.5 text-sm font-semibold">Match confirmed</div>
            <div className="font-mono text-[11px] text-fg-muted">Score: 96.4%</div>
          </div>
        ) : (
          <div
            className="h-[140px] w-[110px] rounded-[50%_50%_45%_45%] border-[1.5px] border-dashed border-[rgba(232,183,85,0.4)]"
            style={{
              background: "linear-gradient(180deg, rgba(232,183,85,0.18), rgba(232,183,85,0.05))",
            }}
          />
        )}
      </div>

      {!captured ? (
        <AuthButton onClick={() => setCaptured(true)}>
          <Icon name="image" size={16} /> Capture selfie
        </AuthButton>
      ) : (
        <AuthButton onClick={onNext}>
          Finish verification <Icon name="check" size={16} strokeWidth={2.5} />
        </AuthButton>
      )}

      <div className="mt-3.5 text-center text-xs text-fg-dim">
        Takes ~10 seconds · reviewed instantly by our KYC provider
      </div>
    </>
  );
}
