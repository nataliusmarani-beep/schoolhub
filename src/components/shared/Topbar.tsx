"use client";

import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, Search, Menu, ChevronRight, LogOut, User, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";

// ─── Breadcrumb map ────────────────────────────────────────────────────────────

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  students: "Data Siswa",
  attendance: "Absensi",
  grades: "Nilai & Raport",
  schedule: "Jadwal Pelajaran",
  subjects: "Mata Pelajaran",
  announcements: "Pengumuman",
  messages: "Pesan",
  hr: "SDM & HR",
  employees: "Data Pegawai",
  payroll: "Penggajian",
  leave: "Cuti & Izin",
  inventory: "Inventaris",
  transactions: "Transaksi",
  ict: "ICT",
  devices: "Perangkat",
  licenses: "Lisensi",
  tickets: "IT Helpdesk",
  reports: "Laporan",
  dinas: "Laporan Dinas",
  stats: "Statistik Sekolah",
  archive: "Gudang Arsip",
  settings: "Pengaturan",
  users: "Pengguna & Hak Akses",
  "academic-years": "Tahun Ajaran",
  website: "Website Sekolah",
  lms: "Sinkronisasi LMS",
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin", SCHOOL_ADMIN: "Admin Sekolah", PRINCIPAL: "Kepala Sekolah",
  TEACHER: "Guru", STAFF: "Staf", STUDENT: "Siswa", PARENT: "Orang Tua",
};

interface Props {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: Props) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const user = session?.user as any;
  const [searching, setSearching] = useState(false);

  const initials = user?.name?.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase() ?? "?";

  // Build breadcrumb from pathname
  const segments = pathname.replace(/^\//, "").split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => ({
    label: LABELS[seg] ?? seg,
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return (
    <header className="h-14 border-b bg-white flex items-center gap-3 px-4 shrink-0 sticky top-0 z-20">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm flex-1 min-w-0 overflow-hidden">
        {breadcrumbs.map((crumb, i) => (
          <div key={crumb.href} className="flex items-center gap-1 shrink-0">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            {crumb.isLast ? (
              <span className="font-semibold text-gray-900 truncate max-w-[160px]">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="text-muted-foreground hover:text-gray-700 truncate max-w-[120px]">
                {crumb.label}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Search */}
        <div className={`transition-all duration-200 ${searching ? "w-48" : "w-8"} hidden sm:block`}>
          {searching ? (
            <Input
              autoFocus
              placeholder="Cari..."
              className="h-8 text-sm"
              onBlur={() => setSearching(false)}
            />
          ) : (
            <button
              onClick={() => setSearching(true)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <Search className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 outline-none">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifikasi</span>
              <Badge variant="secondary" className="text-xs">3 baru</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {[
              { title: "Absensi hari ini belum lengkap", time: "5 menit lalu" },
              { title: "Nilai semester ganjil telah difinalisasi", time: "1 jam lalu" },
              { title: "Stok ATK hampir habis", time: "2 jam lalu" },
            ].map((n, i) => (
              <DropdownMenuItem key={i} className="flex flex-col items-start gap-0.5 py-3 cursor-pointer">
                <span className="text-sm font-medium text-gray-900">{n.title}</span>
                <span className="text-xs text-muted-foreground">{n.time}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-sm text-primary">
              Lihat semua notifikasi
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-lg hover:bg-gray-100 transition-colors outline-none">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-gray-900 leading-tight">{user?.name?.split(" ")[0]}</p>
              <p className="text-[11px] text-muted-foreground">{ROLE_LABELS[user?.role] ?? user?.role}</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <p className="font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground font-normal truncate">{user?.email}</p>
              <div className="mt-1">
                <Badge variant="secondary" className="text-xs">{ROLE_LABELS[user?.role]}</Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => {}}>
              <User className="h-4 w-4" />
              <Link href="/dashboard/settings" className="flex-1">Profil Saya</Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => {}}>
              <Settings className="h-4 w-4" />
              <Link href="/dashboard/settings" className="flex-1">Pengaturan</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-red-600 focus:text-red-600 cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4" /> Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
