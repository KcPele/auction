"use client";

interface Props {
  /** "BIDNAIJA AI" or "SUPPORT AGENT" — matches MessageBubble labels. */
  label?: string;
}

/**
 * Three-dot typing indicator rendered as a left-aligned bubble while the
 * assistant or admin is composing a reply. Pure CSS animation, no library.
 */
export function TypingIndicator({ label = "BidNaija AI" }: Props) {
  return (
    <div className="my-2 flex w-full justify-start">
      <div className="max-w-[80%] rounded-2xl border border-accent/30 bg-accent/[0.08] px-3.5 py-2">
        <div className="mb-1 text-[10px] uppercase tracking-wider text-fg-dim">
          {label}
        </div>
        <div className="flex items-center gap-1 py-1">
          <Dot delay="0ms" />
          <Dot delay="180ms" />
          <Dot delay="360ms" />
        </div>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="support-typing-dot inline-block h-1.5 w-1.5 rounded-full bg-fg-muted"
      style={{ animationDelay: delay }}
    />
  );
}
