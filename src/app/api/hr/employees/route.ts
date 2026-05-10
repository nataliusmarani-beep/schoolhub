import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { EmployeeStatus } from "@/generated/prisma";

export async function GET() {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const employees = await prisma.employee.findMany({
    where: { schoolId },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true, phone: true, role: true } },
    },
    orderBy: { user: { name: "asc" } },
  });

  return NextResponse.json(employees);
}

export async function POST(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, email, phone, role, employeeNumber, position, department, status, joinDate, salary } = body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });

  const hash = await bcrypt.hash("SchoolHub123!", 10);

  const user = await prisma.user.create({
    data: {
      schoolId,
      email,
      name,
      phone: phone || null,
      password: hash,
      role: role ?? "STAFF",
    },
  });

  const employee = await prisma.employee.create({
    data: {
      schoolId,
      userId: user.id,
      employeeNumber: employeeNumber || null,
      position,
      department: department || null,
      status: (status as EmployeeStatus) ?? "ACTIVE",
      joinDate: new Date(joinDate),
      salary: salary ? Number(salary) : null,
    },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true, phone: true, role: true } },
    },
  });

  return NextResponse.json(employee, { status: 201 });
}

export async function PUT(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, name, phone, role, employeeNumber, position, department, status, joinDate, salary } = body;

  const employee = await prisma.employee.findFirst({ where: { id, schoolId } });
  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.user.update({
    where: { id: employee.userId },
    data: { name, phone: phone || null, role },
  });

  const updated = await prisma.employee.update({
    where: { id },
    data: {
      employeeNumber: employeeNumber || null,
      position,
      department: department || null,
      status: status as EmployeeStatus,
      joinDate: new Date(joinDate),
      salary: salary ? Number(salary) : null,
    },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true, phone: true, role: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  const employee = await prisma.employee.findFirst({ where: { id, schoolId } });
  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.user.delete({ where: { id: employee.userId } });

  return NextResponse.json({ ok: true });
}
