import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileHeader } from "./MobileHeader";
import { TabBar } from "./TabBar";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen bg-bg lg:bg-[radial-gradient(ellipse_at_top_left,rgba(232,183,85,0.04),transparent_50%),var(--bg)]"
    >
      {/* Desktop shell */}
      <div className="hidden min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
        <aside className="sticky top-0 h-screen overflow-y-auto">
          <Sidebar />
        </aside>
        <div className="flex min-w-0 flex-col">
          <div className="sticky top-0 z-30 bg-bg/80 backdrop-blur">
            <TopBar />
          </div>
          <div className="mx-auto w-full max-w-[900px] px-8 pb-[60px] pt-6">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile shell */}
      <div className="relative w-full lg:hidden">
        <div className="flex min-h-screen flex-col bg-bg">
          <MobileHeader />
          <div
            className="flex-1 overflow-y-auto scroll-smooth px-[18px] pt-2"
            style={{
              paddingBottom:
                "calc(var(--nav-h) + 24px + env(safe-area-inset-bottom))",
            }}
          >
            {children}
          </div>
          <TabBar />
        </div>
      </div>
    </div>
  );
}
