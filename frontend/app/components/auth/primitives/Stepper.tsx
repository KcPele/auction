import { Fragment } from "react";
import { Icon } from "./Icon";

interface StepperProps {
  steps: string[];
  current: number;
}

export function Stepper({ steps, current }: StepperProps) {
  return (
    <div className="mb-7 flex items-center gap-0">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <Fragment key={s}>
            <div className="flex flex-1 items-center gap-2.5">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[1.5px] font-mono text-xs font-bold transition-all ${
                  done
                    ? "border-green bg-green text-[#0a0806]"
                    : active
                      ? "border-accent bg-accent text-[#0a0806] shadow-[0_0_0_4px_rgba(232,183,85,0.15)]"
                      : "border-line-strong bg-surface text-fg-dim"
                }`}
              >
                {done ? <Icon name="check" size={13} strokeWidth={2.5} /> : i + 1}
              </div>
              <div
                className={`text-xs font-medium ${
                  active ? "font-semibold text-fg" : done ? "text-fg-muted" : "text-fg-dim"
                }`}
              >
                {s}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`mx-2.5 h-[1.5px] flex-1 ${done ? "bg-green" : "bg-line"}`}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
