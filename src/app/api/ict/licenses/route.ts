import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const licenses = await prisma.license.findMany({
    where: { schoolId },
    orderBy: { software: "asc" },
  });

  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return NextResponse.json(
    licenses.map((l) => ({
      ...l,
      expiring: l.expiresAt ? l.expiresAt <= in30 : false,
      expired: l.expiresAt ? l.expiresAt < now : false,
    }))
  );
}

export async function POST(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { software, licenseKey, seats, usedSeats, vendor, expiresAt, notes } = await req.json();

  const license = await prisma.license.create({
    data: {
      schoolId,
      software,
      licenseKey: licenseKey || null,
      seats: Number(seats) || 1,
      usedSeats: Number(usedSeats) || 0,
      vendor: vendor || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      notes: notes || null,
    },
  });

  return NextResponse.json(license, { status: 201 });
}

export async function PUT(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, software, licenseKey, seats, usedSeats, vendor, expiresAt, notes } = await req.json();

  const existing = await prisma.license.findFirst({ where: { id, schoolId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.license.update({
    where: { id },
    data: {
      software,
      licenseKey: licenseKey || null,
      seats: Number(seats),
      usedSeats: Number(usedSeats),
      vendor: vendor || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      notes: notes || null,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  const existing = await prisma.license.findFirst({ where: { id, schoolId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.license.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
