import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");
  const date = dateParam ? new Date(dateParam) : new Date();
  date.setHours(0, 0, 0, 0);

  const classrooms = await prisma.classroom.findMany({
    where: { schoolId },
    include: {
      students: true,
      attendanceRecords: {
        where: { date },
        select: { status: true },
      },
      gradeLevel: { select: { level: true } },
    },
    orderBy: { name: "asc" },
  });

  const result = classrooms.map((c) => {
    const total = c.students.length;
    const hadir = c.attendanceRecords.filter((r) => r.status === "HADIR").length;
    const sakit = c.attendanceRecords.filter((r) => r.status === "SAKIT").length;
    const izin = c.attendanceRecords.filter((r) => r.status === "IZIN").length;
    const alfa = c.attendanceRecords.filter((r) => r.status === "ALFA").length;
    const recorded = hadir + sakit + izin + alfa;
    return {
      classroomId: c.id,
      name: c.name,
      level: c.gradeLevel.level,
      total,
      hadir,
      sakit,
      izin,
      alfa,
      recorded,
      pct: recorded > 0 ? Math.round((hadir / recorded) * 100) : null,
    };
  });

  return NextResponse.json(result);
}
