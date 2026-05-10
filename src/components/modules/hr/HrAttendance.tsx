"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, CheckSquare } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface AttendanceRow { employeeId: string; name: string; position: string; status: string; notes: string }
interface RecapRow { employeeId: string; name: string; position: string; HADIR: number; SAKIT: number; IZIN: number; ALFA: number; total: number; pct: number }

const STATUS_OPTS = [
  { value: "HADIR", label: "H", cls: "bg-emerald-100 text-emerald-700 ring-emerald-400" },
  { value: "SAKIT", label: "S", cls: "bg-yellow-100 text-yellow-700 ring-yellow-400" },
  { value: "IZIN",  label: "I", cls: "bg-blue-100 text-blue-700 ring-blue-400" },
  { value: "ALFA",  label: "A", cls: "bg-red-100 text-red-700 ring-red-400" },
];

function PctBadge({ pct }: { pct: number }) {
  const cls = pct >= 90 ? "bg-emerald-100 text-emerald-700" : pct >= 75 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>{pct}%</span>;
}

export default function HrAttendance() {
  const [tab, setTab] = useState("input");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [records, setRecords] = useState<AttendanceRow[]>([]);
  const [recap, setRecap] = useState<RecapRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadDaily = useCallback(async () => {
    setLoading(true);
    const data = await fetch(`/api/hr/attendance?date=${date}`).then((r) => r.json());
    setRecords(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [date]);

  const loadRecap = useCallback(async () => {
    setLoading(true);
    const data = await fetch(`/api/hr/attendance?month=${month}`).then((r) => r.json());
    setRecap(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [month]);

  useEffect(() => { if (tab === "input") loadDaily(); }, [tab, loadDaily]);
  useEffect(() => { if (tab === "recap") loadRecap(); }, [tab, loadRecap]);

  const setStatus = (employeeId: string, status: string) =>
    setRecords((prev: AttendanceRow[]) => prev.map((r) => r.employeeId === employeeId ? { ...r, status } : r));

  const bulkSet = (status: string) => setRecords((prev) => prev.map((r) => ({ ...r, status })));

  const save = async () => {
    setSaving(true);
    await fetch("/api/hr/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, records }),
    });
    setSaving(false);
  };

  const summary = records.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-9">
          <TabsTrigger value="input" className="text-xs">Input Harian</TabsTrigger>
          <TabsTrigger value="recap" className="text-xs">Rekap Bulanan</TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                <div className="space-y-1">
                  <Label>Tanggal</Label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                    className="text-sm border rounded-lg px-3 py-2 h-9 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {STATUS_OPTS.map((o) => (
                    <Button key={o.value} variant="outline" size="sm" className="h-8 text-xs" onClick={() => bulkSet(o.value)}>
                      <CheckSquare className="h-3.5 w-3.5 mr-1" /> Semua {o.label}
                    </Button>
                  ))}
                </div>
                <Button size="sm" className="gap-1.5 h-9 sm:ml-auto" onClick={save} disabled={saving || records.length === 0}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Simpan
                </Button>
              </div>
              {records.length > 0 && (
                <div className="flex gap-3 mt-3 text-xs text-muted-foreground">
                  {STATUS_OPTS.map((o) => (
                    <span key={o.value}>{o.label}: <b>{summary[o.value] ?? 0}</b></span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">
                {format(new Date(date + "T00:00:00"), "EEEE, d MMMM yyyy", { locale: id })}
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground inline ml-2" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {records.length === 0 && !loading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Belum ada data pegawai</p>
              ) : (
                <div className="divide-y">
                  {records.map((r) => (
                    <div key={r.employeeId} className="flex items-center px-4 py-2.5 gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.position}</p>
                      </div>
                      <div className="flex gap-1">
                        {STATUS_OPTS.map((o) => (
                          <button
                            key={o.value}
                            onClick={() => setStatus(r.employeeId, o.value)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold border-2 transition-all
                              ${r.status === o.value ? `${o.cls} ring-2 ring-offset-1 border-transparent` : "border-gray-200 text-gray-400 hover:border-gray-300"}`}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recap" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-end gap-3">
                <div className="space-y-1">
                  <Label>Bulan</Label>
                  <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
                    className="text-sm border rounded-lg px-3 py-2 h-9 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : (
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-2.5 text-left font-semibold text-gray-600">Pegawai</th>
                      <th className="px-3 py-2.5 text-center font-semibold text-emerald-600">H</th>
                      <th className="px-3 py-2.5 text-center font-semibold text-yellow-600">S</th>
                      <th className="px-3 py-2.5 text-center font-semibold text-blue-600">I</th>
                      <th className="px-3 py-2.5 text-center font-semibold text-red-600">A</th>
                      <th className="px-3 py-2.5 text-center font-semibold text-gray-600">Total</th>
                      <th className="px-3 py-2.5 text-center font-semibold text-gray-600">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recap.map((r) => (
                      <tr key={r.employeeId} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5">
                          <p className="font-medium">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{r.position}</p>
                        </td>
                        <td className="px-3 py-2.5 text-center font-semibold text-emerald-600">{r.HADIR}</td>
                        <td className="px-3 py-2.5 text-center font-semibold text-yellow-600">{r.SAKIT}</td>
                        <td className="px-3 py-2.5 text-center font-semibold text-blue-600">{r.IZIN}</td>
                        <td className="px-3 py-2.5 text-center font-semibold text-red-600">{r.ALFA}</td>
                        <td className="px-3 py-2.5 text-center text-gray-600">{r.total}</td>
                        <td className="px-3 py-2.5 text-center"><PctBadge pct={r.pct} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
