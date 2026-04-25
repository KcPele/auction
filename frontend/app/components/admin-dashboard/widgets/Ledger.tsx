"use client";
import { Card, CardBody, CardHead } from "./Card";
import { INITIAL_LEDGER } from "../data";
import { downloadCSV, fmtNGN } from "../utils";

export function Ledger() {
  const exportCSV = () => {
    downloadCSV(`bidnaija-ledger-${Date.now()}.csv`, [
      ["Time", "Entry ID", "User", "Action", "Reference", "Direction", "Amount (NGN)"],
      ...INITIAL_LEDGER.map((l) => [l.time, l.id, "@" + l.user, l.action, l.ref, l.dir, l.amt]),
    ]);
  };

  return (
    <Card>
      <CardHead
        title={
          <>
            Payment ledger
            <span className="ml-1.5 text-[11px] font-normal text-fg-dim">
              last {INITIAL_LEDGER.length} entries
            </span>
          </>
        }
        action={
          <button
            type="button"
            onClick={exportCSV}
            className="bg-transparent text-xs font-medium text-accent hover:text-accent-2"
          >
            Export CSV
          </button>
        }
      />
      <CardBody flush>
        <div className="overflow-x-auto">
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
              {INITIAL_LEDGER.map((l) => (
                <tr key={l.id} className="cursor-pointer hover:bg-surface-2/40">
                  <td className="border-b border-line px-3.5 py-2.5 font-mono text-xs text-fg-muted last:border-b-0 sm:px-[18px]">
                    {l.time}
                  </td>
                  <td className="border-b border-line px-3.5 py-2.5 font-mono text-xs text-fg-muted sm:px-[18px]">
                    {l.id}
                  </td>
                  <td className="border-b border-line px-3.5 py-2.5 text-[13px] sm:px-[18px]">
                    @{l.user}
                  </td>
                  <td className="border-b border-line px-3.5 py-2.5 text-[13px] text-fg-muted sm:px-[18px]">
                    {l.action}
                  </td>
                  <td
                    className={`border-b border-line px-3.5 py-2.5 text-right font-mono text-[13px] font-semibold sm:px-[18px] ${
                      l.dir === "pos" ? "text-green" : "text-red"
                    }`}
                  >
                    {l.dir === "pos" ? "+" : "−"}
                    {fmtNGN(l.amt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}
