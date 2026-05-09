import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const records = await prisma.attendanceRecord.findMany({
    where: {
      student: { user: { schoolId } },
      date: today,
      status: { in: ["ALFA", "SAKIT", "IZIN"] },
    },
    select: {
      id: true,
      status: true,
      notes: true,
      studentId: true,
    },
    take: 10,
  });

  if (records.length === 0) return NextResponse.json([]);

  const studentIds = records.map((r) => r.studentId);
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    include: {
      user: { select: { name: true } },
      classroom: { select: { name: true } },
    },
  });

  const studentMap = new Map(students.map((s) => [s.id, s]));

  const data = records.map((r) => {
    const student = studentMap.get(r.studentId);
    return {
      id: r.id,
      name: student?.user.name ?? "-",
      classroom: student?.classroom?.name ?? "-",
      status: r.status,
      notes: r.notes ?? null,
    };
  });

  return NextResponse.json(data);
}
