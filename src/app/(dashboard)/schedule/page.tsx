"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid3X3, CalendarDays } from "lucide-react";
import ScheduleGrid from "@/components/modules/schedule/ScheduleGrid";
import SchoolCalendar from "@/components/modules/schedule/SchoolCalendar";

export default function SchedulePage() {
  const [tab, setTab] = useState("grid");
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Jadwal Pelajaran</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Buat dan kelola jadwal pelajaran dan kalender sekolah</p>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-9">
          <TabsTrigger value="grid" className="gap-1.5 text-xs"><Grid3X3 className="h-3.5 w-3.5" /> Jadwal Mingguan</TabsTrigger>
          <TabsTrigger value="calendar" className="gap-1.5 text-xs"><CalendarDays className="h-3.5 w-3.5" /> Kalender Sekolah</TabsTrigger>
        </TabsList>
        <TabsContent value="grid" className="mt-4"><ScheduleGrid /></TabsContent>
        <TabsContent value="calendar" className="mt-4"><SchoolCalendar /></TabsContent>
      </Tabs>
    </div>
  );
}
