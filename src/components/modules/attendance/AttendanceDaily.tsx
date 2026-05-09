"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Loader2, CheckCircle2, AlertCircle, Users } from "lucide-react";
import { printElement } from "@/lib/export";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface ClassroomSummary {
  classroomId: string; name: string; level: number;
  total: number; hadir: number; sakit: number; izin: number; alfa: number;
  recorded: number; pct: number | null;
}

export default function AttendanceDaily() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [data, setData] = useState<ClassroomSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async (d: string) => {
    setLoading(true);
    const res = await fetch(`/api/attendance/daily?date=${d}`);
    setData(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(date); }, [date]);

  const totalHadir = data.reduce((s, c) => s + c.hadir, 0);
  const totalSiswa = data.reduce((s, c) => s + c.recorded, 0);
  const overallPct = totalSiswa > 0 ? Math.round((totalHadir / totalSiswa) * 100) : null;

  const dateLabel = (() => {
    try { return format(new Date(date + "T00:00:00"), "EEEE, dd MMMM yyyy", { locale: id }); }
    catch { return date; }
  })();

  return (
    <div className="space-y-4">
      {/* Date picker */}
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Tanggal:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          {overallPct !== null && (
            <div className="text-sm text-muted-foreground">
              Kehadiran keseluruhan: <span className="font-bold text-gray-900">{overallPct}%</span>
            </div>
          )}
          <Button variant="outline" size="sm" className="gap-1.5 h-8 ml-auto" onClick={() => printElement("daily-print")}>
            <Printer className="h-3.5 w-3.5" /> Cetak
          </Button>
        </CardContent>
      </Card>

      <div id="daily-print">
        <div className="mb-4 text-center print:block hidden">
          <h2 className="text-lg font-bold">Laporan Absensi Harian</h2>
          <p className="text-sm text-muted-foreground">{dateLabel}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Memuat laporan...</span>
          </div>
        ) : data.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Users className="h-8 w-8 opacity-30" />
              <span className="text-sm">Belum ada data kelas.</span>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: "Total Hadir", value: totalHadir, cls: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Sakit", value: data.reduce((s, c) => s + c.sakit, 0), cls: "text-yellow-600", bg: "bg-yellow-50" },
                { label: "Izin", value: data.reduce((s, c) => s + c.izin, 0), cls: "text-blue-600", bg: "bg-blue-50" },
                { label: "Alfa", value: data.reduce((s, c) => s + c.alfa, 0), cls: "text-red-600", bg: "bg-red-50" },
              ].map((s) => (
                <Card key={s.label}>
                  <CardContent className={`p-4 ${s.bg}`}>
                    <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Per-class grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.map((c) => (
                <Card key={c.classroomId} className="overflow-hidden">
                  <CardHeader className="pb-2 pt-3 px-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{c.name}</CardTitle>
                    {c.recorded === 0 ? (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <AlertCircle className="h-3 w-3" /> Belum diisi
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" /> {c.pct}% hadir
                      </span>
                    )}
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    <div className="flex gap-3 text-xs">
                      <span className="text-emerald-600 font-semibold">H: {c.hadir}</span>
                      <span className="text-yellow-600 font-semibold">S: {c.sakit}</span>
                      <span className="text-blue-600 font-semibold">I: {c.izin}</span>
                      <span className="text-red-600 font-semibold">A: {c.alfa}</span>
                      <span className="text-muted-foreground ml-auto">{c.recorded}/{c.total} siswa</span>
                    </div>
                    {c.recorded > 0 && (
                      <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${c.pct ?? 0}%` }} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
