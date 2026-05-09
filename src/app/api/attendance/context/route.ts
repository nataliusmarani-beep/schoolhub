// Returns classrooms + active semester for the attendance input form
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const activeSemester = await prisma.semester.findFirst({
    where: { academicYear: { schoolId }, isActive: true },
    include: { academicYear: { select: { name: true } } },
  });

  const classrooms = await prisma.classroom.findMany({
    where: { schoolId },
    include: { gradeLevel: { select: { level: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ activeSemester, classrooms });
}
