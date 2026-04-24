"use client";
import { useState } from "react";
import { Section } from "./Section";
import { SectionHead } from "./primitives/SectionHead";
import { BIDDER_STEPS, LISTER_STEPS } from "./data";
import type { HowFlow } from "./types";

export function HowItWorks() {
  const [flow, setFlow] = useState<HowFlow>("bidder");
  const steps = flow === "bidder" ? BIDDER_STEPS : LISTER_STEPS;

  const tabCls = (active: boolean) =>
    `flex items-center gap-2.5 rounded-md border px-4 py-3.5 text-left text-sm font-medium transition-all duration-200 ${
      active
        ? "border-line-strong bg-[rgba(255,122,26,0.08)] text-fg"
        : "border-transparent bg-transparent text-fg-muted hover:bg-[rgba(255,170,90,0.04)] hover:text-fg"
    }`;

  return (
    <Section id="how">
      <SectionHead
        kicker="How it works"
        title={
          <>
            Two flows. <em className="italic text-accent-2">Both simple.</em>
          </>
        }
        sub="Pick your side. Bidders fund their wallet and bid with skin in the game. Listers earn access and work with verified partners."
      />

      <div className="grid gap-15 md:grid-cols-[240px_1fr]">
        <div className="flex flex-col gap-2 self-start md:sticky md:top-24">
          <button className={tabCls(flow === "bidder")} onClick={() => setFlow("bidder")}>
            <span className={`font-mono text-[11px] ${flow === "bidder" ? "text-accent" : "text-fg-dim"}`}>01</span>
            <span>I want to bid</span>
          </button>
          <button className={tabCls(flow === "lister")} onClick={() => setFlow("lister")}>
            <span className={`font-mono text-[11px] ${flow === "lister" ? "text-accent" : "text-fg-dim"}`}>02</span>
            <span>I want to list</span>
          </button>
          <div className="mx-2 my-3 h-px bg-line" />
          <div className="px-4 text-xs leading-[1.55] text-fg-dim">
            Notifications are automatic.
            <br />
            Wallet holds are atomic.
            <br />
            Payments run through OPay.
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {steps.map((s, i) => (
            <div
              key={i}
              className="grid grid-cols-[60px_1fr] gap-6 rounded-lg border border-line bg-surface p-7 transition-colors duration-200 hover:border-line-strong"
            >
              <div className="font-display text-[42px] font-semibold leading-none tracking-[-0.02em] accent-gradient-text">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div>
                <h4 className="m-0 mb-2 text-lg font-semibold">{s.title}</h4>
                <p className="text-sm leading-[1.55] text-fg-muted">{s.desc}</p>
                <div className="mt-3.5 rounded-r-xs border-l-2 border-accent bg-black/30 px-3.5 py-3 font-mono text-[13px] text-fg-muted">
                  {s.detail}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
