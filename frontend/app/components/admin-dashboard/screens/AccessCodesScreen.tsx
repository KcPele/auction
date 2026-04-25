"use client";
import { useState } from "react";
import { Card, CardBody, CardHead } from "../widgets/Card";
import { SectionHeader } from "./SectionHeader";

interface CodeRequest {
  id: string;
  user: string;
  type: "car" | "gadget";
  reason: string;
  waited: string;
  status: "pending" | "approved" | "denied";
}

const INITIAL: CodeRequest[] = [
  { id: "ACR-2041", user: "kemi.adebayo", type: "car", reason: "Dealer · 2 cars ready", waited: "8m", status: "pending" },
  { id: "ACR-2040", user: "femi_ola", type: "gadget", reason: "Phone reseller · 12 units", waited: "22m", status: "pending" },
  { id: "ACR-2039", user: "ngozi.v", type: "gadget", reason: "Personal · 1 MacBook", waited: "1h 04m", status: "pending" },
  { id: "ACR-2038", user: "tobi.k", type: "car", reason: "Private · 2018 Camry", waited: "2h 30m", status: "pending" },
];

const TYPE_BG: Record<CodeRequest["type"], string> = {
  car: "bg-accent/10 text-accent",
  gadget: "bg-[rgba(107,176,255,0.12)] text-[var(--blue,#6bb0ff)]",
};

export function AccessCodesScreen() {
  const [items, setItems] = useState<CodeRequest[]>(INITIAL);

  const decide = (id: string, status: "approved" | "denied") =>
    setItems((s) => s.map((r) => (r.id === id ? { ...r, status } : r)));

  const pending = items.filter((i) => i.status === "pending").length;

  return (
    <>
      <SectionHeader
        title="Access code requests"
        sub="Pending applications — review, issue car/gadget codes, and unlock lister dashboards."
      />
      <Card>
        <CardHead
          title={
            <>
              Pending requests
              <span className="ml-1.5 text-[11px] font-normal text-fg-dim">
                {pending} open · {items.length} total
              </span>
            </>
          }
        />
        <CardBody flush>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr>
                  {["Request", "User", "Type", "Reason", "Waited", ""].map((h) => (
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
                {items.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-2/40">
                    <td className="border-b border-line px-3.5 py-3 font-mono text-xs text-fg-muted sm:px-[18px]">
                      {r.id}
                    </td>
                    <td className="border-b border-line px-3.5 py-3 text-[13px] sm:px-[18px]">
                      @{r.user}
                    </td>
                    <td className="border-b border-line px-3.5 py-3 sm:px-[18px]">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TYPE_BG[r.type]}`}
                      >
                        {r.type}
                      </span>
                    </td>
                    <td className="border-b border-line px-3.5 py-3 text-[13px] text-fg-muted sm:px-[18px]">
                      {r.reason}
                    </td>
                    <td className="border-b border-line px-3.5 py-3 text-[13px] text-fg-muted sm:px-[18px]">
                      {r.waited}
                    </td>
                    <td className="border-b border-line px-3.5 py-3 text-right sm:px-[18px]">
                      {r.status === "pending" ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => decide(r.id, "denied")}
                            className="rounded-md border border-line px-2.5 py-1 text-[11px] text-fg-muted hover:border-red/40 hover:text-red"
                          >
                            Deny
                          </button>
                          <button
                            type="button"
                            onClick={() => decide(r.id, "approved")}
                            className="rounded-md border border-green/30 bg-green/[0.08] px-2.5 py-1 text-[11px] font-semibold text-green hover:bg-green/15"
                          >
                            Issue code
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`text-[11px] font-semibold uppercase ${
                            r.status === "approved" ? "text-green" : "text-red"
                          }`}
                        >
                          {r.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </>
  );
}
