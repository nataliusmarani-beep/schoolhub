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

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const schoolId = (session.user as any).schoolId;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";

  const items = await prisma.inventoryItem.findMany({
    where: {
      schoolId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(categoryId && { categoryId }),
    },
    include: { category: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(items.map(enrich));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const schoolId = (session.user as any).schoolId;

  const body = await req.json();
  const { name, code, categoryId, quantity, unit, minThreshold, location, condition, description, purchaseDate, purchasePrice } = body;

  const item = await prisma.inventoryItem.create({
    data: {
      schoolId,
      name,
      code: code || null,
      categoryId: categoryId || null,
      quantity: Number(quantity),
      unit,
      minThreshold: Number(minThreshold),
      location: location || null,
      condition: (condition as ItemCondition) ?? ItemCondition.BAIK,
      description: description || null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      purchasePrice: purchasePrice ? Number(purchasePrice) : null,
    },
    include: { category: true },
  });

  return NextResponse.json(enrich(item), { status: 201 });
}
