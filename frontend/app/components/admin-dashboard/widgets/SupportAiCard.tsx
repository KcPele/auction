"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useSupportSettings,
  useUpdateSupportSettings,
} from "@/app/components/support/hooks/use-support";

/**
 * Admin-only card on the Settings page for picking the OpenRouter model and
 * other support-AI knobs. Model is a free-form string so admins can paste any
 * slug from openrouter.ai.
 */
export function SupportAiCard() {
  const settings = useSupportSettings();
  const update = useUpdateSupportSettings();
  const [model, setModel] = useState("");
  const [temperature, setTemperature] = useState("0.2");
  const [maxOutputTokens, setMaxOutputTokens] = useState("800");
  const [enabled, setEnabled] = useState(true);
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    if (!settings.data) return;
    setModel(settings.data.model);
    setTemperature(String(settings.data.temperature));
    setMaxOutputTokens(String(settings.data.maxOutputTokens));
    setEnabled(settings.data.enabled);
    setPrompt(settings.data.systemPromptOverride ?? "");
  }, [settings.data]);

  const onSave = async () => {
    try {
      await update.mutateAsync({
        model,
        temperature: Number(temperature),
        maxOutputTokens: Number(maxOutputTokens),
        enabled,
        systemPromptOverride: prompt.trim() ? prompt : null,
      });
      toast.success("Support AI updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    }
  };

  return (
    <section className="rounded-xl border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="m-0 text-sm font-semibold text-fg">Support AI</h3>
          <p className="m-0 mt-0.5 text-[11px] text-fg-dim">
            Powered by OpenRouter — paste any model slug
            (e.g. <code>openai/gpt-4o-mini</code>).
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={update.isPending}
          className="rounded-md border border-accent bg-accent px-3 py-1.5 text-xs font-semibold text-[#0a0806] disabled:opacity-50"
        >
          {update.isPending ? "Saving…" : "Save"}
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-xs">
          <span className="mb-1 block text-fg-muted">Model</span>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="openai/gpt-4o-mini"
            className="w-full rounded-md border border-line bg-bg px-2.5 py-1.5 text-sm text-fg outline-none focus:border-accent"
          />
        </label>
        <label className="block text-xs">
          <span className="mb-1 block text-fg-muted">Temperature (0–2)</span>
          <input
            type="number"
            step="0.1"
            min={0}
            max={2}
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            className="w-full rounded-md border border-line bg-bg px-2.5 py-1.5 text-sm text-fg outline-none focus:border-accent"
          />
        </label>
        <label className="block text-xs">
          <span className="mb-1 block text-fg-muted">Max output tokens</span>
          <input
            type="number"
            min={64}
            max={4000}
            value={maxOutputTokens}
            onChange={(e) => setMaxOutputTokens(e.target.value)}
            className="w-full rounded-md border border-line bg-bg px-2.5 py-1.5 text-sm text-fg outline-none focus:border-accent"
          />
        </label>
        <label className="flex items-end gap-2 pb-1 text-xs">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-fg-muted">
            Enable AI replies (off = all conversations go straight to admins)
          </span>
        </label>
      </div>

      <details className="mt-3 text-xs">
        <summary className="cursor-pointer text-fg-muted">
          Custom system prompt (optional — leave blank to use the secure default)
        </summary>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={6}
          placeholder="Paste a custom system prompt only if you know what you're doing — the default is jailbreak-resistant."
          className="mt-2 w-full resize-y rounded-md border border-line bg-bg px-2.5 py-1.5 text-[12px] font-mono text-fg outline-none focus:border-accent"
        />
      </details>
    </section>
  );
}
