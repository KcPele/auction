"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { FAQS } from "./data";
import { Section } from "./Section";
import { SectionHead } from "./primitives/SectionHead";

export function FAQ() {
  const [open, setOpen] = useState<number>(0);

  return (
    <Section id="faq" className="bg-background">
      <SectionHead
        center
        kicker="Frequently asked questions"
        title="What to know before you bid or sell."
      />
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        {FAQS.slice(0, 6).map((item, index) => {
          const isOpen = open === index;
          return (
            <article key={item.q} className="overflow-hidden rounded-lg border border-border bg-surface">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-5 px-5 py-5 text-left font-semibold text-foreground md:px-6"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? -1 : index)}
              >
                {item.q}
                <ChevronDown className={`size-5 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
              <div className={`grid transition-[grid-template-rows] duration-200 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="min-h-0 overflow-hidden">
                  <p className="px-5 pb-5 text-sm leading-7 text-muted-foreground md:px-6 md:pb-6">{item.a}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
