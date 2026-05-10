import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { LeaveStatus } from "@/generated/prisma";

export async function GET(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  const userId = (session?.user as any)?.id;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const requests = await prisma.leaveRequest.findMany({
    where: {
      user: { schoolId },
      ...(status && { status: status as LeaveStatus }),
    },
    include: {
      user: { select: { name: true, role: true } },
      reviewer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}

export async function POST(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  const userId = (session?.user as any)?.id;
  if (!schoolId || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, startDate, endDate, reason } = await req.json();

  const employee = await prisma.employee.findFirst({ where: { userId, schoolId } });

  const request = await prisma.leaveRequest.create({
    data: {
      userId,
      employeeId: employee?.id ?? null,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason: reason || null,
      status: "PENDING",
    },
    include: {
      user: { select: { name: true, role: true } },
      reviewer: { select: { name: true } },
    },
  });

  return NextResponse.json(request, { status: 201 });
}

export async function PUT(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  const userId = (session?.user as any)?.id;
  if (!schoolId || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, status } = await req.json();

  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: {
      status: status as LeaveStatus,
      reviewedBy: userId,
      reviewedAt: new Date(),
    },
    include: {
      user: { select: { name: true, role: true } },
      reviewer: { select: { name: true } },
    },
  });

  return NextResponse.json(updated);
}
