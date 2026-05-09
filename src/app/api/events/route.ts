import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  const where: any = { schoolId };
  if (year && month) {
    const from = new Date(Number(year), Number(month) - 1, 1);
    const to = new Date(Number(year), Number(month), 0, 23, 59, 59);
    where.startDate = { lte: to };
    where.endDate = { gte: from };
  }

  const events = await prisma.schoolEvent.findMany({
    where,
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json(events);
}

export async function POST(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, startDate, endDate, isHoliday } = body;
  if (!title || !startDate || !endDate) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const event = await prisma.schoolEvent.create({
    data: {
      schoolId,
      title,
      description: description ?? null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isHoliday: isHoliday ?? false,
    },
  });
  return NextResponse.json(event, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await prisma.schoolEvent.deleteMany({ where: { id, schoolId } });
  return NextResponse.json({ success: true });
}
