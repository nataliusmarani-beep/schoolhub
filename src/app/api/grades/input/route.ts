import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const classroomId = searchParams.get("classroomId");
  const subjectId = searchParams.get("subjectId");
  const semesterId = searchParams.get("semesterId");
  const type = searchParams.get("type");

  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!classroomId || !subjectId || !semesterId || !type) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const students = await prisma.student.findMany({
    where: { classroomId, user: { schoolId } },
    include: { user: { select: { name: true } } },
    orderBy: { user: { name: "asc" } },
  });

  const studentIds = students.map((s) => s.id);
  const existing = await prisma.gradeRecord.findMany({
    where: { semesterId, subjectId, type: type as any, studentId: { in: studentIds } },
    select: { studentId: true, score: true, notes: true },
  });

  const existingMap = new Map(existing.map((r) => [r.studentId, r]));

  const result = students.map((s, i) => ({
    no: i + 1,
    studentId: s.id,
    name: s.user.name,
    nis: s.nis ?? "-",
    score: existingMap.get(s.id)?.score ?? null,
    notes: existingMap.get(s.id)?.notes ?? "",
  }));

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { semesterId, subjectId, type, records } = body as {
    semesterId: string;
    subjectId: string;
    type: string;
    records: { studentId: string; score: number | null; notes?: string }[];
  };

  if (!semesterId || !subjectId || !type || !records?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const validRecords = records.filter((r) => r.score !== null && r.score !== undefined && !isNaN(Number(r.score)));
  const studentIds = validRecords.map((r) => r.studentId);

  // Delete existing then re-insert (no unique index on studentId+semesterId+subjectId+type)
  await prisma.gradeRecord.deleteMany({
    where: { semesterId, subjectId, type: type as any, studentId: { in: studentIds } },
  });

  await prisma.gradeRecord.createMany({
    data: validRecords.map((r) => ({
      semesterId,
      subjectId,
      studentId: r.studentId,
      type: type as any,
      score: Number(r.score),
      notes: r.notes ?? null,
    })),
  });

  return NextResponse.json({ success: true, saved: validRecords.length });
}
