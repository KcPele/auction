import type { PlaceholderKind } from "./types";

interface PlaceholderProps {
  w?: number;
  h?: number;
  label?: string;
  aspect?: string;
  kind?: PlaceholderKind;
  tag?: string;
}

const BG =
  "repeating-linear-gradient(135deg, rgba(255,170,90,0.03) 0 20px, rgba(255,170,90,0.06) 20px 40px), linear-gradient(180deg, #3a2d1f, #231810)";

export function Placeholder({ w, h, label, aspect, kind = "photo", tag }: PlaceholderProps) {
  const style: React.CSSProperties = {
    background: BG,
    ...(aspect ? { aspectRatio: aspect } : { width: w, height: h }),
  };
  return (
    <div
      className="relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-md border border-line text-[rgba(255,200,140,0.35)]"
      style={style}
    >
      <svg className="w-8 h-8 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        {kind === "photo" && (
          <>
            <rect x="3" y="5" width="18" height="14" rx="1.5" />
            <circle cx="8.5" cy="10.5" r="1.5" />
            <path d="M3 17l5-5 4 4 3-3 6 6" />
          </>
        )}
        {kind === "car" && (
          <>
            <path d="M3 13l2-5a2 2 0 0 1 2-1.4h10a2 2 0 0 1 2 1.4l2 5" />
            <path d="M3 13v4h2l1-2h12l1 2h2v-4" />
            <circle cx="7" cy="15.5" r="1.3" fill="currentColor" />
            <circle cx="17" cy="15.5" r="1.3" fill="currentColor" />
          </>
        )}
        {kind === "gadget" && (
          <>
            <rect x="6" y="3" width="12" height="18" rx="2" />
            <circle cx="12" cy="18" r="0.8" fill="currentColor" />
          </>
        )}
      </svg>
      <div className="font-mono text-[11px] tracking-wider">{label || (w && h ? `${w} × ${h}` : "")}</div>
      {tag && (
        <div className="absolute top-2.5 right-2.5 rounded-xs border border-line bg-black/60 px-2 py-[3px] text-[10px] font-semibold uppercase tracking-wider text-fg">
          {tag}
        </div>
      )}
    </div>
  );
}
