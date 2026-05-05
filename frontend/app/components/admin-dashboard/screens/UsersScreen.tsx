"use client";
import { useMemo, useState } from "react";
import { Card, CardBody, CardHead } from "../widgets/Card";
import { SectionHeader } from "./SectionHeader";
import { fmtNGN } from "../utils";
import { Modal } from "../../ui/Modal";

interface AdminUser {
  id: string;
  handle: string;
  name: string;
  joined: string;
  bal: number;
  hold: number;
  status: "active" | "frozen";
  kyc: "verified" | "pending";
}

const INITIAL: AdminUser[] = [
  { id: "USR-1041", handle: "damilare.o", name: "Damilare Ogunbiyi", joined: "Mar 2025", bal: 1_240_000, hold: 485_000, status: "active", kyc: "verified" },
  { id: "USR-1040", handle: "nkem_a", name: "Nkem Achebe", joined: "Feb 2025", bal: 304_000, hold: 0, status: "active", kyc: "verified" },
  { id: "USR-1039", handle: "emeka_b", name: "Emeka Bello", joined: "Jan 2025", bal: 90_500, hold: 98_500, status: "active", kyc: "verified" },
  { id: "USR-1038", handle: "tunde.k", name: "Tunde Kalu", joined: "Dec 2024", bal: 2_805_000, hold: 1_400_000, status: "active", kyc: "verified" },
  { id: "USR-1037", handle: "zainab.o", name: "Zainab Olawale", joined: "Dec 2024", bal: 0, hold: 0, status: "frozen", kyc: "pending" },
  { id: "USR-1036", handle: "ada.o", name: "Ada Okafor", joined: "Nov 2024", bal: 540_000, hold: 0, status: "active", kyc: "pending" },
];

export function UsersScreen() {
  const [items, setItems] = useState<AdminUser[]>(INITIAL);
  const [q, setQ] = useState("");
  const [granting, setGranting] = useState<AdminUser | null>(null);
  const [grantCategory, setGrantCategory] = useState<"CAR" | "GADGET">("CAR");

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter(
      (u) =>
        u.handle.toLowerCase().includes(t) ||
        u.name.toLowerCase().includes(t) ||
        u.id.toLowerCase().includes(t),
    );
  }, [items, q]);

  const toggleFreeze = (id: string) =>
    setItems((s) =>
      s.map((u) => (u.id === id ? { ...u, status: u.status === "frozen" ? "active" : "frozen" } : u)),
    );

  return (
    <>
      <SectionHeader
        title="Users & wallets"
        sub="Search profiles, inspect wallets, freeze accounts, or manually adjust holds with full audit trail."
      />
      <Card>
        <CardHead
          title={`Users · ${filtered.length}`}
          controls={
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search handle, name, ID…"
              className="w-48 rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs outline-none placeholder:text-fg-dim focus:border-accent/40"
            />
          }
        />
        <CardBody flush>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr>
                  {["User", "Joined", "Balance", "On hold", "KYC", "Status", ""].map((h, i) => (
                    <th
                      key={h}
                      className={`border-b border-line bg-bg-1 px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-fg-dim sm:px-[18px] ${
                        i >= 2 && i <= 3 ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-2/40">
                    <td className="border-b border-line px-3.5 py-3 sm:px-[18px]">
                      <div className="text-[13px] font-medium">@{u.handle}</div>
                      <div className="text-[11px] text-fg-dim">{u.name} · {u.id}</div>
                    </td>
                    <td className="border-b border-line px-3.5 py-3 text-xs text-fg-muted sm:px-[18px]">
                      {u.joined}
                    </td>
                    <td className="border-b border-line px-3.5 py-3 text-right font-mono text-[13px] sm:px-[18px]">
                      {fmtNGN(u.bal)}
                    </td>
                    <td className="border-b border-line px-3.5 py-3 text-right font-mono text-[13px] text-accent sm:px-[18px]">
                      {u.hold ? fmtNGN(u.hold) : "—"}
                    </td>
                    <td className="border-b border-line px-3.5 py-3 sm:px-[18px]">
                      <span
                        className={`text-[11px] font-semibold uppercase ${
                          u.kyc === "verified" ? "text-green" : "text-fg-muted"
                        }`}
                      >
                        {u.kyc}
                      </span>
                    </td>
                    <td className="border-b border-line px-3.5 py-3 sm:px-[18px]">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          u.status === "active"
                            ? "border-green/30 bg-green/[0.08] text-green"
                            : "border-red/30 bg-red/[0.08] text-red"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="border-b border-line px-3.5 py-3 text-right sm:px-[18px]">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setGranting(u)}
                          className="rounded-md border border-line px-2.5 py-1 text-[11px] text-fg-muted hover:border-accent/40 hover:text-accent"
                        >
                          Grant access
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleFreeze(u.id)}
                          className="rounded-md border border-line px-2.5 py-1 text-[11px] text-fg-muted hover:border-accent/40 hover:text-accent"
                        >
                          {u.status === "frozen" ? "Unfreeze" : "Freeze"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Modal
        open={!!granting}
        onClose={() => setGranting(null)}
        title={granting ? `Grant listing access · @${granting.handle}` : ""}
        widthClass="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setGranting(null)}
              className="rounded-md border border-line bg-transparent px-3 py-1.5 text-xs font-medium text-fg-muted hover:bg-surface-2 hover:text-fg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                // Integration: POST /api/v1/admin/listing-permissions { userId, category }
                console.log("grant", { userId: granting?.id, category: grantCategory });
                setGranting(null);
              }}
              className="rounded-md border border-green/30 bg-green/[0.08] px-3 py-1.5 text-xs font-semibold text-green hover:bg-green/15"
            >
              Grant access
            </button>
          </>
        }
      >
        <p className="mb-4 text-[13px] text-fg-muted">
          Bypass the application flow and grant listing access directly. Use this when you've
          verified the user out-of-band.
        </p>
        <label className="block text-xs font-medium text-fg-muted">Category</label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(["CAR", "GADGET"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setGrantCategory(c)}
              className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                grantCategory === c
                  ? "border-accent bg-accent/[0.08] text-accent"
                  : "border-line bg-surface text-fg-muted hover:bg-surface-2"
              }`}
            >
              {c === "CAR" ? "Car" : "Gadget"}
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}
