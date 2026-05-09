import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classroomId = searchParams.get("classroomId");
  const semesterId = searchParams.get("semesterId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!classroomId || !semesterId) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const dateFilter: any = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    dateFilter.lte = toDate;
  }

  const students = await prisma.student.findMany({
    where: { classroomId, user: { schoolId } },
    include: {
      user: { select: { name: true } },
      attendanceRecords: {
        where: {
          classroomId,
          semesterId,
          ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
        },
        select: { status: true, date: true },
      },
    },
    orderBy: { user: { name: "asc" } },
  });

  const result = students.map((s, i) => {
    const hadir = s.attendanceRecords.filter((r) => r.status === "HADIR").length;
    const sakit = s.attendanceRecords.filter((r) => r.status === "SAKIT").length;
    const izin = s.attendanceRecords.filter((r) => r.status === "IZIN").length;
    const alfa = s.attendanceRecords.filter((r) => r.status === "ALFA").length;
    const total = hadir + sakit + izin + alfa;
    return {
      no: i + 1,
      studentId: s.id,
      name: s.user.name,
      nis: s.nis ?? "-",
      hadir,
      sakit,
      izin,
      alfa,
      total,
      pct: total > 0 ? Math.round((hadir / total) * 100) : null,
    };
  });

  return NextResponse.json(result);
}
