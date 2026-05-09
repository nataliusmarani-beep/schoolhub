import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ItemCondition } from "@/generated/prisma";

function enrich(item: any) {
  return {
    ...item,
    status:
      item.quantity === 0
        ? "out_of_stock"
        : item.quantity <= item.minThreshold
        ? "low_stock"
        : "ok",
  };
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, code, categoryId, quantity, unit, minThreshold, location, condition, description } = body;

  const item = await prisma.inventoryItem.update({
    where: { id: params.id },
    data: {
      name,
      code: code || null,
      categoryId: categoryId || null,
      quantity: Number(quantity),
      unit,
      minThreshold: Number(minThreshold),
      location: location || null,
      condition: condition as ItemCondition,
      description: description || null,
    },
    include: { category: true },
  });

  return NextResponse.json(enrich(item));
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.inventoryItem.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
