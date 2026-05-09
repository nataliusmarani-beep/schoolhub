import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Topbar from "@/components/shared/Topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, GraduationCap, Package, CalendarCheck, TrendingUp, AlertTriangle } from "lucide-react";

async function getStats(schoolId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [students, teachers, inventoryLow, presentToday, recentAnnouncements] = await Promise.all([
    prisma.student.count({ where: { user: { schoolId } } }),
    prisma.user.count({ where: { schoolId, role: "TEACHER", isActive: true } }),
    prisma.inventoryItem.count({ where: { schoolId, quantity: { lte: prisma.inventoryItem.fields.minThreshold } } }),
    prisma.attendanceRecord.count({ where: { student: { user: { schoolId } }, date: today, status: "HADIR" } }),
    prisma.announcement.findMany({
      where: { schoolId },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const lowStockCount = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM "InventoryItem"
    WHERE "schoolId" = ${schoolId} AND quantity <= "minThreshold"
  `;

  return {
    students,
    teachers,
    inventoryLow: Number(lowStockCount[0]?.count ?? 0),
    presentToday,
    recentAnnouncements,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user as any;
  const stats = await getStats(user?.schoolId);

  const statCards = [
    { label: "Total Siswa", value: stats.students, icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Guru Aktif", value: stats.teachers, icon: Users, color: "text-green-600", bg: "bg-green-50" },
    { label: "Hadir Hari Ini", value: stats.presentToday, icon: CalendarCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Inventaris Kritis", value: stats.inventoryLow, icon: Package, color: "text-orange-600", bg: "bg-orange-50", alert: stats.inventoryLow > 0 },
  ];

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title="Dashboard" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Selamat datang, {user?.name?.split(" ")[0]} 👋
          </h2>
          <p className="text-sm text-muted-foreground">{user?.schoolName}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`${s.bg} p-3 rounded-xl`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
                {s.alert && <AlertTriangle className="h-4 w-4 text-orange-500 ml-auto" />}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Pengumuman Terbaru</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.recentAnnouncements.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada pengumuman.</p>
              ) : (
                stats.recentAnnouncements.map((a) => (
                  <div key={a.id} className="border-b last:border-0 pb-3 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900">{a.title}</p>
                      <Badge variant="secondary" className="text-xs shrink-0">{a.audience}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.body}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {a.author?.name} · {new Date(a.createdAt).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Aksi Cepat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Catat Absensi", href: "/dashboard/attendance", icon: CalendarCheck, color: "bg-emerald-50 text-emerald-700" },
                  { label: "Input Nilai", href: "/dashboard/grades", icon: TrendingUp, color: "bg-blue-50 text-blue-700" },
                  { label: "Inventaris", href: "/dashboard/inventory", icon: Package, color: "bg-orange-50 text-orange-700" },
                  { label: "Data Siswa", href: "/dashboard/students", icon: GraduationCap, color: "bg-purple-50 text-purple-700" },
                ].map((q) => (
                  <a key={q.label} href={q.href} className={`flex flex-col items-center gap-2 p-4 rounded-xl ${q.color} hover:opacity-80 transition-opacity text-center`}>
                    <q.icon className="h-6 w-6" />
                    <span className="text-xs font-medium">{q.label}</span>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
