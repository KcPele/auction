import type { ReactNode } from "react";
import "../dashboard.css";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileHeader } from "./MobileHeader";
import { TabBar } from "./TabBar";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="dash-stage">
      <div className="dash-desktop-shell">
        <Sidebar />
        <div className="dash-desktop-main">
          <TopBar />
          <div className="dash-desktop-content">{children}</div>
        </div>
      </div>
      <div className="dash-stage-phone">
        <div className="dash-app">
          <MobileHeader />
          <div className="dash-body">{children}</div>
          <TabBar />
        </div>
      </div>
    </div>
  );
}
