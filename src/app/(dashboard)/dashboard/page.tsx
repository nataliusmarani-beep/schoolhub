import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, GraduationCap, Package, CalendarCheck, TrendingUp,
  AlertTriangle, UserCheck, BookOpen, Megaphone,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import DashboardCharts from "@/components/modules/dashboard/DashboardCharts";
import AbsentTodayTable from "@/components/modules/dashboard/AbsentTodayTable";

// ─── Stats (server) ────────────────────────────────────────────────────────────

async function getStats(schoolId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [students, teachers, activeAnnouncements, presentToday, absentToday, recentAnnouncements] =
    await Promise.all([
      prisma.student.count({ where: { user: { schoolId } } }),
      prisma.user.count({ where: { schoolId, role: "TEACHER", isActive: true } }),
      prisma.announcement.count({ where: { schoolId } }),
      prisma.attendanceRecord.count({
        where: { student: { user: { schoolId } }, date: today, status: "HADIR" },
      }),
      prisma.attendanceRecord.count({
        where: {
          student: { user: { schoolId } },
          date: today,
          status: { in: ["ALFA", "SAKIT", "IZIN"] },
        },
      }),
      prisma.announcement.findMany({
        where: { schoolId },
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
    ]);

  const totalToday = presentToday + absentToday;
  const attendancePct = totalToday > 0 ? Math.round((presentToday / totalToday) * 100) : null;

  return { students, teachers, activeAnnouncements, presentToday, attendancePct, recentAnnouncements };
}

async function getLowStock(schoolId: string): Promise<number> {
  try {
    const res = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "InventoryItem"
      WHERE "schoolId" = ${schoolId} AND quantity <= "minThreshold"
    `;
    return Number((res as any[])[0]?.count ?? 0);
  } catch {
    return 0;
  }
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-3 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

async function StatsSection({ schoolId }: { schoolId: string }) {
  const [stats, lowStock] = await Promise.all([
    getStats(schoolId),
    getLowStock(schoolId),
  ]);

  const cards = [
    {
      label: "Total Siswa",
      value: stats.students,
      icon: GraduationCap,
      color: "text-blue-600",
      bg: "bg-blue-50",
      href: "/dashboard/students",
    },
    {
      label: "Guru Aktif",
      value: stats.teachers,
      icon: Users,
      color: "text-violet-600",
      bg: "bg-violet-50",
      href: "/dashboard/hr/employees",
    },
    {
      label: "Kehadiran Hari Ini",
      value: stats.attendancePct !== null ? `${stats.attendancePct}%` : `${stats.presentToday}`,
      icon: UserCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      href: "/dashboard/attendance",
    },
    {
      label: "Pengumuman Aktif",
      value: stats.activeAnnouncements,
      icon: Megaphone,
      color: "text-pink-600",
      bg: "bg-pink-50",
      href: "/dashboard/announcements",
    },
    {
      label: "Inventaris Kritis",
      value: lowStock,
      icon: Package,
      color: "text-orange-600",
      bg: "bg-orange-50",
      href: "/dashboard/inventory",
      alert: lowStock > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
      {cards.map((s) => (
        <Link key={s.label} href={s.href}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`${s.bg} p-3 rounded-xl shrink-0`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold text-gray-900 leading-tight">{s.value}</p>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">{s.label}</p>
              </div>
              {s.alert && lowStock > 0 && (
                <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

async function AnnouncementsSection({ schoolId }: { schoolId: string }) {
  const announcements = await prisma.announcement.findMany({
    where: { schoolId },
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  return (
    <Card>
      <CardHeader className="pb-3 pt-4 px-4 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold">Pengumuman Terbaru</CardTitle>
        <Link href="/dashboard/announcements" className="text-xs text-primary hover:underline">
          Lihat semua
        </Link>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
            <BookOpen className="h-8 w-8 opacity-30" />
            <p className="text-sm">Belum ada pengumuman.</p>
          </div>
        ) : (
          announcements.map((a) => (
            <div key={a.id} className="flex gap-3 border-b last:border-0 pb-3 last:pb-0">
              <div className="bg-primary/10 rounded-lg p-2 h-fit shrink-0">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-900 flex-1">{a.title}</p>
                  <Badge variant="secondary" className="text-[10px] shrink-0">{a.audience}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.body}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {a.author?.name} · {new Date(a.createdAt).toLocaleDateString("id-ID")}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

const quickActions = [
  { label: "Catat Absensi", href: "/dashboard/attendance", icon: CalendarCheck, color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100" },
  { label: "Input Nilai", href: "/dashboard/grades", icon: TrendingUp, color: "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100" },
  { label: "Barang & Aset", href: "/dashboard/inventory", icon: Package, color: "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-100" },
  { label: "Data Siswa", href: "/dashboard/students", icon: GraduationCap, color: "bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-100" },
  { label: "Jadwal", href: "/dashboard/schedule", icon: CalendarCheck, color: "bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-100" },
  { label: "Pengumuman", href: "/dashboard/announcements", icon: Megaphone, color: "bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-100" },
];

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user as any;
  const schoolId = user?.schoolId as string;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Selamat datang, {user?.name?.split(" ")[0]}! 👋
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {user?.schoolName} ·{" "}
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Stats cards */}
      <Suspense
        fallback={
          <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => <StatCardSkeleton key={i} />)}
          </div>
        }
      >
        <StatsSection schoolId={schoolId} />
      </Suspense>

      {/* Charts — client component, loads its own data */}
      <DashboardCharts />

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <Card>
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-3 gap-2">
              {quickActions.map((q) => (
                <Link
                  key={q.label}
                  href={q.href}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl ${q.color} transition-colors text-center`}
                >
                  <q.icon className="h-5 w-5" />
                  <span className="text-[11px] font-medium leading-tight">{q.label}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Absent today */}
        <AbsentTodayTable />

        {/* Announcements */}
        <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
          <AnnouncementsSection schoolId={schoolId} />
        </Suspense>
      </div>
    </div>
  );
}
