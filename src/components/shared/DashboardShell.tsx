"use client";

import { useState } from "react";
import Sidebar, { MobileSidebar } from "./Sidebar";
import Topbar from "./Topbar";
import type { UserRole } from "@/generated/prisma";

interface Props {
  role: UserRole;
  schoolName: string;
  children: React.ReactNode;
}

export default function DashboardShell({ role, schoolName, children }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar
        role={role}
        schoolName={schoolName}
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
      />

      {/* Mobile drawer */}
      <MobileSidebar
        role={role}
        schoolName={schoolName}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
