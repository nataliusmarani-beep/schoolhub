"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Globe, RefreshCw,
  GraduationCap, UserCheck, ClipboardList, Calendar, BookOpen,
  Megaphone, MessageSquare,
  Users, Clock, Wallet, CalendarOff,
  Package, ArrowLeftRight,
  Monitor, Key, Ticket,
  FileBarChart2, BarChart3,
  Archive,
  School, CalendarDays, ShieldCheck,
  LogOut, ChevronLeft, ChevronRight, BookMarked,
} from "lucide-react";
import { useState } from "react";
import type { UserRole } from "@/generated/prisma";

// ─── Nav structure ────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: UserRole[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
  roles?: UserRole[];
}

const ADMIN: UserRole[] = ["SUPER_ADMIN","SCHOOL_ADMIN","PRINCIPAL"];
const ADMIN_TEACHER: UserRole[] = ["SUPER_ADMIN","SCHOOL_ADMIN","PRINCIPAL","TEACHER"];

const NAV_GROUPS: NavGroup[] = [
  {
    title: "UTAMA",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "WEBSITE & LMS",
    roles: ["SUPER_ADMIN","SCHOOL_ADMIN","PRINCIPAL"],
    items: [
      { label: "Website Sekolah", href: "/dashboard/website", icon: Globe },
      { label: "Sinkronisasi LMS", href: "/dashboard/lms", icon: RefreshCw },
    ],
  },
  {
    title: "AKADEMIK",
    roles: ADMIN_TEACHER,
    items: [
      { label: "Data Siswa", href: "/dashboard/students", icon: GraduationCap, roles: ADMIN_TEACHER },
      { label: "Absensi", href: "/dashboard/attendance", icon: UserCheck, roles: ADMIN_TEACHER },
      { label: "Nilai & Raport", href: "/dashboard/grades", icon: ClipboardList, roles: ADMIN_TEACHER },
      { label: "Jadwal Pelajaran", href: "/dashboard/schedule", icon: Calendar },
      { label: "Mata Pelajaran", href: "/dashboard/subjects", icon: BookMarked, roles: ADMIN_TEACHER },
    ],
  },
  {
    title: "KOMUNIKASI",
    items: [
      { label: "Pengumuman", href: "/dashboard/announcements", icon: Megaphone },
      { label: "Pesan", href: "/dashboard/messages", icon: MessageSquare },
    ],
  },
  {
    title: "SDM & HR",
    roles: ADMIN,
    items: [
      { label: "Data Pegawai", href: "/dashboard/hr/employees", icon: Users },
      { label: "Kehadiran Pegawai", href: "/dashboard/hr/attendance", icon: Clock },
      { label: "Penggajian", href: "/dashboard/hr/payroll", icon: Wallet },
      { label: "Cuti & Izin", href: "/dashboard/hr/leave", icon: CalendarOff },
    ],
  },
  {
    title: "INVENTARIS",
    roles: ["SUPER_ADMIN","SCHOOL_ADMIN","PRINCIPAL","STAFF"],
    items: [
      { label: "Barang & Aset", href: "/dashboard/inventory", icon: Package },
      { label: "Transaksi", href: "/dashboard/inventory/transactions", icon: ArrowLeftRight },
    ],
  },
  {
    title: "ICT",
    roles: ADMIN,
    items: [
      { label: "Perangkat", href: "/dashboard/ict/devices", icon: Monitor },
      { label: "Lisensi", href: "/dashboard/ict/licenses", icon: Key },
      { label: "IT Helpdesk", href: "/dashboard/ict/tickets", icon: Ticket },
    ],
  },
  {
    title: "LAPORAN",
    roles: ADMIN,
    items: [
      { label: "Laporan Dinas", href: "/dashboard/reports/dinas", icon: FileBarChart2 },
      { label: "Statistik Sekolah", href: "/dashboard/reports/stats", icon: BarChart3 },
    ],
  },
  {
    title: "ARSIP",
    roles: ADMIN,
    items: [
      { label: "Gudang Arsip", href: "/dashboard/archive", icon: Archive },
    ],
  },
  {
    title: "PENGATURAN",
    roles: ["SUPER_ADMIN","SCHOOL_ADMIN"],
    items: [
      { label: "Profil Sekolah", href: "/dashboard/settings", icon: School },
      { label: "Tahun Ajaran", href: "/dashboard/settings/academic-years", icon: CalendarDays },
      { label: "Pengguna & Hak Akses", href: "/dashboard/settings/users", icon: ShieldCheck },
    ],
  },
];

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin", SCHOOL_ADMIN: "Admin Sekolah", PRINCIPAL: "Kepala Sekolah",
  TEACHER: "Guru", STAFF: "Staf", STUDENT: "Siswa", PARENT: "Orang Tua",
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  role: UserRole;
  schoolName: string;
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ role, schoolName, collapsed, onToggle }: Props) {
  const pathname = usePathname();

  function isVisible(roles?: UserRole[]) {
    if (!roles) return true;
    return roles.includes(role);
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const NavLink = ({ item }: { item: NavItem }) => {
    if (!isVisible(item.roles)) return null;
    const active = isActive(item.href);

    const inner = (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
          active
            ? "bg-primary text-white shadow-sm"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        )}
      >
        <item.icon className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger>{inner}</TooltipTrigger>
          <TooltipContent side="right" className="ml-1">{item.label}</TooltipContent>
        </Tooltip>
      );
    }
    return inner;
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={cn(
        "flex items-center border-b shrink-0 transition-all",
        collapsed ? "px-3 py-4 justify-center" : "px-4 py-4 justify-between"
      )}>
        <div className={cn("flex items-center gap-2 min-w-0", collapsed && "justify-center")}>
          <div className="bg-primary rounded-lg p-1.5 shrink-0">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate leading-tight">{schoolName}</p>
              <p className="text-[11px] text-muted-foreground">SchoolHub</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button onClick={onToggle} className="p-1 rounded hover:bg-gray-100 text-gray-400 shrink-0 hidden lg:flex">
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 py-2">
        <nav className={cn("space-y-0.5", collapsed ? "px-2" : "px-3")}>
          <TooltipProvider>
            {NAV_GROUPS.map((group) => {
              if (!isVisible(group.roles)) return null;
              const visibleItems = group.items.filter((i) => isVisible(i.roles));
              if (visibleItems.length === 0) return null;

              return (
                <div key={group.title} className="mb-3">
                  {!collapsed && (
                    <p className="text-[10px] font-semibold text-muted-foreground px-3 mb-1 tracking-wider">
                      {group.title}
                    </p>
                  )}
                  {collapsed && <div className="h-px bg-gray-100 mb-2 mx-1" />}
                  <div className="space-y-0.5">
                    {visibleItems.map((item) => (
                      <NavLink key={item.href} item={item} />
                    ))}
                  </div>
                </div>
              );
            })}
          </TooltipProvider>
        </nav>
      </ScrollArea>

      {/* Collapse toggle (collapsed state) */}
      {collapsed && (
        <div className="px-2 pb-2 hidden lg:block">
          <Tooltip>
            <TooltipTrigger>
              <button
                onClick={onToggle}
                className="w-full flex justify-center p-2 rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Perluas sidebar</TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* User footer */}
      <div className={cn("border-t p-3 shrink-0", collapsed && "px-2")}>
        <UserFooter collapsed={collapsed} role={role} />
      </div>
    </div>
  );

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r bg-white shrink-0 h-screen sticky top-0 transition-all duration-200",
        collapsed ? "w-[60px]" : "w-[240px]"
      )}
    >
      <SidebarContent />
    </aside>
  );
}

function UserFooter({ collapsed, role }: { collapsed: boolean; role: UserRole }) {
  const { data: session } = useSession();
  const user = session?.user as any;
  const initials = user?.name?.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase() ?? "?";

  const content = (
    <div className={cn("flex items-center gap-2.5 group", collapsed && "justify-center")}>
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-bold">{initials}</AvatarFallback>
      </Avatar>
      {!collapsed && (
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-900 truncate leading-tight">{user?.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">{ROLE_LABELS[role] ?? role}</p>
        </div>
      )}
      {!collapsed && (
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="p-1.5 rounded text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
          title="Keluar"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );

  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex justify-center"
            >
              {content}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{ROLE_LABELS[role]}</p>
            <p className="text-xs text-red-500 mt-1">Klik untuk keluar</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  return content;
}

// ─── Mobile Drawer ─────────────────────────────────────────────────────────────

export function MobileSidebar({ role, schoolName, open, onClose }: {
  role: UserRole; schoolName: string; open: boolean; onClose: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="p-0 w-[240px]">
        <Sidebar role={role} schoolName={schoolName} collapsed={false} onToggle={onClose} />
      </SheetContent>
    </Sheet>
  );
}
