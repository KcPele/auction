"use client";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAccessCodes,
  useCreateAccessCode,
} from "@/app/components/admin/hooks/use-admin-listings";
import { ApiError } from "@/app/lib/api/error";
import { Card, CardBody, CardHead } from "../widgets/Card";
import { AdminIcon } from "../primitives/Icon";
import { SectionHeader } from "./SectionHeader";

const CAT_BG: Record<string, string> = {
  cars: "bg-accent/10 text-accent",
  gadgets: "bg-[rgba(107,176,255,0.12)] text-[var(--blue,#6bb0ff)]",
};

const dateFmt = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" });

export function AccessCodesScreen() {
  const [category, setCategory] = useState<"cars" | "gadgets">("cars");
  const [customCode, setCustomCode] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const { data, isLoading, isError, refetch } = useAccessCodes();
  const create = useCreateAccessCode();

  const codes = data ?? [];
  const activeCount = codes.filter((c) => c.isActive).length;

  const onCreate = async () => {
    try {
      await create.mutateAsync({
        category,
        code: customCode || undefined,
        expiresAt: expiresAt
          ? new Date(expiresAt).toISOString()
          : undefined,
      });
      toast.success("Access code created");
      setCustomCode("");
      setExpiresAt("");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Could not create code");
    }
  };

  return (
    <>
      <SectionHeader
        title="Access codes"
        sub="Create and manage listing access codes. Users redeem these to gain listing permission."
      />

      <Card className="mb-4">
        <CardHead title="Create access code" />
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-fg-muted">
                Category
              </label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as "cars" | "gadgets")
                }
                className="w-full rounded-[10px] border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-fg outline-none focus:border-accent"
              >
                <option value="cars">Car</option>
                <option value="gadgets">Gadget</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-fg-muted">
                Custom code <span className="text-fg-dim">(optional)</span>
              </label>
              <input
                type="text"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                placeholder="e.g. AUC-CAR-2026"
                className="w-full rounded-[10px] border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-fg outline-none focus:border-accent placeholder:text-fg-dim"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-fg-muted">
                Expires at <span className="text-fg-dim">(optional)</span>
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full rounded-[10px] border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-fg outline-none focus:border-accent"
              />
            </div>
          </div>
          <button
            type="button"
            disabled={create.isPending}
            onClick={onCreate}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-transparent px-4 py-2 text-xs font-semibold text-[#1a0a00] disabled:opacity-60"
            style={{
              background:
                "linear-gradient(180deg, var(--accent-2), var(--accent))",
            }}
          >
            <AdminIcon name="plus" size={14} />
            {create.isPending ? "Creating…" : "Create code"}
          </button>
        </CardBody>
      </Card>

      <Card>
        <CardHead
          title={
            <>
              All codes
              <span className="ml-1.5 text-[11px] font-normal text-fg-dim">
                {activeCount} active · {codes.length} total
              </span>
            </>
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
          ) : codes.length === 0 ? (
            <div className="px-5 py-10 text-center text-[13px] italic text-fg-dim">
              No access codes yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr>
                    {[
                      "Code",
                      "Category",
                      "Expires",
                      "Status",
                      "Used by",
                      "Created",
                    ].map((h) => (
                      <th
                        key={h}
                        className="border-b border-line bg-bg-1 px-3.5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-fg-dim sm:px-[18px]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {codes.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-2/40">
                      <td className="border-b border-line px-3.5 py-3 font-mono text-xs sm:px-[18px]">
                        {c.code}
                      </td>
                      <td className="border-b border-line px-3.5 py-3 sm:px-[18px]">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${CAT_BG[c.category]}`}
                        >
                          {c.category === "cars" ? "CAR" : "GADGET"}
                        </span>
                      </td>
                      <td className="border-b border-line px-3.5 py-3 text-[13px] text-fg-muted sm:px-[18px]">
                        {c.expiresAt ? dateFmt.format(c.expiresAt) : "—"}
                      </td>
                      <td className="border-b border-line px-3.5 py-3 sm:px-[18px]">
                        <span
                          className={`text-[11px] font-semibold ${c.isActive ? "text-green" : "text-fg-dim"}`}
                        >
                          {c.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="border-b border-line px-3.5 py-3 font-mono text-xs text-fg-muted sm:px-[18px]">
                        {c.usedById ? c.usedById.slice(0, 8) : "—"}
                      </td>
                      <td className="border-b border-line px-3.5 py-3 text-[13px] text-fg-muted sm:px-[18px]">
                        {dateFmt.format(c.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </>
  );
}
