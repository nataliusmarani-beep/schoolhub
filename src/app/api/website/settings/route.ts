import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { name: true, slug: true, logo: true, address: true, phone: true, email: true, website: true, city: true, province: true, type: true },
  });
  return NextResponse.json(school);
}

export async function PUT(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, logo, address, phone, email, website } = body;

  await prisma.school.update({
    where: { id: schoolId },
    data: { name, logo, address, phone, email, website },
  });
  return NextResponse.json({ success: true });
}
