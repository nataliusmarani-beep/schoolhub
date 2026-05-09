"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, CheckSquare, Users } from "lucide-react";
import { format } from "date-fns";

const STATUS_OPTS = [
  { value: "HADIR", label: "H", full: "Hadir", cls: "bg-emerald-500 hover:bg-emerald-600 text-white" },
  { value: "SAKIT", label: "S", full: "Sakit", cls: "bg-yellow-500 hover:bg-yellow-600 text-white" },
  { value: "IZIN", label: "I", full: "Izin", cls: "bg-blue-500 hover:bg-blue-600 text-white" },
  { value: "ALFA", label: "A", full: "Alfa", cls: "bg-red-500 hover:bg-red-600 text-white" },
] as const;

type Status = "HADIR" | "SAKIT" | "IZIN" | "ALFA";

interface StudentRow { studentId: string; no: number; name: string; nis: string; status: Status; notes: string }
interface Classroom { id: string; name: string }
interface Semester { id: string; type: string; academicYear: { name: string } }

const schema = z.object({
  classroomId: z.string().min(1, "Pilih kelas"),
  semesterId: z.string().min(1),
  date: z.string().min(1),
});

export default function AttendanceInput() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [activeSemester, setActiveSemester] = useState<Semester | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { register, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { classroomId: "", semesterId: "", date: format(new Date(), "yyyy-MM-dd") },
  });

  const classroomId = watch("classroomId");
  const date = watch("date");
  const semesterId = watch("semesterId");

  useEffect(() => {
    fetch("/api/attendance/context").then((r) => r.json()).then((d) => {
      setClassrooms(d.classrooms ?? []);
      if (d.activeSemester) {
        setActiveSemester(d.activeSemester);
        setValue("semesterId", d.activeSemester.id);
      }
    });
  }, [setValue]);

  const loadStudents = useCallback(async () => {
    if (!classroomId || !date) return;
    setLoading(true);
    const res = await fetch(`/api/attendance/students?classroomId=${classroomId}&date=${date}`);
    const data = await res.json();
    setStudents(data);
    setLoading(false);
    setSaved(false);
  }, [classroomId, date]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const setStatus = (studentId: string, status: Status) => {
    setStudents((prev) => prev.map((s) => s.studentId === studentId ? { ...s, status } : s));
  };

  const markAll = (status: Status) => {
    setStudents((prev) => prev.map((s) => ({ ...s, status })));
  };

  const handleSave = async () => {
    if (!students.length || !semesterId) return;
    setSaving(true);
    const res = await fetch("/api/attendance/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classroomId, semesterId, date, records: students.map((s) => ({ studentId: s.studentId, status: s.status, notes: s.notes })) }),
    });
    setSaving(false);
    if (res.ok) setSaved(true);
  };

  const counts = { HADIR: 0, SAKIT: 0, IZIN: 0, ALFA: 0 } as Record<Status, number>;
  students.forEach((s) => counts[s.status]++);

  return (
    <div className="space-y-4">
      {/* Form controls */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Semester</Label>
              <div className="text-sm text-gray-700 bg-gray-50 border rounded-lg px-3 py-2">
                {activeSemester ? `${activeSemester.type} ${activeSemester.academicYear.name}` : "Tidak ada semester aktif"}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Kelas *</Label>
              <select
                {...register("classroomId")}
                className="w-full text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Pilih kelas...</option>
                {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.classroomId && <p className="text-xs text-red-500">{errors.classroomId.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Tanggal *</Label>
              <input
                type="date"
                {...register("date")}
                className="w-full text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student table */}
      {classroomId && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Daftar Siswa {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            </CardTitle>
            {students.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground mr-1">Tandai semua:</span>
                {STATUS_OPTS.map((s) => (
                  <button key={s.value} onClick={() => markAll(s.value)} className={`text-xs px-2 py-1 rounded font-medium ${s.cls} transition-colors`}>
                    {s.full}
                  </button>
                ))}
              </div>
            )}
          </CardHeader>

          {/* Summary badges */}
          {students.length > 0 && (
            <div className="px-4 pb-2 flex gap-2 flex-wrap">
              <Badge variant="secondary" className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-100">H: {counts.HADIR}</Badge>
              <Badge variant="secondary" className="gap-1 bg-yellow-50 text-yellow-700 border-yellow-100">S: {counts.SAKIT}</Badge>
              <Badge variant="secondary" className="gap-1 bg-blue-50 text-blue-700 border-blue-100">I: {counts.IZIN}</Badge>
              <Badge variant="secondary" className="gap-1 bg-red-50 text-red-700 border-red-100">A: {counts.ALFA}</Badge>
            </div>
          )}

          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Memuat data siswa...</span>
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
                        <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600">Status Kehadiran</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {students.map((s) => (
                        <tr key={s.studentId} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-muted-foreground text-xs">{s.no}</td>
                          <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{s.nis}</td>
                          <td className="px-3 py-2 font-medium text-gray-900">{s.name}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-center gap-1.5">
                              {STATUS_OPTS.map((opt) => (
                                <button
                                  key={opt.value}
                                  onClick={() => setStatus(s.studentId, opt.value)}
                                  className={`w-9 h-8 rounded-lg text-xs font-bold transition-all ${
                                    s.status === opt.value
                                      ? opt.cls + " ring-2 ring-offset-1 ring-current scale-105"
                                      : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                  }`}
                                  title={opt.full}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 border-t flex items-center gap-3">
                  <Button onClick={handleSave} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? "Menyimpan..." : "Simpan Absensi"}
                  </Button>
                  {saved && (
                    <div className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                      <CheckSquare className="h-4 w-4" />
                      Absensi berhasil disimpan!
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
