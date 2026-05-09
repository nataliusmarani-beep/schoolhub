"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PenLine, BarChart3, BookOpen } from "lucide-react";
import GradeInput from "@/components/modules/grades/GradeInput";
import GradeRecap from "@/components/modules/grades/GradeRecap";
import RaportGenerator from "@/components/modules/grades/RaportGenerator";

export default function GradesPage() {
  const [tab, setTab] = useState("input");
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Nilai & Raport</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Input nilai, rekap, dan cetak raport siswa</p>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-9">
          <TabsTrigger value="input" className="gap-1.5 text-xs"><PenLine className="h-3.5 w-3.5" /> Input Nilai</TabsTrigger>
          <TabsTrigger value="recap" className="gap-1.5 text-xs"><BarChart3 className="h-3.5 w-3.5" /> Rekap Nilai</TabsTrigger>
          <TabsTrigger value="raport" className="gap-1.5 text-xs"><BookOpen className="h-3.5 w-3.5" /> Generate Raport</TabsTrigger>
        </TabsList>
        <TabsContent value="input" className="mt-4"><GradeInput /></TabsContent>
        <TabsContent value="recap" className="mt-4"><GradeRecap /></TabsContent>
        <TabsContent value="raport" className="mt-4"><RaportGenerator /></TabsContent>
      </Tabs>
    </div>
  );
}
