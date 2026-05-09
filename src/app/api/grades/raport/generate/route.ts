import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { classroomId, semesterId } = await req.json();
  if (!classroomId || !semesterId) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const semester = await prisma.semester.findFirst({
    where: { id: semesterId, academicYear: { schoolId } },
    include: { academicYear: true },
  });
  if (!semester) return NextResponse.json({ error: "Semester not found" }, { status: 404 });

  const students = await prisma.student.findMany({
    where: { classroomId, user: { schoolId } },
    include: {
      user: { select: { name: true } },
      gradeRecords: {
        where: { semesterId },
        include: { subject: { select: { name: true, code: true } } },
      },
      attendanceRecords: {
        where: { semesterId, classroomId },
        select: { status: true },
      },
    },
    orderBy: { user: { name: "asc" } },
  });

  const subjects = await prisma.subject.findMany({
    where: { schoolId, isActive: true },
    orderBy: { name: "asc" },
  });

  // Build raport data
  const raportData = students.map((s) => {
    const subjectScores = subjects.map((subj) => {
      const records = s.gradeRecords.filter((r) => r.subjectId === subj.id);
      const scores = records.map((r) => r.score);
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
      const grade = avg === null ? null : avg >= 90 ? "A" : avg >= 80 ? "B" : avg >= 70 ? "C" : avg >= 60 ? "D" : "E";
      return { subjectId: subj.id, subjectName: subj.name, avg, finalScore: avg, grade };
    });

    const allAvgs = subjectScores.map((ss) => ss.avg).filter((a): a is number => a !== null);
    const overallAvg = allAvgs.length > 0 ? allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length : null;

    const hadir = s.attendanceRecords.filter((r) => r.status === "HADIR").length;
    const sakit = s.attendanceRecords.filter((r) => r.status === "SAKIT").length;
    const izin = s.attendanceRecords.filter((r) => r.status === "IZIN").length;
    const alfa = s.attendanceRecords.filter((r) => r.status === "ALFA").length;

    return {
      studentId: s.id,
      name: s.user.name,
      nis: s.nis,
      subjectScores,
      overallAvg,
      attendance: { hadir, sakit, izin, alfa },
    };
  });

  // Sort by overallAvg desc for ranking
  const sorted = [...raportData].sort((a, b) => (b.overallAvg ?? 0) - (a.overallAvg ?? 0));
  const rankMap = new Map(sorted.map((s, i) => [s.studentId, i + 1]));

  const withRank = raportData.map((s) => ({
    ...s,
    rank: rankMap.get(s.studentId),
    totalStudents: students.length,
  }));

  // Upsert Raport records
  await Promise.all(
    withRank.map(async (r) => {
      const raport = await prisma.raport.upsert({
        where: { studentId_semesterId: { studentId: r.studentId, semesterId } },
        update: {
          rank: r.rank ?? null,
          totalStudents: r.totalStudents,
          attendPresent: r.attendance.hadir,
          attendSick: r.attendance.sakit,
          attendLeave: r.attendance.izin,
          attendAbsent: r.attendance.alfa,
        },
        create: {
          academicYearId: semester.academicYearId,
          semesterId,
          studentId: r.studentId,
          rank: r.rank ?? null,
          totalStudents: r.totalStudents,
          attendPresent: r.attendance.hadir,
          attendSick: r.attendance.sakit,
          attendLeave: r.attendance.izin,
          attendAbsent: r.attendance.alfa,
        },
      });

      // Upsert detail per subject
      await Promise.all(
        r.subjectScores
          .filter((ss) => ss.avg !== null)
          .map((ss) =>
            prisma.raportDetail.upsert({
              where: { raportId_subjectId: { raportId: raport.id, subjectId: ss.subjectId } },
              update: { avgScore: ss.avg!, finalScore: ss.finalScore!, grade: ss.grade },
              create: {
                raportId: raport.id,
                subjectId: ss.subjectId,
                avgScore: ss.avg!,
                finalScore: ss.finalScore!,
                grade: ss.grade,
              },
            })
          )
      );
    })
  );

  return NextResponse.json({ success: true, generated: withRank.length, raports: withRank });
}
