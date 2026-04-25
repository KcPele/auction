"use client";
import { useState } from "react";
import { Card, CardBody, CardHead } from "../widgets/Card";
import { SectionHeader } from "./SectionHeader";

interface Mechanic {
  id: string;
  name: string;
  shop: string;
  city: string;
  inspections: number;
  rating: number;
  status: "verified" | "revoked" | "pending";
}

const INITIAL: Mechanic[] = [
  { id: "MCH-021", name: "K. Adebayo", shop: "AutoCare Ikeja", city: "Lagos", inspections: 184, rating: 4.8, status: "verified" },
  { id: "MCH-020", name: "D. Olaniyi", shop: "Mighty Motors", city: "Abuja", inspections: 92, rating: 4.6, status: "verified" },
  { id: "MCH-019", name: "F. Eze", shop: "Eze Auto Lab", city: "Port Harcourt", inspections: 47, rating: 4.4, status: "verified" },
  { id: "MCH-018", name: "S. Okoye", shop: "Okoye & Sons", city: "Lagos", inspections: 12, rating: 3.9, status: "pending" },
  { id: "MCH-017", name: "J. Bello", shop: "Bello Garage", city: "Ibadan", inspections: 4, rating: 2.7, status: "revoked" },
];

const STATUS_STYLE: Record<Mechanic["status"], string> = {
  verified: "border-green/30 bg-green/[0.08] text-green",
  pending: "border-accent/30 bg-accent/10 text-accent",
  revoked: "border-red/30 bg-red/[0.08] text-red",
};

export function MechanicsScreen() {
  const [items, setItems] = useState<Mechanic[]>(INITIAL);

  const setStatus = (id: string, status: Mechanic["status"]) =>
    setItems((s) => s.map((m) => (m.id === id ? { ...m, status } : m)));

  return (
    <>
      <SectionHeader
        title="Mechanics directory"
        sub="Registered mechanics who inspect cars before listing. Add new, review history, or revoke access."
      />
      <Card>
        <CardHead
          title={`Mechanics · ${items.length}`}
          action={
            <button
              type="button"
              onClick={() => alert("Add mechanic flow coming next")}
              className="rounded-md border border-line bg-transparent px-3 py-1.5 text-xs text-fg-muted hover:border-accent/40 hover:text-accent"
            >
              + Add mechanic
            </button>
          }
        />
        <CardBody flush>
          <ul className="divide-y divide-line">
            {items.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 px-3.5 py-3.5 sm:px-[18px]">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                  {m.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{m.name}</span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_STYLE[m.status]}`}
                    >
                      {m.status}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-fg-muted">
                    {m.shop} · {m.city} · {m.inspections} inspections · ★ {m.rating}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {m.status !== "verified" && (
                    <button
                      type="button"
                      onClick={() => setStatus(m.id, "verified")}
                      className="rounded-md border border-green/30 bg-green/[0.08] px-2.5 py-1 text-[11px] font-semibold text-green hover:bg-green/15"
                    >
                      Verify
                    </button>
                  )}
                  {m.status !== "revoked" && (
                    <button
                      type="button"
                      onClick={() => setStatus(m.id, "revoked")}
                      className="rounded-md border border-line px-2.5 py-1 text-[11px] text-fg-muted hover:border-red/40 hover:text-red"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </>
  );
}
