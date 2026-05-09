// Returns students in a classroom + existing attendance for a date
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classroomId = searchParams.get("classroomId");
  const date = searchParams.get("date"); // "YYYY-MM-DD"

  if (!classroomId || !date) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const students = await prisma.student.findMany({
    where: { classroomId, user: { schoolId } },
    include: { user: { select: { name: true } } },
    orderBy: { user: { name: "asc" } },
  });

  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);

  const existing = await prisma.attendanceRecord.findMany({
    where: {
      classroomId,
      date: dateObj,
    },
    select: { studentId: true, status: true, notes: true },
  });

  const existingMap = new Map(existing.map((r) => [r.studentId, r]));

  const result = students.map((s, i) => ({
    studentId: s.id,
    no: i + 1,
    name: s.user.name,
    nis: s.nis ?? "-",
    status: existingMap.get(s.id)?.status ?? "HADIR",
    notes: existingMap.get(s.id)?.notes ?? "",
  }));

  return NextResponse.json(result);
}
