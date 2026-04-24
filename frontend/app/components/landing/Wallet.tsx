import { Section } from "./Section";
import { SectionHead } from "./primitives/SectionHead";
import { fmtNaira } from "./utils";

const TOTAL = 2_485_000;
const HELD = 985_000;

const FLOW_ITEMS = [
  { icon: "+", title: "Hold on bid", desc: "You bid ₦4.8M on the Camry. ₦485,000 moves from available to held in a single transaction." },
  { icon: "↺", title: "Release on outbid", desc: "Someone outbids you. Your ₦485,000 hold returns to available — instantly, automatically." },
  { icon: "✓", title: "Applied on win", desc: "You win. Your hold stays locked and counts toward the final payment. You pay only the remainder." },
  { icon: "!", title: "Forfeit on no-pay", desc: "Miss the 24-hour payment window? Hold is forfeited per platform policy. Keeps everyone honest." },
];

export function Wallet() {
  const avail = TOTAL - HELD;
  const heldPct = (HELD / TOTAL) * 100;

  return (
    <Section>
      <SectionHead
        kicker="Wallet & hold system"
        title={
          <>
            Every bid is <em className="italic text-accent-2">real money.</em>
          </>
        }
        sub="Three numbers on your dashboard: total, held, available. When you bid, 10–20% moves from available to held — atomically, in a single database transaction."
      />

      <div className="grid items-center gap-15 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-lg border border-line-strong bg-[linear-gradient(165deg,var(--surface-2),var(--surface))] p-8">
          <div
            className="pointer-events-none absolute -right-[30%] -top-1/2 h-[400px] w-[400px]"
            style={{ background: "radial-gradient(circle, rgba(255,122,26,0.15), transparent 60%)" }}
          />
          <div className="relative mb-1.5 text-[11px] uppercase tracking-[0.12em] text-fg-dim">Total balance</div>
          <div className="relative mb-1.5 font-display text-[56px] font-semibold leading-none tracking-[-0.025em]">
            <span className="text-[30px] text-fg-dim">₦</span>
            {TOTAL.toLocaleString("en-NG")}
          </div>
          <div className="relative mb-7 text-[13px] text-fg-muted">4 active holds · Last top-up 2h ago via OPay</div>

          <div className="relative grid grid-cols-2 gap-4 rounded-md border border-line bg-black/35 p-5">
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-fg-dim">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" /> Held in bids
              </div>
              <div className="font-mono text-[22px] font-semibold tabular-nums text-fg">{fmtNaira(HELD)}</div>
            </div>
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-fg-dim">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green" /> Available
              </div>
              <div className="font-mono text-[22px] font-semibold tabular-nums text-fg">{fmtNaira(avail)}</div>
            </div>
          </div>

          <div className="relative mt-4 flex h-2 overflow-hidden rounded-full bg-white/5">
            <div className="h-full bg-accent" style={{ width: `${heldPct}%` }} />
            <div className="h-full bg-green" style={{ width: `${100 - heldPct}%` }} />
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          {FLOW_ITEMS.map((f) => (
            <div
              key={f.title}
              className="grid grid-cols-[40px_1fr] gap-4 rounded-md border border-line bg-surface p-[18px]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[rgba(255,122,26,0.1)] font-mono text-base font-bold text-accent">
                {f.icon}
              </div>
              <div>
                <div className="mb-1 text-sm font-semibold">{f.title}</div>
                <div className="text-[13px] leading-[1.5] text-fg-muted">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
