"use client";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAdminMechanics,
  useRevokeMechanic,
  useVerifyMechanic,
} from "@/app/components/admin/hooks/use-admin-extras";
import { ApiError } from "@/app/lib/api/error";
import { Card, CardBody, CardHead } from "../widgets/Card";
import { SectionHeader } from "./SectionHeader";

const STATUS_STYLE: Record<string, string> = {
  VERIFIED: "border-green/30 bg-green/[0.08] text-green",
  PENDING: "border-accent/30 bg-accent/10 text-accent",
  REVOKED: "border-red/30 bg-red/[0.08] text-red",
};

export function MechanicsScreen() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, refetch } = useAdminMechanics({
    search: search || undefined,
  });
  const verify = useVerifyMechanic();
  const revoke = useRevokeMechanic();

  const items = data ?? [];

  const onVerify = async (id: string) => {
    try {
      await verify.mutateAsync(id);
      toast.success("Mechanic verified");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Could not verify");
    }
  };

  const onRevoke = async (id: string) => {
    try {
      await revoke.mutateAsync(id);
      toast.success("Mechanic revoked");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Could not revoke");
    }
  };

  return (
    <>
      <SectionHeader
        title="Mechanics directory"
        sub="Registered mechanics who inspect cars before listing. Verify or revoke."
      />
      <Card>
        <CardHead
          title={`Mechanics · ${items.length}`}
          controls={
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, shop…"
              className="w-48 rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs outline-none focus:border-accent/40"
            />
          }
        />
        <CardBody flush>
          {isLoading ? (
            <div className="px-5 py-10 text-center text-[13px] italic text-fg-dim">
              Loading…
            </div>
          ) : isError ? (
            <div className="px-5 py-10 text-center text-[13px] italic text-fg-dim">
              Could not load.{" "}
              <button onClick={() => refetch()} className="text-accent">
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="px-5 py-10 text-center text-[13px] italic text-fg-dim">
              No mechanics yet.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {items.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center gap-3 px-3.5 py-3.5 sm:px-[18px]"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                    {m.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{m.name}</span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_STYLE[m.status] ?? ""}`}
                      >
                        {m.status}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-fg-muted">
                      {[m.shopName, m.city].filter(Boolean).join(" · ")}
                      {m.inspectionCount > 0 &&
                        ` · ${m.inspectionCount} inspections`}
                      {m.rating > 0 && ` · ★ ${m.rating}`}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {m.status !== "VERIFIED" && (
                      <button
                        type="button"
                        disabled={verify.isPending}
                        onClick={() => onVerify(m.id)}
                        className="rounded-md border border-green/30 bg-green/[0.08] px-2.5 py-1 text-[11px] font-semibold text-green hover:bg-green/15 disabled:opacity-60"
                      >
                        Verify
                      </button>
                    )}
                    {m.status !== "REVOKED" && (
                      <button
                        type="button"
                        disabled={revoke.isPending}
                        onClick={() => onRevoke(m.id)}
                        className="rounded-md border border-line px-2.5 py-1 text-[11px] text-fg-muted hover:border-red/40 hover:text-red disabled:opacity-60"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </>
  );
}
