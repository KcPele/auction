"use client";
import { useState } from "react";
import { Section } from "./Section";
import { SectionHead } from "./primitives/SectionHead";
import { FAQS } from "./data";

export function FAQ() {
  const [open, setOpen] = useState<number>(0);
  return (
    <Section id="faq">
      <SectionHead
        center
        kicker="FAQ"
        title={
          <>
            Straight <em className="italic text-accent-2">answers.</em>
          </>
        }
      />
      <div className="mx-auto flex max-w-[860px] flex-col gap-2">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="overflow-hidden rounded-md border border-line bg-surface">
              <button
                className="flex w-full cursor-pointer items-center justify-between gap-5 px-6 py-[22px] text-left font-medium text-[17px] hover:text-accent-2"
                onClick={() => setOpen(isOpen ? -1 : i)}
              >
                <span>{f.q}</span>
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[rgba(255,122,26,0.08)] text-sm text-accent transition-transform duration-[250ms] ${
                    isOpen ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </button>
              <div
                className={`grid overflow-hidden text-[15px] leading-[1.6] text-fg-muted transition-all duration-300 ${
                  isOpen ? "grid-rows-[1fr] pb-[22px]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="min-h-0 px-6">{f.a}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
