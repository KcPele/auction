"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ApiError } from "@/app/lib/api/error";
import { MessageBubble } from "@/app/components/support/widgets/MessageBubble";
import { Composer } from "@/app/components/support/widgets/Composer";
import {
  useAdminAssign,
  useAdminConversations,
  useAdminMessages,
  useAdminPostMessage,
  useAdminRelease,
  useAdminResolve,
  useAdminSupportListStream,
  useSupportStream,
} from "@/app/components/support/hooks/use-support";
import type { SupportState } from "@/app/components/support/types/support.types";

const TABS: Array<{ id: SupportState | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "AI_ACTIVE", label: "AI" },
  { id: "WAITING_ADMIN", label: "Waiting" },
  { id: "ADMIN_ACTIVE", label: "Admin" },
  { id: "RESOLVED", label: "Resolved" },
];

function stateBadge(state: SupportState) {
  switch (state) {
    case "AI_ACTIVE":
      return { text: "AI", cls: "border-accent/30 bg-accent/[0.1] text-accent" };
    case "WAITING_ADMIN":
      return {
        text: "WAITING",
        cls: "border-orange/30 bg-orange/10 text-orange",
      };
    case "ADMIN_ACTIVE":
      return { text: "ADMIN", cls: "border-blue/30 bg-blue/10 text-blue" };
    case "RESOLVED":
      return { text: "RESOLVED", cls: "border-green/30 bg-green/10 text-green" };
  }
}

export function SupportScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const activeId = params.get("c");
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");

  const conversations = useAdminConversations(
    tab === "all" ? undefined : tab,
  );
  const messages = useAdminMessages(activeId);
  const postMsg = useAdminPostMessage(activeId ?? "");
  const assign = useAdminAssign();
  const release = useAdminRelease();
  const resolve = useAdminResolve();
  useAdminSupportListStream();
  useSupportStream(activeId, true);

  const list = conversations.data ?? [];
  const active = useMemo(
    () => list.find((c) => c.id === activeId) ?? null,
    [list, activeId],
  );

  // Auto-select first conversation when arriving without a query param.
  useEffect(() => {
    if (!activeId && list.length > 0) {
      router.replace(`/admin/support?c=${list[0].id}`);
    }
  }, [activeId, list, router]);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.data?.length]);

  const onSend = async (content: string) => {
    if (!activeId) return;
    try {
      await postMsg.mutateAsync(content);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not send");
    }
  };

  return (
    <div>
      <h1 className="m-0 mb-1 font-display text-3xl font-semibold tracking-tight">
        Support
      </h1>
      <p className="mb-4 text-sm text-fg-muted">
        Conversations between users and the AI assistant. Take over any
        conversation to chat directly with the user.
      </p>

      <div className="mb-3 flex gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${
              tab === t.id
                ? "border-accent bg-accent/[0.1] text-accent"
                : "border-line text-fg-muted hover:text-fg"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid h-[calc(100vh-13rem)] grid-cols-1 gap-3 md:grid-cols-[300px_1fr]">
        <aside className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface">
          <div className="border-b border-line px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-fg-dim">
            {list.length} conversation{list.length === 1 ? "" : "s"}
          </div>
          <div className="flex-1 overflow-y-auto">
            {list.map((c) => {
              const b = stateBadge(c.state);
              const isActive = c.id === activeId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => router.replace(`/admin/support?c=${c.id}`)}
                  className={`block w-full border-b border-line/60 px-3 py-2.5 text-left ${
                    isActive ? "bg-bg" : "hover:bg-bg/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-semibold ${b.cls}`}
                    >
                      {b.text}
                    </span>
                    {c.unreadForAdmin && (
                      <span className="h-2 w-2 rounded-full bg-accent" />
                    )}
                  </div>
                  <div className="mt-1 truncate text-sm text-fg">
                    {c.subject || `Conversation ${c.id.slice(0, 6)}`}
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-fg-dim">
                    User · {c.userId.slice(0, 8)} ·{" "}
                    {c.lastMessageAt
                      ? c.lastMessageAt.toLocaleString("en-NG", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "—"}
                  </div>
                </button>
              );
            })}
            {list.length === 0 && (
              <div className="px-3 py-6 text-center text-xs text-fg-dim">
                No conversations.
              </div>
            )}
          </div>
        </aside>

        <section className="flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface">
          {active ? (
            <>
              <header className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-fg">
                    {active.subject || `Conversation ${active.id.slice(0, 8)}`}
                  </div>
                  <div className="mt-0.5 text-[11px] text-fg-dim">
                    User: {active.userId} · Assigned:{" "}
                    {active.assignedAdminId
                      ? active.assignedAdminId.slice(0, 8)
                      : "—"}
                    {active.handoffReason ? ` · "${active.handoffReason}"` : ""}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    disabled={active.state === "ADMIN_ACTIVE"}
                    onClick={() => assign.mutate(active.id)}
                    className="rounded-md border border-blue/40 bg-blue/[0.08] px-2.5 py-1.5 text-xs font-semibold text-blue disabled:opacity-40"
                  >
                    Take over
                  </button>
                  <button
                    type="button"
                    disabled={active.state === "AI_ACTIVE"}
                    onClick={() => release.mutate(active.id)}
                    className="rounded-md border border-accent/40 bg-accent/[0.08] px-2.5 py-1.5 text-xs font-semibold text-accent disabled:opacity-40"
                  >
                    Hand back to AI
                  </button>
                  <button
                    type="button"
                    disabled={active.state === "RESOLVED"}
                    onClick={() => resolve.mutate(active.id)}
                    className="rounded-md border border-green/40 bg-green/[0.08] px-2.5 py-1.5 text-xs font-semibold text-green disabled:opacity-40"
                  >
                    Resolve
                  </button>
                </div>
              </header>

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3">
                {messages.isLoading ? (
                  <div className="py-8 text-center text-sm text-fg-dim">
                    Loading…
                  </div>
                ) : (
                  messages.data?.map((m) => (
                    <MessageBubble key={m.id} message={m} asAdmin />
                  ))
                )}
              </div>

              <Composer
                onSend={onSend}
                disabled={active.state === "RESOLVED"}
                placeholder="Reply as support agent — markdown supported"
              />
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-fg-dim">
              Select a conversation
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
