"use client";
import { useAdminLedger } from "@/app/components/admin/hooks/use-admin-dashboard";
import type { AdminLedgerEntry } from "@/app/components/admin/types/dashboard.types";
import { Card, CardBody, CardHead } from "./Card";
import { downloadCSV, fmtNGN } from "../utils";

const dateFmt = new Intl.DateTimeFormat("en-NG", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export function Ledger() {
  const { data, isLoading, isError, refetch } = useAdminLedger({ limit: 50 });
  const items: AdminLedgerEntry[] = data?.items ?? [];

  const exportCSV = () => {
    if (items.length === 0) return;
    downloadCSV(`bidnaija-ledger-${Date.now()}.csv`, [
      [
        "Time",
        "Entry ID",
        "User",
        "Action",
        "Reference",
        "Direction",
        "Amount (NGN)",
      ],
      ...items.map((l) => [
        l.ts.toISOString(),
        l.id,
        l.handle,
        l.action,
        l.ref ?? "",
        l.direction,
        l.amount,
      ]),
    ]);
  };

  return (
    <Card>
      <CardHead
        title={
          <>
            Payment ledger
            <span className="ml-1.5 text-[11px] font-normal text-fg-dim">
              last {items.length} entries
            </span>
          </>
        }
        action={
          <button
            type="button"
            onClick={exportCSV}
            disabled={items.length === 0}
            className="bg-transparent text-xs font-medium text-accent hover:text-accent-2 disabled:opacity-50"
          >
            Export CSV
          </button>
        }
      />
      <CardBody flush>
        <div className="overflow-x-auto">
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
              No ledger activity yet.
            </div>
          ) : (
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr>
                  {["Time", "Entry", "User", "Action", "Amount"].map((h, i) => (
                    <th
                      key={h}
                      className={`border-b border-line bg-bg-1 px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-fg-dim sm:px-[18px] ${
                        i === 4 ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((l) => (
                  <tr
                    key={l.id}
                    className="cursor-pointer hover:bg-surface-2/40"
                  >
                    <td className="border-b border-line px-3.5 py-2.5 font-mono text-xs text-fg-muted last:border-b-0 sm:px-[18px]">
                      {dateFmt.format(l.ts)}
                    </td>
                    <td className="border-b border-line px-3.5 py-2.5 font-mono text-xs text-fg-muted sm:px-[18px]">
                      {l.id.slice(0, 8)}
                    </td>
                    <td className="border-b border-line px-3.5 py-2.5 text-[13px] sm:px-[18px]">
                      {l.handle}
                    </td>
                    <td className="border-b border-line px-3.5 py-2.5 text-[13px] text-fg-muted sm:px-[18px]">
                      {l.action}
                    </td>
                    <td
                      className={`border-b border-line px-3.5 py-2.5 text-right font-mono text-[13px] font-semibold sm:px-[18px] ${
                        l.direction === "in" ? "text-green" : "text-red"
                      }`}
                    >
                      {l.direction === "in" ? "+" : "−"}
                      {fmtNGN(l.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
