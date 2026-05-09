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

  if (!classroomId || !semesterId) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const students = await prisma.student.findMany({
    where: { classroomId, user: { schoolId } },
    include: {
      user: { select: { name: true } },
      gradeRecords: {
        where: { semesterId },
        include: { subject: { select: { name: true, code: true } } },
      },
    },
    orderBy: { user: { name: "asc" } },
  });

  const subjects = await prisma.subject.findMany({
    where: { schoolId, isActive: true },
    orderBy: { name: "asc" },
  });

  const result = students.map((s, i) => {
    const bySubject: Record<string, { scores: number[]; avg: number | null }> = {};

    for (const subj of subjects) {
      const records = s.gradeRecords.filter((r) => r.subjectId === subj.id);
      const scores = records.map((r) => r.score);
      bySubject[subj.id] = {
        scores,
        avg: scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null,
      };
    }

    const allAvgs = Object.values(bySubject).map((b) => b.avg).filter((a): a is number => a !== null);
    const overallAvg = allAvgs.length > 0 ? Math.round((allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length) * 10) / 10 : null;

    return {
      no: i + 1,
      studentId: s.id,
      name: s.user.name,
      nis: s.nis ?? "-",
      bySubject,
      overallAvg,
    };
  });

  // Compute rank by overallAvg descending
  const sorted = [...result].sort((a, b) => (b.overallAvg ?? 0) - (a.overallAvg ?? 0));
  const rankMap = new Map(sorted.map((s, i) => [s.studentId, i + 1]));
  const withRank = result.map((s) => ({ ...s, rank: rankMap.get(s.studentId) ?? null }));

  return NextResponse.json({ students: withRank, subjects });
}
