"use client";
import { useState } from "react";
import { Card, CardBody, CardHead } from "../widgets/Card";
import { SectionHeader } from "./SectionHeader";
import { AdminIcon } from "../primitives/Icon";

interface AccessCode {
  id: string;
  code: string;
  category: "CAR" | "GADGET";
  expiresAt: string;
  active: boolean;
  createdAt: string;
}

const MOCK_CODES: AccessCode[] = [
  { id: "1", code: "AUC-CAR-2026", category: "CAR", expiresAt: "2026-05-30", active: true, createdAt: "2026-04-01" },
  { id: "2", code: "AUC-GAD-SPR", category: "GADGET", expiresAt: "2026-04-30", active: true, createdAt: "2026-04-10" },
  { id: "3", code: "AUC-CAR-APR", category: "CAR", expiresAt: "2026-04-15", active: false, createdAt: "2026-03-15" },
  { id: "4", code: "AUC-GAD-MAR", category: "GADGET", expiresAt: "2026-03-31", active: false, createdAt: "2026-03-01" },
];

const CAT_BG: Record<string, string> = {
  CAR: "bg-accent/10 text-accent",
  GADGET: "bg-[rgba(107,176,255,0.12)] text-[var(--blue,#6bb0ff)]",
};

export function AccessCodesScreen() {
  const [codes] = useState<AccessCode[]>(MOCK_CODES);
  const [category, setCategory] = useState<"CAR" | "GADGET">("CAR");
  const [customCode, setCustomCode] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const activeCodes = codes.filter((c) => c.active);

  return (
    <>
      <SectionHeader
        title="Access codes"
        sub="Create and manage listing access codes. Users redeem these to gain listing permission."
      />

      {/* Create new code form */}
      <Card className="mb-4">
        <CardHead title="Create access code" />
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-fg-muted">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as "CAR" | "GADGET")}
                className="w-full rounded-[10px] border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-fg outline-none focus:border-accent"
              >
                <option value="CAR">Car</option>
                <option value="GADGET">Gadget</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-fg-muted">
                Custom code <span className="text-fg-dim">(optional)</span>
              </label>
              <input
                type="text"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
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
            onClick={() => alert(`Create code: ${category} ${customCode || "(auto)"} ${expiresAt || "(no expiry)"}`)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-transparent px-4 py-2 text-xs font-semibold text-[#1a0a00]"
            style={{ background: "linear-gradient(180deg, var(--accent-2), var(--accent))" }}
          >
            <AdminIcon name="plus" size={14} /> Create code
          </button>
        </CardBody>
      </Card>

      {/* Existing codes table */}
      <Card>
        <CardHead
          title={
            <>
              All codes
              <span className="ml-1.5 text-[11px] font-normal text-fg-dim">
                {activeCodes.length} active · {codes.length} total
              </span>
            </>
          }
        />
        <CardBody flush>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px] border-collapse">
              <thead>
                <tr>
                  {["Code", "Category", "Expires", "Status", "Created"].map((h) => (
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
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${CAT_BG[c.category]}`}>
                        {c.category}
                      </span>
                    </td>
                    <td className="border-b border-line px-3.5 py-3 text-[13px] text-fg-muted sm:px-[18px]">
                      {c.expiresAt}
                    </td>
                    <td className="border-b border-line px-3.5 py-3 sm:px-[18px]">
                      <span className={`text-[11px] font-semibold ${c.active ? "text-green" : "text-fg-dim"}`}>
                        {c.active ? "Active" : "Expired"}
                      </span>
                    </td>
                    <td className="border-b border-line px-3.5 py-3 text-[13px] text-fg-muted sm:px-[18px]">
                      {c.createdAt}
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
