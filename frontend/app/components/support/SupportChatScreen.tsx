"use client";
import { useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ApiError } from "@/app/lib/api/error";
import { Composer } from "./widgets/Composer";
import { MessageBubble } from "./widgets/MessageBubble";
import { TypingIndicator } from "./widgets/TypingIndicator";
import {
  useConversationMessages,
  useCreateConversation,
  useMarkRead,
  useMyConversations,
  usePostMessage,
  useSupportStream,
} from "./hooks/use-support";
import type { SupportState } from "./types/support.types";

function stateBadge(state: SupportState) {
  switch (state) {
    case "AI_ACTIVE":
      return { text: "AI ACTIVE", cls: "border-accent/30 bg-accent/[0.1] text-accent" };
    case "WAITING_ADMIN":
      return {
        text: "WAITING FOR HUMAN",
        cls: "border-orange/30 bg-orange/10 text-orange",
      };
    case "ADMIN_ACTIVE":
      return { text: "AGENT ONLINE", cls: "border-blue/30 bg-blue/10 text-blue" };
    case "RESOLVED":
      return { text: "RESOLVED", cls: "border-green/30 bg-green/10 text-green" };
  }
}

export function SupportChatScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const activeId = params.get("c");

  const conversations = useMyConversations();
  const messagesQuery = useConversationMessages(activeId);
  const createConv = useCreateConversation();
  const postMsg = usePostMessage(activeId ?? "");
  const markRead = useMarkRead();
  useSupportStream(activeId);

  const list = useMemo(() => conversations.data ?? [], [conversations.data]);
  const active = useMemo(
    () => list.find((c) => c.id === activeId) ?? null,
    [list, activeId],
  );

  // Mark read when opened.
  useEffect(() => {
    if (activeId) markRead.mutate(activeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // Auto-create the first conversation if the user has none yet.
  useEffect(() => {
    if (!activeId && conversations.isSuccess && list.length === 0) {
      void createConv.mutateAsync(undefined).then((c) => {
        router.replace(`/dashboard/support?c=${c.id}`);
      });
    }
  }, [activeId, conversations.isSuccess, list.length, createConv, router]);

  // Pick the most recent conversation when nothing is selected.
  useEffect(() => {
    if (!activeId && list.length > 0) {
      router.replace(`/dashboard/support?c=${list[0].id}`);
    }
  }, [activeId, list, router]);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messagesQuery.data?.length]);

  const onSend = async (content: string) => {
    if (!activeId) return;
    try {
      await postMsg.mutateAsync(content);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not send message");
    }
  };

  const onNew = async () => {
    const conv = await createConv.mutateAsync(undefined);
    router.push(`/dashboard/support?c=${conv.id}`);
  };

  const badge = active ? stateBadge(active.state) : null;

  return (
    <div className="grid h-[calc(100dvh-11rem)] grid-cols-1 gap-4 md:grid-cols-[260px_1fr]">
      {/* Conversation list */}
      <aside className="hidden flex-col rounded-xl border border-line bg-surface md:flex">
        <div className="flex items-center justify-between border-b border-line px-3 py-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-fg-dim">
            Conversations
          </div>
          <button
            type="button"
            onClick={() => void onNew()}
            className="rounded-md border border-line px-2 py-1 text-[11px] text-fg-muted hover:text-fg"
          >
            + New
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {list.map((c) => {
            const isActive = c.id === activeId;
            const b = stateBadge(c.state);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => router.replace(`/dashboard/support?c=${c.id}`)}
                className={`block w-full border-b border-line/60 px-3 py-2 text-left ${isActive ? "bg-bg" : "hover:bg-bg/60"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm text-fg">
                    {c.subject || "Support conversation"}
                  </span>
                  {c.unreadForUser && (
                    <span className="ml-2 h-2 w-2 rounded-full bg-accent" />
                  )}
                </div>
                <div
                  className={`mt-1 inline-block rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${b.cls}`}
                >
                  {b.text}
                </div>
              </button>
            );
          })}
          {list.length === 0 && (
            <div className="px-3 py-6 text-center text-xs text-fg-dim">
              No conversations yet.
            </div>
          )}
        </div>
      </aside>

      {/* Chat panel */}
      <section className="flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface">
        <header className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-fg">
              {active?.subject || "BidNaija Support"}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[11px]  text-fg-dim">
              {badge && (
                <span
                  className={`inline-block rounded-full border whitespace-nowrap px-2 py-0.5 text-[9px] font-semibold ${badge.cls}`}
                >
                  {badge.text}
                </span>
              )}
              <span>
                AI looks things up for you using your account data. Ask anything about your auctions, wallet, or listings.
              </span>
            </div>
          </div>
        </header>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-3 py-3"
        >
          {messagesQuery.isLoading ? (
            <div className="py-8 text-center text-sm text-fg-dim">Loading…</div>
          ) : (messagesQuery.data ?? []).length === 0 ? (
            <div className="py-8 text-center text-sm text-fg-dim">
              Ask the assistant anything about your BidNaija account.
            </div>
          ) : (
            <>
              {messagesQuery.data?.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
              {/* Typing dots: shown while the API call is in-flight AND the
                  conversation is in AI mode. Admin replies arrive via WS so
                  we don't have a "pending" flag for them here. */}
              {postMsg.isPending && active?.state === "AI_ACTIVE" && (
                <TypingIndicator label="BidNaija AI" />
              )}
            </>
          )}
        </div>

        <Composer
          disabled={!active || active.state === "RESOLVED"}
          onSend={onSend}
          placeholder={
            active?.state === "WAITING_ADMIN"
              ? "Waiting for a human…"
              : active?.state === "ADMIN_ACTIVE"
                ? "Reply to the agent…"
                : "Type a message…"
          }
        />
      </section>
    </div>
  );
}
