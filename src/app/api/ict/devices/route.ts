import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { DeviceStatus } from "@/generated/prisma";

export async function GET(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");

  const devices = await prisma.device.findMany({
    where: {
      schoolId,
      ...(type && { type }),
      ...(status && { status: status as DeviceStatus }),
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(devices);
}

export async function POST(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, type, brand, model, serialNumber, assetTag, status, location, assignedTo, purchaseDate, warrantyUntil, notes } = body;

  const device = await prisma.device.create({
    data: {
      schoolId,
      name,
      type,
      brand: brand || null,
      model: model || null,
      serialNumber: serialNumber || null,
      assetTag: assetTag || null,
      status: (status as DeviceStatus) ?? "ACTIVE",
      location: location || null,
      assignedTo: assignedTo || null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      warrantyUntil: warrantyUntil ? new Date(warrantyUntil) : null,
      notes: notes || null,
    },
  });

  return NextResponse.json(device, { status: 201 });
}

export async function PUT(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, name, type, brand, model, serialNumber, assetTag, status, location, assignedTo, purchaseDate, warrantyUntil, notes } = body;

  const device = await prisma.device.findFirst({ where: { id, schoolId } });
  if (!device) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.device.update({
    where: { id },
    data: {
      name,
      type,
      brand: brand || null,
      model: model || null,
      serialNumber: serialNumber || null,
      assetTag: assetTag || null,
      status: status as DeviceStatus,
      location: location || null,
      assignedTo: assignedTo || null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      warrantyUntil: warrantyUntil ? new Date(warrantyUntil) : null,
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
  const device = await prisma.device.findFirst({ where: { id, schoolId } });
  if (!device) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.device.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
