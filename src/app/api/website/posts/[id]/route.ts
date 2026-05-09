import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const post = await prisma.websitePost.findFirst({ where: { id: params.id, schoolId } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const wasPublished = body.isPublished;

  const existing = await prisma.websitePost.findFirst({ where: { id: params.id, schoolId }, select: { isPublished: true, publishedAt: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.websitePost.update({
    where: { id: params.id },
    data: {
      title: body.title,
      slug: body.slug,
      excerpt: body.excerpt ?? null,
      content: body.content,
      coverImage: body.coverImage ?? null,
      tags: body.tags ?? [],
      isPublished: wasPublished,
      publishedAt: wasPublished && !existing.isPublished ? new Date() : existing.publishedAt,
    },
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.websitePost.deleteMany({ where: { id: params.id, schoolId } });
  return NextResponse.json({ success: true });
}
