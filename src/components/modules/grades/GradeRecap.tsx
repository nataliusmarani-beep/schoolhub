"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download, Printer, Loader2, Trophy } from "lucide-react";
import { exportToExcel, printElement } from "@/lib/export";

interface SubjectInfo { id: string; name: string; code: string }
interface StudentRecap {
  no: number; studentId: string; name: string; nis: string;
  bySubject: Record<string, { scores: number[]; avg: number | null }>;
  overallAvg: number | null; rank: number | null;
}

interface Semester { id: string; type: string; academicYear: { name: string } }
interface Classroom { id: string; name: string }

const AvgCell = ({ avg }: { avg: number | null }) => {
  if (avg === null) return <span className="text-muted-foreground text-xs">-</span>;
  const cls = avg >= 90 ? "bg-emerald-100 text-emerald-700" : avg >= 75 ? "bg-blue-100 text-blue-700" : avg >= 60 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";
  return <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${cls}`}>{avg.toFixed(1)}</span>;
};

export default function GradeRecap() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [activeSemester, setActiveSemester] = useState<Semester | null>(null);
  const [classroomId, setClassroomId] = useState("");
  const [students, setStudents] = useState<StudentRecap[]>([]);
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/grades/context").then((r) => r.json()).then((d) => {
      setClassrooms(d.classrooms ?? []);
      if (d.activeSemester) setActiveSemester(d.activeSemester);
    });
  }, []);

  const load = useCallback(async () => {
    if (!classroomId || !activeSemester) return;
    setLoading(true);
    const res = await fetch(`/api/grades/recap?classroomId=${classroomId}&semesterId=${activeSemester.id}`);
    const data = await res.json();
    setStudents(data.students ?? []);
    setSubjects(data.subjects ?? []);
    setLoading(false);
  }, [classroomId, activeSemester]);

  useEffect(() => { load(); }, [load]);

  const handleExport = () => {
    const rows = students.map((s) => {
      const row: Record<string, any> = { Peringkat: s.rank, NIS: s.nis, Nama: s.name };
      subjects.forEach((subj) => {
        row[subj.name] = s.bySubject[subj.id]?.avg?.toFixed(1) ?? "-";
      });
      row["Rata-rata"] = s.overallAvg?.toFixed(1) ?? "-";
      return row;
    });
    exportToExcel(rows, `rekap-nilai-${classroomId}`, "Rekap Nilai");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 flex items-end gap-3 flex-wrap">
          <div className="space-y-1">
            <Label>Kelas</Label>
            <select value={classroomId} onChange={(e) => setClassroomId(e.target.value)}
              className="text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 h-9 min-w-[180px]">
              <option value="">Pilih kelas...</option>
              {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      {students.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              Rekap Nilai
              {activeSemester && <Badge variant="secondary" className="ml-2 text-[10px]">{activeSemester.type} {activeSemester.academicYear.name}</Badge>}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={handleExport}>
                <Download className="h-3.5 w-3.5" /> Excel
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => printElement("grade-recap-print")}>
                <Printer className="h-3.5 w-3.5" /> Cetak
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <div id="grade-recap-print" className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2.5 text-left font-semibold text-gray-600 border-b sticky left-0 bg-gray-50 w-8">No</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-gray-600 border-b sticky left-8 bg-gray-50 w-20">NIS</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-gray-600 border-b min-w-[160px]">Nama</th>
                      {subjects.map((subj) => (
                        <th key={subj.id} className="px-2 py-2.5 text-center font-semibold text-gray-600 border-b whitespace-nowrap">{subj.code}</th>
                      ))}
                      <th className="px-3 py-2.5 text-center font-semibold text-gray-600 border-b">Rata-rata</th>
                      <th className="px-3 py-2.5 text-center font-semibold text-gray-600 border-b">Peringkat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {students.map((s) => (
                      <tr key={s.studentId} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-muted-foreground sticky left-0 bg-white">{s.no}</td>
                        <td className="px-3 py-2 font-mono text-muted-foreground sticky left-8 bg-white">{s.nis}</td>
                        <td className="px-3 py-2 font-medium text-gray-900 min-w-[160px]">{s.name}</td>
                        {subjects.map((subj) => (
                          <td key={subj.id} className="px-2 py-2 text-center">
                            <AvgCell avg={s.bySubject[subj.id]?.avg ?? null} />
                          </td>
                        ))}
                        <td className="px-3 py-2 text-center">
                          <AvgCell avg={s.overallAvg} />
                        </td>
                        <td className="px-3 py-2 text-center">
                          {s.rank !== null && (
                            <span className={`inline-flex items-center gap-1 font-bold text-xs ${s.rank === 1 ? "text-yellow-500" : s.rank <= 3 ? "text-gray-500" : "text-gray-700"}`}>
                              {s.rank <= 3 && <Trophy className="h-3 w-3" />}
                              {s.rank}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
