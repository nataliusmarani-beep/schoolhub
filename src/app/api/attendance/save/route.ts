import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { classroomId, semesterId, date, records } = body as {
    classroomId: string;
    semesterId: string;
    date: string;
    records: { studentId: string; status: string; notes?: string }[];
  };

  if (!classroomId || !semesterId || !date || !records?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);

  // Upsert each record
  await Promise.all(
    records.map((r) =>
      prisma.attendanceRecord.upsert({
        where: { studentId_date: { studentId: r.studentId, date: dateObj } },
        update: { status: r.status as any, notes: r.notes ?? null },
        create: {
          semesterId,
          classroomId,
          studentId: r.studentId,
          date: dateObj,
          status: r.status as any,
          notes: r.notes ?? null,
        },
      })
    )
  );

  return NextResponse.json({ success: true, count: records.length });
}
