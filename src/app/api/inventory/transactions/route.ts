import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { InventoryTxType } from "@/generated/prisma";

export async function GET(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");

  const txs = await prisma.inventoryTransaction.findMany({
    where: {
      item: { schoolId },
      ...(itemId && { itemId }),
    },
    include: { item: { select: { name: true, code: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(txs);
}

export async function POST(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId, type, quantity, note } = await req.json();
  const qty = Number(quantity);

  const item = await prisma.inventoryItem.findFirst({ where: { id: itemId, schoolId } });
  if (!item) return NextResponse.json({ error: "Item tidak ditemukan" }, { status: 404 });

  let newQty = item.quantity;
  if (type === "MASUK") newQty += qty;
  else if (type === "KELUAR") {
    if (item.quantity < qty) return NextResponse.json({ error: "Stok tidak cukup" }, { status: 400 });
    newQty -= qty;
  }

  const [tx] = await prisma.$transaction([
    prisma.inventoryTransaction.create({
      data: { itemId, type: type as InventoryTxType, quantity: qty, note: note || null },
      include: { item: { select: { name: true, code: true } } },
    }),
    prisma.inventoryItem.update({
      where: { id: itemId },
      data: { quantity: newQty },
    }),
  ]);

  return NextResponse.json(tx, { status: 201 });
}
