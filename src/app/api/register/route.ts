import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { SchoolType, UserRole } from "@/generated/prisma";

export async function POST(req: Request) {
  const { schoolName, schoolSlug, schoolType, adminName, email, password } = await req.json();

  if (!schoolName || !schoolSlug || !adminName || !email || !password) {
    return NextResponse.json({ error: "Semua field wajib diisi." }, { status: 400 });
  }

  const slugExists = await prisma.school.findUnique({ where: { slug: schoolSlug } });
  if (slugExists) {
    return NextResponse.json({ error: "Slug sudah digunakan." }, { status: 409 });
  }

  const emailExists = await prisma.user.findUnique({ where: { email } });
  if (emailExists) {
    return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
  }

  const hash = await bcrypt.hash(password, 10);

  const school = await prisma.school.create({
    data: {
      name: schoolName,
      slug: schoolSlug,
      type: (schoolType as SchoolType) ?? SchoolType.SMA,
      users: {
        create: {
          name: adminName,
          email,
          password: hash,
          role: UserRole.SCHOOL_ADMIN,
        },
      },
    },
  });

  return NextResponse.json({ ok: true, schoolId: school.id }, { status: 201 });
}
