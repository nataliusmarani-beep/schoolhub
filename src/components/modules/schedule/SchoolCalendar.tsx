"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Plus, Trash2, Loader2 } from "lucide-react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isSameMonth, isSameDay, addMonths, subMonths,
} from "date-fns";
import { id } from "date-fns/locale";

interface SchoolEvent {
  id: string; title: string; description: string | null;
  startDate: string; endDate: string; isHoliday: boolean;
}

const EMPTY = { title: "", description: "", startDate: "", endDate: "", isHoliday: false };

export default function SchoolCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const load = async (month: Date) => {
    const res = await fetch(`/api/events?year=${month.getFullYear()}&month=${month.getMonth() + 1}`);
    setEvents(await res.json());
  };

  useEffect(() => { load(currentMonth); }, [currentMonth]);

  const getDayEvents = (day: Date) =>
    events.filter((e) => {
      const start = new Date(e.startDate);
      const end = new Date(e.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return day >= start && day <= end;
    });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const firstDayOfWeek = getDay(monthStart);
  const paddingBefore = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const handleAdd = async () => {
    if (!form.title || !form.startDate || !form.endDate) return;
    setSaving(true);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const created = await res.json();
    setEvents((prev) => [...prev, created]);
    setOpen(false);
    setForm(EMPTY);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await fetch("/api/events", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const openNew = (day?: Date) => {
    const dateStr = day ? format(day, "yyyy-MM-dd") : "";
    setForm({ ...EMPTY, startDate: dateStr, endDate: dateStr });
    setOpen(true);
  };

  const set = (k: keyof typeof form, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const selectedEvents = selectedDay ? getDayEvents(selectedDay) : [];
  const today = new Date();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth((m) => subMonths(m, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-sm font-semibold min-w-[160px] text-center">
                {format(currentMonth, "MMMM yyyy", { locale: id })}
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth((m) => addMonths(m, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button size="sm" className="gap-1.5 h-8" onClick={() => openNew()}>
              <Plus className="h-3.5 w-3.5" /> Tambah Event
            </Button>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
                <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {[...Array(paddingBefore)].map((_, i) => <div key={`pad-${i}`} className="aspect-square" />)}
              {calDays.map((day) => {
                const dayEvents = getDayEvents(day);
                const isToday = isSameDay(day, today);
                const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
                const isCurrentMonth = isSameMonth(day, currentMonth);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`aspect-square rounded-lg p-1 flex flex-col items-center transition-colors text-left relative
                      ${isSelected ? "ring-2 ring-primary bg-primary/5" : "hover:bg-gray-100"}
                      ${!isCurrentMonth ? "opacity-30" : ""}
                    `}
                  >
                    <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                      ${isToday ? "bg-primary text-white" : "text-gray-700"}`}>
                      {format(day, "d")}
                    </span>
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                        {dayEvents.slice(0, 3).map((e, i) => (
                          <span key={i} className={`w-1.5 h-1.5 rounded-full ${e.isHoliday ? "bg-red-500" : "bg-primary"}`} />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Event list for selected day / month events */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">
              {selectedDay ? format(selectedDay, "d MMMM yyyy", { locale: id }) : "Event Bulan Ini"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {(selectedDay ? selectedEvents : events).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {selectedDay ? "Tidak ada event" : "Belum ada event bulan ini"}
              </p>
            ) : (
              (selectedDay ? selectedEvents : events).map((e) => (
                <div key={e.id} className="flex items-start gap-2 p-2.5 rounded-lg border group hover:border-primary/30">
                  <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${e.isHoliday ? "bg-red-500" : "bg-primary"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{e.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(e.startDate), "d MMM", { locale: id })}
                      {e.startDate !== e.endDate && ` – ${format(new Date(e.endDate), "d MMM", { locale: id })}`}
                    </p>
                    {e.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{e.description}</p>}
                    {e.isHoliday && <Badge variant="outline" className="text-[10px] border-red-200 text-red-600 mt-1">Hari Libur</Badge>}
                  </div>
                  <button
                    onClick={() => handleDelete(e.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
            {selectedDay && (
              <Button variant="outline" size="sm" className="w-full gap-1.5 mt-2" onClick={() => openNew(selectedDay)}>
                <Plus className="h-3.5 w-3.5" /> Tambah Event
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add event dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Tambah Event Kalender</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Judul Event *</Label>
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Ujian Tengah Semester, Libur Nasional..." className="h-9" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tanggal Mulai *</Label>
                <Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label>Tanggal Selesai *</Label>
                <Input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} className="h-9 text-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Keterangan (opsional)</Label>
              <Input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Deskripsi singkat..." className="h-9" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isHoliday}
                onChange={(e) => set("isHoliday", e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Tandai sebagai Hari Libur</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleAdd} disabled={saving || !form.title || !form.startDate || !form.endDate} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
