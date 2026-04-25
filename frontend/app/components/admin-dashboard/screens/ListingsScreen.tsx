"use client";
import { useState } from "react";
import { Queue } from "../widgets/Queue";
import { Card, CardBody, CardHead } from "../widgets/Card";
import { SectionHeader } from "./SectionHeader";

interface AccessApplication {
  id: string;
  user: string;
  category: "CAR" | "GADGET";
  reason: string;
  waited: string;
  status: "pending" | "approved" | "rejected";
}

const MOCK_APPS: AccessApplication[] = [
  { id: "LA-101", user: "kemi.adebayo", category: "CAR", reason: "Dealer · 2 cars ready for listing", waited: "15m", status: "pending" },
  { id: "LA-102", user: "femi_ola", category: "GADGET", reason: "Phone reseller · 12 units in stock", waited: "32m", status: "pending" },
  { id: "LA-103", user: "ngozi.v", category: "GADGET", reason: "Personal · 1 MacBook Pro to sell", waited: "1h 20m", status: "pending" },
];

const CAT_BG: Record<string, string> = {
  CAR: "bg-accent/10 text-accent",
  GADGET: "bg-[rgba(107,176,255,0.12)] text-[var(--blue,#6bb0ff)]",
};

export function ListingsScreen() {
  const [apps, setApps] = useState<AccessApplication[]>(MOCK_APPS);

  const decideApp = (id: string, status: "approved" | "rejected") => {
    // API: POST /admin/listing-access-applications/{id}/approve or /reject
    setApps((s) => s.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const pendingApps = apps.filter((a) => a.status === "pending");

  return (
    <>
      <SectionHeader
        title="Listing approvals"
        sub="Listings awaiting approval. Verify mechanic reports for cars, and proof-of-ownership for gadgets."
      />
      <Queue />

      {/* Pending listing access applications */}
      <div className="mt-4">
        <Card>
          <CardHead
            title={
              <>
                Access applications
                <span className="ml-1.5 text-[11px] font-normal text-fg-dim">
                  {pendingApps.length} pending
                </span>
              </>
            }
          />
          <CardBody flush>
            {pendingApps.length === 0 ? (
              <div className="px-5 py-10 text-center text-[13px] italic text-fg-dim">
                No pending applications.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[580px] border-collapse">
                  <thead>
                    <tr>
                      {["ID", "User", "Category", "Reason", "Waited", ""].map((h) => (
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
                    {apps.map((a) => (
                      <tr key={a.id} className="hover:bg-surface-2/40">
                        <td className="border-b border-line px-3.5 py-3 font-mono text-xs text-fg-muted sm:px-[18px]">
                          {a.id}
                        </td>
                        <td className="border-b border-line px-3.5 py-3 text-[13px] sm:px-[18px]">
                          @{a.user}
                        </td>
                        <td className="border-b border-line px-3.5 py-3 sm:px-[18px]">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${CAT_BG[a.category]}`}>
                            {a.category}
                          </span>
                        </td>
                        <td className="border-b border-line px-3.5 py-3 text-[13px] text-fg-muted sm:px-[18px]">
                          {a.reason}
                        </td>
                        <td className="border-b border-line px-3.5 py-3 text-[13px] text-fg-muted sm:px-[18px]">
                          {a.waited}
                        </td>
                        <td className="border-b border-line px-3.5 py-3 text-right sm:px-[18px]">
                          {a.status === "pending" ? (
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => decideApp(a.id, "rejected")}
                                className="rounded-md border border-line px-2.5 py-1 text-[11px] text-fg-muted hover:border-red/40 hover:text-red"
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                onClick={() => decideApp(a.id, "approved")}
                                className="rounded-md border border-green/30 bg-green/[0.08] px-2.5 py-1 text-[11px] font-semibold text-green hover:bg-green/15"
                              >
                                Approve
                              </button>
                            </div>
                          ) : (
                            <span className={`text-[11px] font-semibold uppercase ${a.status === "approved" ? "text-green" : "text-red"}`}>
                              {a.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
