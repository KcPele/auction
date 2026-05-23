"use client";
import { useState } from "react";
import { Icon } from "@/app/components/user-dashboard/primitives/Icon";

interface Props {
  onSend: (content: string) => Promise<void> | void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Auto-growing textarea with a Send button. Enter sends, Shift+Enter inserts
 * a newline. Image attachments are intentionally disabled for v1.
 */
export function Composer({ onSend, disabled, placeholder }: Props) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || busy || disabled) return;
    setBusy(true);
    try {
      await onSend(trimmed);
      setText("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-end gap-2 border-t border-line bg-bg px-3 py-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void send();
          }
        }}
        rows={1}
        placeholder={placeholder ?? "Type your message…"}
        disabled={disabled || busy}
        className="max-h-40 flex-1 resize-none rounded-xl border border-line bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-accent disabled:opacity-60"
        style={{ minHeight: 40 }}
      />
      <button
        type="button"
        onClick={() => void send()}
        disabled={disabled || busy || !text.trim()}
        className="flex h-10 items-center gap-1.5 rounded-xl border border-accent bg-accent px-3 text-sm font-semibold text-[#0a0806] disabled:opacity-50"
      >
        <Icon name="arrow-r" size={14} strokeWidth={2.5} />
        {busy ? "…" : "Send"}
      </button>
    </div>
  );
}
