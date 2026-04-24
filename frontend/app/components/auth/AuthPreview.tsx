import { Icon } from "./primitives/Icon";

const TICKS = [
  { user: "@tosin_x", delta: "+₦100k", ago: "2m ago" },
  { user: "@ahmad_b", delta: "+₦50k", ago: "6m ago" },
  { user: "@kemi.o", delta: "+₦75k", ago: "11m ago" },
];

export function AuthPreview() {
  return (
    <div className="relative z-[2] mt-10 max-w-[420px] rounded-[18px] border border-line-strong bg-surface/60 p-5 backdrop-blur-md">
      <div className="mb-3.5 flex items-center gap-3.5">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-[rgba(255,200,140,0.3)]"
          style={{
            background:
              "repeating-linear-gradient(135deg, rgba(255,170,90,0.04) 0 10px, rgba(255,170,90,0.08) 10px 20px), linear-gradient(180deg, #3a2d1f, #231810)",
          }}
        >
          <Icon name="car" size={28} />
        </div>
        <div className="flex-1">
          <div className="mb-0.5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-red">
            <span className="inline-block h-[7px] w-[7px] animate-[pulseDot_1.6s_infinite] rounded-full bg-red" />
            Live · 00:14:27
          </div>
          <div className="text-[15px] font-semibold">2019 Toyota Camry SE</div>
          <div className="text-xs text-fg-muted">68k km · Lekki, Lagos · 23 bids</div>
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-3 border-y border-line py-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.1em] text-fg-dim">Top bid</div>
          <div className="font-mono text-[22px] font-bold tabular-nums accent-gradient-text">
            ₦12,800,000
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.1em] text-fg-dim">Held</div>
          <div className="font-mono text-[13px] tabular-nums text-fg">10% / ₦1,280,000</div>
        </div>
      </div>

      <div className="mt-3.5 font-mono text-[11px] text-fg-muted">
        {TICKS.map((t, i) => (
          <div
            key={t.user}
            className={`flex justify-between py-1 ${i < TICKS.length - 1 ? "border-b border-dashed border-line" : ""}`}
          >
            <span>
              {t.user} · {t.delta}
            </span>
            <span className="text-green">{t.ago}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
