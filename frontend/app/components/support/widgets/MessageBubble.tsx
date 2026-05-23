"use client";
import ReactMarkdown from "react-markdown";
import type { SupportMessage } from "../types/support.types";

interface Props {
  message: SupportMessage;
  /**
   * When true the bubble is rendered from the admin's perspective — user
   * messages sit on the left, admin/AI messages on the right. From the user
   * perspective it's the inverse.
   */
  asAdmin?: boolean;
}

/**
 * Renders a single chat bubble. Assistant + admin messages render as
 * markdown so links/lists from the AI come out nicely; user/system messages
 * are plain text.
 */
export function MessageBubble({ message, asAdmin }: Props) {
  const isOwn =
    (asAdmin && (message.role === "ADMIN" || message.role === "AI")) ||
    (!asAdmin && message.role === "USER");
  const isSystem = message.role === "SYSTEM";

  if (isSystem) {
    return (
      <div className="my-2 text-center text-[11px] uppercase tracking-wider text-fg-dim">
        {message.content}
      </div>
    );
  }

  const align = isOwn ? "justify-end" : "justify-start";
  const tone =
    message.role === "AI"
      ? "bg-accent/[0.08] border-accent/30 text-fg"
      : message.role === "ADMIN"
        ? "bg-blue/[0.10] border-blue/30 text-fg"
        : "bg-surface border-line text-fg";
  const label =
    message.role === "AI"
      ? "BidNaija AI"
      : message.role === "ADMIN"
        ? "Support agent"
        : "You";

  return (
    <div className={`my-2 flex w-full ${align}`}>
      <div className={`max-w-[80%] rounded-2xl border px-3.5 py-2 ${tone}`}>
        <div className="mb-1 text-[10px] uppercase tracking-wider text-fg-dim">
          {label}
        </div>
        {message.role === "AI" || message.role === "ADMIN" ? (
          <div className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_li]:my-0">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        ) : (
          <div className="whitespace-pre-wrap text-[14px] leading-snug">
            {message.content}
          </div>
        )}
      </div>
    </div>
  );
}
