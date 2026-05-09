"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Printer, Loader2, BookOpen, Trophy } from "lucide-react";

interface Semester { id: string; type: string; academicYear: { name: string } }
interface Classroom { id: string; name: string }
interface SubjectScore { subjectName: string; avg: number | null; finalScore: number | null; grade: string | null }
interface RaportData {
  studentId: string; name: string; nis: string | null;
  subjectScores: SubjectScore[];
  overallAvg: number | null; rank: number | null; totalStudents: number;
  attendance: { hadir: number; sakit: number; izin: number; alfa: number };
}

export default function RaportGenerator() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [activeSemester, setActiveSemester] = useState<Semester | null>(null);
  const [classroomId, setClassroomId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [raports, setRaports] = useState<RaportData[]>([]);
  const [generating, setGenerating] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<RaportData | null>(null);
  const [schoolName, setSchoolName] = useState("");

  useEffect(() => {
    fetch("/api/grades/context").then((r) => r.json()).then((d) => {
      setClassrooms(d.classrooms ?? []);
      if (d.activeSemester) {
        setActiveSemester(d.activeSemester);
        setSemesterId(d.activeSemester.id);
      }
    });
    fetch("/api/website/settings").then((r) => r.json()).then((d) => setSchoolName(d?.name ?? ""));
  }, []);

  const generate = async () => {
    if (!classroomId || !semesterId) return;
    setGenerating(true);
    const res = await fetch("/api/grades/raport/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classroomId, semesterId }),
    });
    const data = await res.json();
    setRaports(data.raports ?? []);
    setGenerating(false);
  };

  const printRaport = (student: RaportData) => {
    setSelectedStudent(student);
    setTimeout(() => window.print(), 300);
  };

  const printAll = () => {
    setSelectedStudent(null);
    setTimeout(() => window.print(), 300);
  };

  const semLabel = activeSemester ? `${activeSemester.type} — ${activeSemester.academicYear.name}` : "";

  return (
    <div className="space-y-4">
      {/* Print styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          .print-raport { display: block !important; }
          .print-raport .raport-card { page-break-after: always; }
        }
        .print-raport { display: none; }
      `}</style>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="space-y-1">
              <Label>Kelas *</Label>
              <select value={classroomId} onChange={(e) => setClassroomId(e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 h-9">
                <option value="">Pilih kelas...</option>
                {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Semester</Label>
              <div className="text-sm text-gray-700 bg-gray-50 border rounded-lg px-3 py-2 h-9 flex items-center">
                {semLabel || "Tidak ada semester aktif"}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={generate} disabled={!classroomId || generating} className="gap-2 flex-1">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
                {generating ? "Generating..." : "Generate Raport"}
              </Button>
              {raports.length > 0 && (
                <Button variant="outline" onClick={printAll} className="gap-2">
                  <Printer className="h-4 w-4" /> Cetak Semua
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {raports.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">{raports.length} Raport di-generate</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {raports.map((r) => (
                <div key={r.studentId} className="flex items-center px-4 py-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{r.name}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span>NIS: {r.nis ?? "-"}</span>
                      {r.overallAvg !== null && <span>Rata-rata: <b>{r.overallAvg.toFixed(1)}</b></span>}
                      {r.rank !== null && (
                        <span className="flex items-center gap-0.5">
                          <Trophy className="h-3 w-3 text-yellow-500" /> Peringkat {r.rank}/{r.totalStudents}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => printRaport(r)}>
                    <Printer className="h-3.5 w-3.5" /> Cetak
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Print-only raport view */}
      <div className="print-raport">
        {(selectedStudent ? [selectedStudent] : raports).map((r) => (
          <div key={r.studentId} className="raport-card p-8 max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
              <h1 className="text-xl font-bold uppercase">{schoolName}</h1>
              <h2 className="text-base font-semibold mt-1">RAPOR SISWA</h2>
              <p className="text-sm text-gray-600 mt-0.5">Semester {semLabel}</p>
            </div>

            {/* Student info */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div><span className="text-gray-500">Nama Siswa</span><p className="font-semibold">{r.name}</p></div>
              <div><span className="text-gray-500">NIS</span><p className="font-semibold">{r.nis ?? "-"}</p></div>
              <div><span className="text-gray-500">Peringkat</span><p className="font-semibold">{r.rank ?? "-"} / {r.totalStudents}</p></div>
              <div><span className="text-gray-500">Rata-rata Akhir</span><p className="font-semibold">{r.overallAvg?.toFixed(2) ?? "-"}</p></div>
            </div>

            {/* Grades table */}
            <table className="w-full text-sm border-collapse mb-6">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left">No</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Mata Pelajaran</th>
                  <th className="border border-gray-300 px-3 py-2 text-center">Nilai Akhir</th>
                  <th className="border border-gray-300 px-3 py-2 text-center">Predikat</th>
                </tr>
              </thead>
              <tbody>
                {r.subjectScores.filter((s) => s.avg !== null).map((s, i) => (
                  <tr key={s.subjectName}>
                    <td className="border border-gray-300 px-3 py-2 text-center">{i + 1}</td>
                    <td className="border border-gray-300 px-3 py-2">{s.subjectName}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center font-semibold">{s.finalScore?.toFixed(0) ?? "-"}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center font-bold">{s.grade ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Attendance */}
            <div className="border border-gray-300 rounded p-3 mb-6">
              <p className="font-semibold text-sm mb-2">Rekap Kehadiran</p>
              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <div><p className="text-gray-500 text-xs">Hadir</p><p className="font-bold text-emerald-600">{r.attendance.hadir}</p></div>
                <div><p className="text-gray-500 text-xs">Sakit</p><p className="font-bold text-yellow-600">{r.attendance.sakit}</p></div>
                <div><p className="text-gray-500 text-xs">Izin</p><p className="font-bold text-blue-600">{r.attendance.izin}</p></div>
                <div><p className="text-gray-500 text-xs">Alfa</p><p className="font-bold text-red-600">{r.attendance.alfa}</p></div>
              </div>
            </div>

            {/* Signature */}
            <div className="flex justify-between mt-8 text-sm">
              <div className="text-center">
                <p>Orang Tua / Wali</p>
                <div className="h-16 mt-2 border-b border-gray-400 w-32"></div>
                <p className="mt-1 text-xs text-gray-500">( ................................ )</p>
              </div>
              <div className="text-center">
                <p>Kepala Sekolah</p>
                <div className="h-16 mt-2 border-b border-gray-400 w-32"></div>
                <p className="mt-1 text-xs text-gray-500">( ................................ )</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
