"use client";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAccessCodes,
  useCreateAccessCode,
  useDeactivateAccessCode,
} from "@/app/components/admin/hooks/use-admin-listings";
import type { AccessCode } from "@/app/components/admin/types/listings.types";
import { ApiError } from "@/app/lib/api/error";
import { useNow } from "@/app/lib/format/use-now";
import { Card, CardBody, CardHead } from "../widgets/Card";
import { AdminIcon } from "../primitives/Icon";
import { SectionHeader } from "./SectionHeader";
import { Modal } from "../../ui/Modal";
import { PaginationControls } from "../../ui/PaginationControls";

const CAT_BG: Record<string, string> = {
  cars: "bg-accent/10 text-accent",
  gadgets: "bg-info-soft text-info",
};

const dateFmt = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" });
const toLocalInputDateTime = (time: number) => {
  const date = new Date(time);
  const localTime = time - date.getTimezoneOffset() * 60_000;
  return new Date(localTime).toISOString().slice(0, 16);
};

export function AccessCodesScreen() {
  const [mountedAt] = useState(Date.now);
  const now = useNow();
  const renderedAt = now ?? mountedAt;
  const [category, setCategory] = useState<"cars" | "gadgets">("cars");
  const [customCode, setCustomCode] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [deactivating, setDeactivating] = useState<AccessCode | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data, isLoading, isError, refetch } = useAccessCodes({
    limit: pageSize,
    offset: page * pageSize,
  });
  const create = useCreateAccessCode();
  const deactivate = useDeactivateAccessCode();

  const codes = data?.items ?? [];
  const isUsable = (code: (typeof codes)[number]) =>
    code.isActive &&
    !code.usedAt &&
    (!code.expiresAt || code.expiresAt.getTime() > renderedAt);
  const activeCount = codes.filter(isUsable).length;
  const hasInvalidExpiry =
    Boolean(expiresAt) && new Date(expiresAt).getTime() <= renderedAt;

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

  const onCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Access code copied");
    } catch {
      toast.error("Could not copy access code");
    }
  };

  const onDeactivate = async () => {
    if (!deactivating) return;
    try {
      await deactivate.mutateAsync(deactivating.id);
      toast.success("Access code deactivated");
      setDeactivating(null);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Could not deactivate code");
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
              <label htmlFor="access-code-category" className="mb-1 block text-xs font-medium text-fg-muted">
                Category
              </label>
              <select
                id="access-code-category"
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
              <label htmlFor="access-code-custom" className="mb-1 block text-xs font-medium text-fg-muted">
                Custom code <span className="text-fg-dim">(optional)</span>
              </label>
              <input
                id="access-code-custom"
                autoComplete="off"
                type="text"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                placeholder="e.g. AUC-CAR-2026"
                className="w-full rounded-[10px] border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-fg outline-none focus:border-accent placeholder:text-fg-dim"
              />
            </div>
            <div>
              <label htmlFor="access-code-expiry" className="mb-1 block text-xs font-medium text-fg-muted">
                Expires at <span className="text-fg-dim">(optional)</span>
              </label>
              <input
                id="access-code-expiry"
                type="datetime-local"
                min={toLocalInputDateTime(renderedAt)}
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full rounded-[10px] border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-fg outline-none focus:border-accent"
              />
              {hasInvalidExpiry && (
                <p className="mt-1 text-xs text-danger">
                  Choose a future expiry time.
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            disabled={create.isPending || hasInvalidExpiry}
            onClick={onCreate}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-transparent bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
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
                {activeCount} active on page · {data?.total ?? 0} total
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
                      "Actions",
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
                  {codes.map((c) => {
                    const usable = isUsable(c);
                    const status = c.usedAt
                      ? "Used"
                      : c.expiresAt && c.expiresAt.getTime() <= renderedAt
                        ? "Expired"
                        : usable
                          ? "Active"
                          : "Inactive";
                    return (
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
                          className={`text-xs font-semibold ${usable ? "text-success" : "text-fg-dim"}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="border-b border-line px-3.5 py-3 font-mono text-xs text-fg-muted sm:px-4">
                        {c.usedById ? c.usedById.slice(0, 8) : "—"}
                      </td>
                      <td className="border-b border-line px-3.5 py-3 text-sm text-fg-muted sm:px-4">
                        {dateFmt.format(c.createdAt)}
                      </td>
                      <td className="border-b border-line px-3.5 py-3 text-right sm:px-4">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            aria-label={`Copy access code ${c.code}`}
                            onClick={() => onCopy(c.code)}
                            className="rounded-md border border-line px-2.5 py-1 text-xs font-semibold text-fg-muted hover:bg-surface-2"
                          >
                            Copy
                          </button>
                          {usable && (
                            <button
                              type="button"
                              onClick={() => setDeactivating(c)}
                              className="rounded-md border border-danger/30 px-2.5 py-1 text-xs font-semibold text-danger hover:bg-danger-soft"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
      <PaginationControls
        page={page}
        pageSize={pageSize}
        total={data?.total ?? 0}
        onPageChange={setPage}
      />

      <Modal
        open={Boolean(deactivating)}
        onClose={() => setDeactivating(null)}
        title="Deactivate access code"
        widthClass="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeactivating(null)}
              className="rounded-md border border-line px-3 py-1.5 text-xs text-fg-muted hover:bg-surface-2"
            >
              Keep active
            </button>
            <button
              type="button"
              disabled={deactivate.isPending}
              onClick={onDeactivate}
              className="rounded-md bg-danger px-3 py-1.5 text-xs font-semibold text-danger-foreground hover:bg-danger-hover disabled:opacity-60"
            >
              {deactivate.isPending ? "Deactivating…" : "Deactivate code"}
            </button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">
          <span className="font-mono font-semibold text-fg">
            {deactivating?.code}
          </span>{" "}
          will stop working immediately. This does not remove listing access
          already granted with the code.
        </p>
      </Modal>
    </>
  );
}
