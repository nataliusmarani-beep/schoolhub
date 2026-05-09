import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const [
    students,
    teachers,
    activeAnnouncements,
    presentToday,
    presentYesterday,
    lowStockItems,
    absentToday,
  ] = await Promise.all([
    prisma.student.count({ where: { user: { schoolId } } }),
    prisma.user.count({ where: { schoolId, role: "TEACHER", isActive: true } }),
    prisma.announcement.count({ where: { schoolId } }),
    prisma.attendanceRecord.count({
      where: { student: { user: { schoolId } }, date: today, status: "HADIR" },
    }),
    prisma.attendanceRecord.count({
      where: { student: { user: { schoolId } }, date: yesterday, status: "HADIR" },
    }),
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "InventoryItem"
      WHERE "schoolId" = ${schoolId} AND quantity <= "minThreshold"
    `.then((r: any[]) => Number(r[0]?.count ?? 0)).catch(() => 0),
    prisma.attendanceRecord.count({
      where: {
        student: { user: { schoolId } },
        date: today,
        status: { in: ["ALFA", "SAKIT", "IZIN"] },
      },
    }),
  ]);

  const totalRecordsToday = presentToday + absentToday;
  const attendancePct = totalRecordsToday > 0
    ? Math.round((presentToday / totalRecordsToday) * 100)
    : null;

  const pctYesterday = presentYesterday > 0 ? presentYesterday : null;

  return NextResponse.json({
    students,
    teachers,
    activeAnnouncements,
    presentToday,
    attendancePct,
    pctYesterday,
    lowStockItems: typeof lowStockItems === "number" ? lowStockItems : 0,
    absentToday,
  });
}
