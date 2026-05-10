import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period"); // "2025-01"

  if (!period) {
    // Return employees for payroll input (base salary from employee.salary)
    const employees = await prisma.employee.findMany({
      where: { schoolId, status: "ACTIVE" },
      include: { user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    });
    return NextResponse.json(employees.map((e) => ({
      employeeId: e.id,
      name: e.user.name,
      position: e.position,
      baseSalary: e.salary ?? 0,
    })));
  }

  const records = await prisma.payrollRecord.findMany({
    where: {
      period,
      employee: { schoolId },
    },
    include: {
      employee: { include: { user: { select: { name: true } } } },
    },
    orderBy: { employee: { user: { name: "asc" } } },
  });

  return NextResponse.json(records);
}

export async function POST(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { period, records } = await req.json();

  const ops = (records as {
    employeeId: string;
    baseSalary: number;
    allowances: number;
    deductions: number;
    notes?: string;
  }[]).map((r) => {
    const net = r.baseSalary + r.allowances - r.deductions;
    return prisma.payrollRecord.upsert({
      where: { employeeId_period: { employeeId: r.employeeId, period } },
      update: {
        baseSalary: r.baseSalary,
        allowances: r.allowances,
        deductions: r.deductions,
        netSalary: net,
        notes: r.notes ?? null,
      },
      create: {
        employeeId: r.employeeId,
        period,
        baseSalary: r.baseSalary,
        allowances: r.allowances,
        deductions: r.deductions,
        netSalary: net,
        notes: r.notes ?? null,
      },
    });
  });

  await prisma.$transaction(ops);
  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request) {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, isPaid } = await req.json();
  const record = await prisma.payrollRecord.update({
    where: { id },
    data: { isPaid, paidAt: isPaid ? new Date() : null },
  });
  return NextResponse.json(record);
}
