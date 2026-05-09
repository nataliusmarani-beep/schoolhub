import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pages = await prisma.websitePage.findMany({
    where: { schoolId },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(pages);
}

export async function POST(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, slug, content, isPublished } = body;

  if (!title || !slug) return NextResponse.json({ error: "title and slug required" }, { status: 400 });

  const page = await prisma.websitePage.create({
    data: { schoolId, title, slug, content: content ?? "", isPublished: isPublished ?? false },
  });
  return NextResponse.json(page, { status: 201 });
}
