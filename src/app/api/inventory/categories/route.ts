import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cats = await prisma.inventoryCategory.findMany({
    where: { schoolId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(cats);
}

export async function POST(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  const cat = await prisma.inventoryCategory.upsert({
    where: { schoolId_name: { schoolId, name } },
    update: {},
    create: { schoolId, name },
  });
  return NextResponse.json(cat, { status: 201 });
}
