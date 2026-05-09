import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.websiteGallery.findMany({
    where: { schoolId },
    orderBy: [{ albumName: "asc" }, { sortOrder: "asc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { albumName, imageUrl, caption, sortOrder } = body;
  if (!albumName || !imageUrl) return NextResponse.json({ error: "albumName and imageUrl required" }, { status: 400 });

  const item = await prisma.websiteGallery.create({
    data: { schoolId, albumName, imageUrl, caption: caption ?? null, sortOrder: sortOrder ?? 0 },
  });
  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await prisma.websiteGallery.deleteMany({ where: { id, schoolId } });
  return NextResponse.json({ success: true });
}
