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
  const teacherId = searchParams.get("teacherId");

  const where: any = { classroom: { schoolId } };
  if (semesterId) where.semesterId = semesterId;
  if (classroomId) where.classroomId = classroomId;
  if (teacherId) where.teacherId = teacherId;

  const schedules = await prisma.schedule.findMany({
    where,
    include: {
      subject: { select: { name: true, code: true } },
      teacher: { include: { user: { select: { name: true } } } },
      classroom: { select: { name: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(schedules);
}

export async function POST(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { semesterId, classroomId, subjectId, teacherId, dayOfWeek, startTime, endTime, room } = body;

  if (!semesterId || !classroomId || !subjectId || !teacherId || !dayOfWeek || !startTime || !endTime) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Conflict detection: same teacher at same time
  const teacherConflict = await prisma.schedule.findFirst({
    where: {
      semesterId,
      teacherId,
      dayOfWeek: Number(dayOfWeek),
      OR: [
        { startTime: { lte: startTime }, endTime: { gt: startTime } },
        { startTime: { lt: endTime }, endTime: { gte: endTime } },
        { startTime: { gte: startTime }, endTime: { lte: endTime } },
      ],
    },
  });

  if (teacherConflict) {
    return NextResponse.json({ error: "Konflik jadwal: guru sudah memiliki jadwal di waktu yang sama." }, { status: 409 });
  }

  // Conflict: same classroom at same time
  const roomConflict = await prisma.schedule.findFirst({
    where: {
      semesterId,
      classroomId,
      dayOfWeek: Number(dayOfWeek),
      OR: [
        { startTime: { lte: startTime }, endTime: { gt: startTime } },
        { startTime: { lt: endTime }, endTime: { gte: endTime } },
        { startTime: { gte: startTime }, endTime: { lte: endTime } },
      ],
    },
  });

  if (roomConflict) {
    return NextResponse.json({ error: "Konflik jadwal: kelas sudah ada jadwal di waktu yang sama." }, { status: 409 });
  }

  const schedule = await prisma.schedule.create({
    data: {
      semesterId,
      classroomId,
      subjectId,
      teacherId,
      dayOfWeek: Number(dayOfWeek),
      startTime,
      endTime,
      room: room ?? null,
    },
    include: {
      subject: { select: { name: true, code: true } },
      teacher: { include: { user: { select: { name: true } } } },
      classroom: { select: { name: true } },
    },
  });

  return NextResponse.json(schedule, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await prisma.schedule.deleteMany({
    where: { id, classroom: { schoolId } },
  });
  return NextResponse.json({ success: true });
}
