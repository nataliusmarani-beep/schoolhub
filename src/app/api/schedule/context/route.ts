import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [activeSemester, classrooms, subjects, teachers] = await Promise.all([
    prisma.semester.findFirst({
      where: { academicYear: { schoolId }, isActive: true },
      include: { academicYear: { select: { name: true } } },
    }),
    prisma.classroom.findMany({ where: { schoolId }, orderBy: { name: "asc" } }),
    prisma.subject.findMany({ where: { schoolId, isActive: true }, orderBy: { name: "asc" } }),
    prisma.teacher.findMany({
      where: { user: { schoolId } },
      include: { user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  return NextResponse.json({ activeSemester, classrooms, subjects, teachers });
}
