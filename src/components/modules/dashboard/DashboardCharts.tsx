"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const ATTENDANCE_COLORS: Record<string, string> = {
  Hadir: "#10b981",
  Sakit: "#f59e0b",
  Izin: "#6366f1",
  Alfa: "#ef4444",
};

type AttendanceDay = {
  name: string;
  date: string;
  Hadir: number;
  Sakit: number;
  Izin: number;
  Alfa: number;
};

type GradeSlice = { name: string; value: number };

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <Skeleton className="h-52 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-900 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-1.5 py-0.5">
          <span className="h-2 w-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-medium text-gray-900">{p.value}</span>
        </div>
      ))}
    </div>
  );
}


export default function DashboardCharts() {
  const [attendance, setAttendance] = useState<AttendanceDay[] | null>(null);
  const [grades, setGrades] = useState<GradeSlice[] | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/attendance-chart")
      .then((r) => r.json())
      .then(setAttendance)
      .catch(() => setAttendance([]));

    fetch("/api/dashboard/grade-distribution")
      .then((r) => r.json())
      .then(setGrades)
      .catch(() => setGrades([]));
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Attendance bar chart - 2/3 width */}
      <div className="lg:col-span-2">
        {attendance === null ? (
          <ChartSkeleton />
        ) : (
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">Kehadiran 7 Hari Terakhir</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {attendance.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">
                  Belum ada data kehadiran.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={attendance} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    />
                    {["Hadir", "Sakit", "Izin", "Alfa"].map((key) => (
                      <Bar key={key} dataKey={key} stackId="a" fill={ATTENDANCE_COLORS[key]} radius={key === "Alfa" ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Grade distribution donut - 1/3 width */}
      <div>
        {grades === null ? (
          <ChartSkeleton />
        ) : (
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">Komposisi Siswa per Kelas</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {grades.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">
                  Belum ada data siswa.
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={grades}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={72}
                        dataKey="value"
                        labelLine={false}
                      >
                        {grades.map((_entry, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center mt-1">
                    {grades.map((g, i) => (
                      <div key={g.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <span className="h-2 w-2 rounded-full inline-block shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        {g.name}: <span className="font-medium text-gray-900">{g.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
