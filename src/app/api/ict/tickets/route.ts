import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { TicketStatus, TicketPriority } from "@/generated/prisma";

export async function GET(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const tickets = await prisma.iTTicket.findMany({
    where: {
      schoolId,
      ...(status && { status: status as TicketStatus }),
    },
    include: {
      createdBy: { select: { name: true } },
      assignedTo: { select: { name: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(tickets);
}

export async function POST(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  const userId = (session?.user as any)?.id;
  if (!schoolId || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description, priority } = await req.json();

  const ticket = await prisma.iTTicket.create({
    data: {
      schoolId,
      createdById: userId,
      title,
      description,
      priority: (priority as TicketPriority) ?? "MEDIUM",
      status: "OPEN",
    },
    include: {
      createdBy: { select: { name: true } },
      assignedTo: { select: { name: true } },
    },
  });

  return NextResponse.json(ticket, { status: 201 });
}

export async function PUT(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, status, assignedToId, notes } = await req.json();

  const ticket = await prisma.iTTicket.findFirst({ where: { id, schoolId } });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.iTTicket.update({
    where: { id },
    data: {
      ...(status && { status: status as TicketStatus }),
      ...(assignedToId !== undefined && { assignedToId: assignedToId || null }),
      ...(notes !== undefined && { description: ticket.description + (notes ? `\n\n[Note] ${notes}` : "") }),
      ...(status === "RESOLVED" && { resolvedAt: new Date() }),
    },
    include: {
      createdBy: { select: { name: true } },
      assignedTo: { select: { name: true } },
    },
  });

  return NextResponse.json(updated);
}
