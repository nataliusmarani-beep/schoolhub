"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, BarChart3, CalendarCheck } from "lucide-react";
import AttendanceInput from "@/components/modules/attendance/AttendanceInput";
import AttendanceRecap from "@/components/modules/attendance/AttendanceRecap";
import AttendanceDaily from "@/components/modules/attendance/AttendanceDaily";

export default function AttendancePage() {
  const [tab, setTab] = useState("input");

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Absensi Siswa</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Input dan rekap kehadiran siswa</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-9">
          <TabsTrigger value="input" className="gap-1.5 text-xs">
            <ClipboardList className="h-3.5 w-3.5" /> Input Absensi
          </TabsTrigger>
          <TabsTrigger value="recap" className="gap-1.5 text-xs">
            <BarChart3 className="h-3.5 w-3.5" /> Rekap Absensi
          </TabsTrigger>
          <TabsTrigger value="daily" className="gap-1.5 text-xs">
            <CalendarCheck className="h-3.5 w-3.5" /> Laporan Harian
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="mt-4">
          <AttendanceInput />
        </TabsContent>
        <TabsContent value="recap" className="mt-4">
          <AttendanceRecap />
        </TabsContent>
        <TabsContent value="daily" className="mt-4">
          <AttendanceDaily />
        </TabsContent>
      </Tabs>
    </div>
  );
}
