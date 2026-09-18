"use client";
import type { ReactNode } from "react";
import { useNotificationsStream } from "@/app/components/notifications/hooks/use-notifications";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileHeader } from "./MobileHeader";
import { TabBar } from "./TabBar";

export function DashboardShell({ children }: { children: ReactNode }) {
  useNotificationsStream();
  return (
    <div className="min-h-screen overflow-x-clip bg-background lg:grid lg:grid-cols-[var(--sidebar-w)_1fr]">
      <aside className="sticky top-0 hidden h-screen overflow-y-auto lg:block">
        <Sidebar />
      </aside>
      <div className="flex min-w-0 flex-col">
        <MobileHeader />
        <div className="sticky top-0 z-30 hidden bg-background/90 backdrop-blur lg:block">
          <TopBar />
        </div>
        <main className="mx-auto w-full max-w-[var(--desktop-content-max)] flex-1 px-4 pb-[calc(var(--nav-h)+1.5rem+env(safe-area-inset-bottom))] pt-2 sm:px-6 lg:px-8 lg:pb-16 lg:pt-6">
          {children}
        </main>
        <TabBar />
      </div>
    </div>
  );
}
