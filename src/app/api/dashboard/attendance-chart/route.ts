import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Last 7 days including today
  const days: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(d);
  }

  const from = days[0];
  const to = new Date(days[6]);
  to.setHours(23, 59, 59, 999);

  const records = await prisma.attendanceRecord.findMany({
    where: {
      student: { user: { schoolId } },
      date: { gte: from, lte: to },
    },
    select: { date: true, status: true },
  });

  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const data = days.map((day) => {
    const dayRecords = records.filter(
      (r) => new Date(r.date).toDateString() === day.toDateString()
    );
    return {
      name: dayNames[day.getDay()],
      date: day.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      Hadir: dayRecords.filter((r) => r.status === "HADIR").length,
      Sakit: dayRecords.filter((r) => r.status === "SAKIT").length,
      Izin: dayRecords.filter((r) => r.status === "IZIN").length,
      Alfa: dayRecords.filter((r) => r.status === "ALFA").length,
    };
  });

  return NextResponse.json(data);
}
