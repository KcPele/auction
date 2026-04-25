"use client";
import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="grid h-screen overflow-hidden bg-bg text-fg lg:grid-cols-[240px_1fr]">
      {/* Sidebar — desktop in grid, mobile off-canvas */}
      <div
        className={`fixed inset-y-0 left-0 z-[60] w-[260px] transform shadow-2xl transition-transform duration-200 lg:relative lg:w-auto lg:translate-x-0 lg:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <Sidebar onNavigate={() => setOpen(false)} />
      </div>

      {/* Mobile backdrop */}
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-col overflow-hidden">
        <TopBar onBurgerClick={() => setOpen((v) => !v)} />
        <main className="flex-1 overflow-y-auto px-3.5 py-4 sm:px-5 sm:py-5 md:px-7 md:py-6 pb-16">
          {children}
        </main>
      </div>
    </div>
  );
}
