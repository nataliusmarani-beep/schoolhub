import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AttendanceStatus } from "@/generated/prisma";

export async function GET(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const month = searchParams.get("month"); // "2025-01"

  if (date) {
    // Single day: return all employees + their attendance for that date
    const employees = await prisma.employee.findMany({
      where: { schoolId },
      include: {
        user: { select: { name: true } },
        attendanceRecords: {
          where: { date: new Date(date) },
        },
      },
      orderBy: { user: { name: "asc" } },
    });

    return NextResponse.json(
      employees.map((e) => ({
        employeeId: e.id,
        name: e.user.name,
        position: e.position,
        status: e.attendanceRecords[0]?.status ?? "HADIR",
        notes: e.attendanceRecords[0]?.notes ?? "",
      }))
    );
  }

  if (month) {
    // Monthly recap: [year]-[month]
    const [year, mon] = month.split("-").map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 0, 23, 59, 59);

    const employees = await prisma.employee.findMany({
      where: { schoolId },
      include: {
        user: { select: { name: true } },
        attendanceRecords: {
          where: { date: { gte: start, lte: end } },
        },
      },
      orderBy: { user: { name: "asc" } },
    });

    return NextResponse.json(
      employees.map((e) => {
        const counts = { HADIR: 0, SAKIT: 0, IZIN: 0, ALFA: 0 };
        e.attendanceRecords.forEach((r) => { counts[r.status] = (counts[r.status] || 0) + 1; });
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        return {
          employeeId: e.id,
          name: e.user.name,
          position: e.position,
          ...counts,
          total,
          pct: total > 0 ? Math.round((counts.HADIR / total) * 100) : 0,
        };
      })
    );
  }

  return NextResponse.json({ error: "date or month required" }, { status: 400 });
}

export async function POST(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date, records } = await req.json();
  const dateObj = new Date(date);

  const ops = (records as { employeeId: string; status: string; notes?: string }[]).map((r) =>
    prisma.employeeAttendance.upsert({
      where: { employeeId_date: { employeeId: r.employeeId, date: dateObj } },
      update: { status: r.status as AttendanceStatus, notes: r.notes ?? null },
      create: { employeeId: r.employeeId, date: dateObj, status: r.status as AttendanceStatus, notes: r.notes ?? null },
    })
  );

  await prisma.$transaction(ops);
  return NextResponse.json({ ok: true });
}
