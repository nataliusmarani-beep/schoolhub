"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BookOpen,
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  ClipboardList,
  BarChart2,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  UserCheck,
  BookMarked,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/generated/prisma";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ALL"] },
  { href: "/dashboard/students", label: "Siswa", icon: GraduationCap, roles: ["SUPER_ADMIN","SCHOOL_ADMIN","PRINCIPAL","TEACHER"] },
  { href: "/dashboard/attendance", label: "Absensi", icon: UserCheck, roles: ["SUPER_ADMIN","SCHOOL_ADMIN","PRINCIPAL","TEACHER"] },
  { href: "/dashboard/grades", label: "Nilai", icon: ClipboardList, roles: ["SUPER_ADMIN","SCHOOL_ADMIN","PRINCIPAL","TEACHER"] },
  { href: "/dashboard/schedule", label: "Jadwal", icon: Calendar, roles: ["ALL"] },
  { href: "/dashboard/lms", label: "LMS", icon: BookMarked, roles: ["ALL"] },
  { href: "/dashboard/hr", label: "SDM & Kepegawaian", icon: Users, roles: ["SUPER_ADMIN","SCHOOL_ADMIN","PRINCIPAL"] },
  { href: "/dashboard/inventory", label: "Inventaris", icon: Package, roles: ["SUPER_ADMIN","SCHOOL_ADMIN","PRINCIPAL","STAFF"] },
  { href: "/dashboard/reports", label: "Laporan", icon: BarChart2, roles: ["SUPER_ADMIN","SCHOOL_ADMIN","PRINCIPAL"] },
  { href: "/dashboard/settings", label: "Pengaturan", icon: Settings, roles: ["SUPER_ADMIN","SCHOOL_ADMIN"] },
];

interface Props {
  role: UserRole;
  schoolName: string;
}

export default function Sidebar({ role, schoolName }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visible = navItems.filter(
    (item) => item.roles.includes("ALL") || item.roles.includes(role)
  );

  const NavLink = ({ item }: { item: (typeof navItems)[0] }) => {
    const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          active
            ? "bg-primary text-white"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {item.label}
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-5 border-b">
        <div className="bg-primary rounded-lg p-1.5">
          <BookOpen className="h-5 w-5 text-white" />
        </div>
        <div className="overflow-hidden">
          <p className="font-semibold text-sm truncate">{schoolName}</p>
          <p className="text-xs text-muted-foreground">SchoolHub</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visible.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      <div className="p-3 border-t">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 w-full transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-white shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-white border rounded-lg p-2 shadow"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 bg-white h-full shadow-xl">
            <button
              className="absolute top-4 right-4"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
