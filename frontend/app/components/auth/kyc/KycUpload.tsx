"use client";
import { useState } from "react";
import { AuthButton } from "../primitives/AuthButton";
import { Icon } from "../primitives/Icon";

interface KycUploadProps {
  onNext: () => void;
}

type IdType = "nin" | "dl" | "passport" | "voters";

const TYPES: { id: IdType; label: string }[] = [
  { id: "nin", label: "NIN slip" },
  { id: "dl", label: "Driver's licence" },
  { id: "passport", label: "Passport" },
  { id: "voters", label: "Voter's card" },
];

interface UploadTileProps {
  done: boolean;
  onToggle: () => void;
  label: string;
  hint: string;
}

function UploadTile({ done, onToggle, label, hint }: UploadTileProps) {
  return (
    <div
      onClick={onToggle}
      className={`mb-[18px] flex cursor-pointer flex-col items-center gap-2.5 rounded-[14px] border-[1.5px] p-6 text-center transition-colors ${
        done
          ? "border-green bg-[rgba(78,168,92,0.05)]"
          : "border-dashed border-line-strong bg-surface hover:border-accent hover:bg-surface-2"
      }`}
    >
      <div
        className={`flex h-[52px] w-[52px] items-center justify-center rounded-full ${
          done
            ? "bg-[rgba(78,168,92,0.15)] text-green"
            : "bg-[rgba(232,183,85,0.1)] text-accent"
        }`}
      >
        <Icon name={done ? "check" : "image"} size={22} strokeWidth={done ? 2.5 : 1.6} />
      </div>
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-xs text-fg-muted">{hint}</div>
    </div>
  );
}

export function KycUpload({ onNext }: KycUploadProps) {
  const [idType, setIdType] = useState<IdType>("nin");
  const [front, setFront] = useState(false);
  const [back, setBack] = useState(false);
  const needBack = idType !== "passport";
  const ready = front && (!needBack || back);

  return (
    <>
      <h1 className="m-0 mb-2 font-display text-4xl font-semibold leading-[1.1] tracking-[-0.025em]">
        Upload a government ID.
      </h1>
      <p className="m-0 mb-6 max-w-[380px] text-sm text-fg-muted">
        Pick one. Clear, full-document photo. PDF or image up to 8 MB.
      </p>

      <div className="mb-5 flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => setIdType(t.id)}
            className={`rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors ${
              idType === t.id
                ? "border-line-strong bg-[rgba(232,183,85,0.12)] text-accent"
                : "border-line bg-surface text-fg-muted hover:text-fg"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <UploadTile
        done={front}
        onToggle={() => setFront(!front)}
        label={front ? "Front — uploaded ✓" : "Upload front of ID"}
        hint={front ? "NIN-front.jpg · 1.2 MB" : "Drop here or tap to choose · max 8 MB"}
      />

      {needBack && (
        <UploadTile
          done={back}
          onToggle={() => setBack(!back)}
          label={back ? "Back — uploaded ✓" : "Upload back of ID"}
          hint={back ? "NIN-back.jpg · 980 KB" : "Drop here or tap to choose"}
        />
      )}

      <AuthButton disabled={!ready} onClick={onNext}>
        Continue to selfie <Icon name="arrow-r" size={16} strokeWidth={2} />
      </AuthButton>
    </>
  );
}
