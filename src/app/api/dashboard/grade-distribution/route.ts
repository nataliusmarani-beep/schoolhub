import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gradeLevels = await prisma.gradeLevel.findMany({
    where: { schoolId },
    include: {
      classrooms: {
        include: { _count: { select: { students: true } } },
      },
    },
    orderBy: { level: "asc" },
  });

  const data = gradeLevels.map((gl) => ({
    name: `Kelas ${gl.level}`,
    value: gl.classrooms.reduce((sum: number, c: any) => sum + c._count.students, 0),
  })).filter((d) => d.value > 0);

  return NextResponse.json(data);
}
