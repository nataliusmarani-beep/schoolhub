"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, Printer, AlertCircle } from "lucide-react";
import { printElement } from "@/lib/export";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const DAY_NUMS = [1, 2, 3, 4, 5, 6];
const PERIODS = ["07:00", "07:45", "08:30", "09:15", "10:00", "10:45", "11:30", "12:15", "13:00", "13:45"];

const SUBJECT_COLORS = [
  "bg-blue-100 text-blue-800 border-blue-200",
  "bg-violet-100 text-violet-800 border-violet-200",
  "bg-emerald-100 text-emerald-800 border-emerald-200",
  "bg-amber-100 text-amber-800 border-amber-200",
  "bg-pink-100 text-pink-800 border-pink-200",
  "bg-cyan-100 text-cyan-800 border-cyan-200",
  "bg-orange-100 text-orange-800 border-orange-200",
  "bg-teal-100 text-teal-800 border-teal-200",
];

interface ScheduleItem {
  id: string; dayOfWeek: number; startTime: string; endTime: string; room: string | null;
  subject: { id: string; name: string; code: string };
  teacher: { id: string; user: { name: string } };
  classroom: { name: string };
}
interface Classroom { id: string; name: string }
interface Subject { id: string; name: string; code: string }
interface Teacher { id: string; user: { name: string } }
interface Semester { id: string; type: string; academicYear: { name: string } }

const EMPTY_FORM = { subjectId: "", teacherId: "", dayOfWeek: "1", startTime: "07:00", endTime: "07:45", room: "" };

export default function ScheduleGrid() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [activeSemester, setActiveSemester] = useState<Semester | null>(null);
  const [classroomId, setClassroomId] = useState("");
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/schedule/context").then((r) => r.json()).then((d) => {
      setClassrooms(d.classrooms ?? []);
      setSubjects(d.subjects ?? []);
      setTeachers(d.teachers ?? []);
      if (d.activeSemester) setActiveSemester(d.activeSemester);
    });
  }, []);

  const load = useCallback(async () => {
    if (!classroomId || !activeSemester) return;
    setLoading(true);
    const res = await fetch(`/api/schedule?classroomId=${classroomId}&semesterId=${activeSemester.id}`);
    setSchedules(await res.json());
    setLoading(false);
  }, [classroomId, activeSemester]);

  useEffect(() => { load(); }, [load]);

  // Build color map per subject
  const subjectColorMap = new Map<string, string>();
  let colorIdx = 0;
  schedules.forEach((s) => {
    if (!subjectColorMap.has(s.subject.id)) {
      subjectColorMap.set(s.subject.id, SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.length]);
      colorIdx++;
    }
  });

  const getSlots = (day: number) =>
    schedules.filter((s) => s.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const handleAdd = async () => {
    if (!activeSemester || !classroomId) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, semesterId: activeSemester.id, classroomId }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    setSchedules((prev) => [...prev, data]);
    setOpen(false);
    setForm(EMPTY_FORM);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus jadwal ini?")) return;
    await fetch("/api/schedule", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

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
          {activeSemester && (
            <Badge variant="secondary" className="h-9 px-3 flex items-center text-xs">
              {activeSemester.type} {activeSemester.academicYear.name}
            </Badge>
          )}
          {classroomId && (
            <>
              <Button size="sm" className="gap-1.5 h-9" onClick={() => { setOpen(true); setError(""); }}>
                <Plus className="h-4 w-4" /> Tambah Jadwal
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 h-9" onClick={() => printElement("schedule-grid")}>
                <Printer className="h-4 w-4" /> Cetak
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {classroomId && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">
              Jadwal Pelajaran — {classrooms.find((c) => c.id === classroomId)?.name}
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground inline ml-2" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <div id="schedule-grid">
              <table className="w-full text-xs border-collapse min-w-[600px]">
                <thead>
                  <tr>
                    <th className="border-b border-r px-3 py-2.5 text-left text-gray-600 font-semibold w-20 bg-gray-50">Jam</th>
                    {DAYS.map((d) => (
                      <th key={d} className="border-b border-r px-3 py-2.5 text-center text-gray-600 font-semibold bg-gray-50">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map((period, pi) => {
                    const nextPeriod = PERIODS[pi + 1] ?? "14:30";
                    return (
                      <tr key={period} className="border-b">
                        <td className="border-r px-3 py-2 text-muted-foreground font-mono whitespace-nowrap bg-gray-50">
                          {period}–{nextPeriod}
                        </td>
                        {DAY_NUMS.map((day) => {
                          const slot = getSlots(day).find((s) => s.startTime <= period && s.endTime > period);
                          return (
                            <td key={day} className="border-r px-2 py-1.5 text-center align-middle">
                              {slot ? (
                                <div className={`rounded-lg p-1.5 border text-left group relative ${subjectColorMap.get(slot.subject.id) ?? SUBJECT_COLORS[0]}`}>
                                  <p className="font-semibold leading-tight">{slot.subject.code}</p>
                                  <p className="text-[10px] opacity-70 truncate">{slot.teacher.user.name.split(" ")[0]}</p>
                                  {slot.room && <p className="text-[10px] opacity-60">{slot.room}</p>}
                                  <button
                                    onClick={() => handleDelete(slot.id)}
                                    className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded p-0.5"
                                  >
                                    <Trash2 className="h-2.5 w-2.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="h-10 rounded-lg" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      {schedules.length > 0 && (
        <Card>
          <CardContent className="p-3 flex flex-wrap gap-2">
            {Array.from(subjectColorMap.entries()).map(([subjectId, cls]) => {
              const subj = schedules.find((s) => s.subject.id === subjectId)?.subject;
              return subj ? (
                <span key={subjectId} className={`text-xs px-2 py-1 rounded-full border ${cls}`}>{subj.name}</span>
              ) : null;
            })}
          </CardContent>
        </Card>
      )}

      {/* Add dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Tambah Jadwal</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}
            <div className="space-y-1">
              <Label>Mata Pelajaran *</Label>
              <select value={form.subjectId} onChange={(e) => set("subjectId", e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none">
                <option value="">Pilih mapel...</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Guru *</Label>
              <select value={form.teacherId} onChange={(e) => set("teacherId", e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none">
                <option value="">Pilih guru...</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.user.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Hari *</Label>
              <select value={form.dayOfWeek} onChange={(e) => set("dayOfWeek", e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none">
                {DAYS.map((d, i) => <option key={i + 1} value={i + 1}>{d}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Jam Mulai *</Label>
                <Input type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label>Jam Selesai *</Label>
                <Input type="time" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} className="h-9 text-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Ruangan (opsional)</Label>
              <Input value={form.room} onChange={(e) => set("room", e.target.value)} placeholder="Lab IPA, Kelas A..." className="h-9 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleAdd} disabled={saving || !form.subjectId || !form.teacherId} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
