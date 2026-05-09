"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Save, CheckSquare, TrendingUp } from "lucide-react";

const GRADE_TYPES = [
  { value: "TUGAS", label: "Tugas" },
  { value: "UH", label: "Ulangan Harian" },
  { value: "UTS", label: "UTS" },
  { value: "UAS", label: "UAS" },
  { value: "PRAKTIK", label: "Praktik" },
];

interface StudentRow { no: number; studentId: string; name: string; nis: string; score: number | null; notes: string }
interface Classroom { id: string; name: string }
interface Subject { id: string; name: string; code: string }
interface Semester { id: string; type: string; academicYear: { name: string } }

export default function GradeInput() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeSemester, setActiveSemester] = useState<Semester | null>(null);
  const [classroomId, setClassroomId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [type, setType] = useState("TUGAS");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/grades/context").then((r) => r.json()).then((d) => {
      setClassrooms(d.classrooms ?? []);
      setSubjects(d.subjects ?? []);
      if (d.activeSemester) setActiveSemester(d.activeSemester);
    });
  }, []);

  const load = useCallback(async () => {
    if (!classroomId || !subjectId || !activeSemester) return;
    setLoading(true);
    const params = new URLSearchParams({ classroomId, subjectId, semesterId: activeSemester.id, type });
    const res = await fetch(`/api/grades/input?${params}`);
    setStudents(await res.json());
    setLoading(false);
    setSaved(false);
  }, [classroomId, subjectId, type, activeSemester]);

  useEffect(() => { load(); }, [load]);

  const setScore = (studentId: string, val: string) => {
    const num = val === "" ? null : Math.min(100, Math.max(0, Number(val)));
    setStudents((prev) => prev.map((s) => s.studentId === studentId ? { ...s, score: num } : s));
  };

  const avg = (() => {
    const scores = students.map((s) => s.score).filter((s): s is number => s !== null);
    return scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;
  })();

  const max = (() => {
    const scores = students.map((s) => s.score).filter((s): s is number => s !== null);
    return scores.length > 0 ? Math.max(...scores) : null;
  })();

  const min = (() => {
    const scores = students.map((s) => s.score).filter((s): s is number => s !== null);
    return scores.length > 0 ? Math.min(...scores) : null;
  })();

  const handleSave = async () => {
    if (!activeSemester) return;
    setSaving(true);
    await fetch("/api/grades/input", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ semesterId: activeSemester.id, subjectId, type, records: students.map((s) => ({ studentId: s.studentId, score: s.score, notes: s.notes })) }),
    });
    setSaving(false);
    setSaved(true);
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "";
    if (score >= 90) return "bg-emerald-50 border-emerald-200 text-emerald-700";
    if (score >= 75) return "bg-blue-50 border-blue-200 text-blue-700";
    if (score >= 60) return "bg-yellow-50 border-yellow-200 text-yellow-700";
    return "bg-red-50 border-red-200 text-red-700";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label>Semester</Label>
              <div className="text-sm text-gray-700 bg-gray-50 border rounded-lg px-3 py-2 h-9 flex items-center">
                {activeSemester ? `${activeSemester.type} ${activeSemester.academicYear.name}` : "Tidak ada"}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Kelas *</Label>
              <select value={classroomId} onChange={(e) => setClassroomId(e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 h-9">
                <option value="">Pilih kelas...</option>
                {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Mata Pelajaran *</Label>
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 h-9">
                <option value="">Pilih mapel...</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Jenis Nilai *</Label>
              <select value={type} onChange={(e) => setType(e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 h-9">
                {GRADE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {classroomId && subjectId && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Input Nilai — {GRADE_TYPES.find((t) => t.value === type)?.label}
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            </CardTitle>
            {avg !== null && (
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Rata-rata: <span className="font-bold text-gray-900">{avg}</span></span>
                <span>Max: <span className="font-bold text-emerald-600">{max}</span></span>
                <span>Min: <span className="font-bold text-red-500">{min}</span></span>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">Tidak ada siswa di kelas ini.</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-y">
                      <tr>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 w-10">No</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 w-20">NIS</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600">Nama Siswa</th>
                        <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 w-28">Nilai (0–100)</th>
                        <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 w-16">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {students.map((s) => {
                        const grade = s.score === null ? null : s.score >= 90 ? "A" : s.score >= 80 ? "B" : s.score >= 70 ? "C" : s.score >= 60 ? "D" : "E";
                        return (
                          <tr key={s.studentId} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-muted-foreground text-xs">{s.no}</td>
                            <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{s.nis}</td>
                            <td className="px-3 py-2 font-medium text-gray-900">{s.name}</td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={0} max={100} step={0.5}
                                value={s.score ?? ""}
                                onChange={(e) => setScore(s.studentId, e.target.value)}
                                placeholder="–"
                                className={`w-full text-center font-semibold border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors ${getScoreColor(s.score)}`}
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              {grade && (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                  grade === "A" ? "bg-emerald-100 text-emerald-700" :
                                  grade === "B" ? "bg-blue-100 text-blue-700" :
                                  grade === "C" ? "bg-yellow-100 text-yellow-700" :
                                  grade === "D" ? "bg-orange-100 text-orange-700" :
                                  "bg-red-100 text-red-700"
                                }`}>{grade}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t flex items-center gap-3">
                  <Button onClick={handleSave} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? "Menyimpan..." : "Simpan Nilai"}
                  </Button>
                  {saved && (
                    <div className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                      <CheckSquare className="h-4 w-4" /> Nilai berhasil disimpan!
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
