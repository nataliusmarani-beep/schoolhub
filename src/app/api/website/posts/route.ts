import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const posts = await prisma.websitePost.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, slug, excerpt, content, coverImage, tags, isPublished } = body;
  if (!title || !slug) return NextResponse.json({ error: "title and slug required" }, { status: 400 });

  const post = await prisma.websitePost.create({
    data: {
      schoolId,
      title,
      slug,
      excerpt: excerpt ?? null,
      content: content ?? "",
      coverImage: coverImage ?? null,
      tags: tags ?? [],
      isPublished: isPublished ?? false,
      publishedAt: isPublished ? new Date() : null,
    },
  });
  return NextResponse.json(post, { status: 201 });
}
