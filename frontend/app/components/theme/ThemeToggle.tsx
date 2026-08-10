"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { themeOptions, type ThemeOption } from "./theme-options";

const icons = {
  light: Sun,
  dark: Moon,
  system: Laptop,
} as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const activeTheme = mounted && theme ? theme : "system";

  return (
    <div
      aria-label="Color theme"
      className="inline-flex rounded-lg border border-border bg-surface p-1 shadow-sm"
      role="group"
    >
      {themeOptions.map((option) => {
        const Icon = icons[option.value];
        const active = activeTheme === option.value;

        return (
          <button
            key={option.value}
            aria-label={`Use ${option.label.toLowerCase()} theme`}
            aria-pressed={active}
            className={`inline-flex size-8 items-center justify-center rounded-md transition-colors ${
              active
                ? "bg-primary-soft text-primary"
                : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground"
            }`}
            onClick={() => setTheme(option.value satisfies ThemeOption)}
            type="button"
          >
            <Icon aria-hidden="true" size={16} strokeWidth={1.8} />
          </button>
        );
      })}
    </div>
  );
}
