import { Section } from "./Section";

const CHECKS = [
  { title: "Your hold counts toward the total", desc: "If your hold was ₦485,000 and your winning bid is ₦4.85M, you pay ₦4,365,000. Not a naira more." },
  { title: "OPay webhook confirms and settles", desc: "Signature-verified server-side. The moment payment clears, the seller is notified and delivery is arranged." },
  { title: "Auto-reminders at 12h, 4h, and 1h", desc: "Email and WhatsApp nudges so you don't accidentally lose your hold. We'd rather you finish the payment." },
];

export function Payments() {
  return (
    <Section>
      <div className="grid items-center gap-15 md:grid-cols-2">
        <div>
          <div
            className="relative mx-auto flex aspect-square max-w-[420px] items-center justify-center rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, var(--accent-light) 0%, var(--accent) 25%, transparent 25%), radial-gradient(circle, var(--surface) 55%, transparent 56%)",
            }}
          >
            <div className="flex h-3/4 w-3/4 flex-col items-center justify-center rounded-full border border-line-strong bg-surface p-5 text-center">
              <div className="font-display text-[88px] font-semibold leading-none tracking-[-0.04em] accent-gradient-text">
                24
              </div>
              <div className="mt-1 text-sm uppercase tracking-[0.15em] text-fg-muted">Hours to pay</div>
            </div>
          </div>
        </div>
        <div>
          <div className="mb-3.5 text-xs font-bold uppercase tracking-[0.14em] text-accent">
            Payments · 24-hour window
          </div>
          <h2 className="m-0 mb-[18px] font-display text-[clamp(36px,4vw,56px)] font-semibold leading-[1.02] tracking-[-0.025em] text-fg">
            You win it.
            <br />
            You pay it. <em className="italic accent-gradient-text">In a day.</em>
          </h2>
          <p className="text-[17px] leading-[1.55] text-fg-muted">
            The second an auction closes, a 24-hour timer starts. Finish the payment via OPay and your win is settled. Miss it? The hold is forfeited and the item falls to the second-highest bidder — or we re-list it.
          </p>
          <div className="mt-6 flex flex-col gap-4">
            {CHECKS.map((c) => (
              <div key={c.title} className="flex items-start gap-3.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(78,168,92,0.15)] font-bold text-green">
                  ✓
                </div>
                <div>
                  <div className="mb-0.5 font-semibold">{c.title}</div>
                  <div className="text-sm text-fg-muted">{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
