"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download, Printer, Loader2 } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { exportToExcel, printElement } from "@/lib/export";
import type { ColumnDef } from "@tanstack/react-table";

interface RecapRow {
  no: number; studentId: string; name: string; nis: string;
  hadir: number; sakit: number; izin: number; alfa: number; total: number; pct: number | null;
}

interface Semester { id: string; type: string; academicYear: { name: string } }
interface Classroom { id: string; name: string }

const PctBadge = ({ pct }: { pct: number | null }) => {
  if (pct === null) return <span className="text-muted-foreground text-xs">-</span>;
  const cls = pct >= 90 ? "bg-emerald-100 text-emerald-700" : pct >= 75 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>{pct}%</span>;
};

export default function AttendanceRecap() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [activeSemester, setActiveSemester] = useState<Semester | null>(null);
  const [classroomId, setClassroomId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState<RecapRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/attendance/context").then((r) => r.json()).then((d) => {
      setClassrooms(d.classrooms ?? []);
      if (d.activeSemester) setActiveSemester(d.activeSemester);
    });
  }, []);

  const load = useCallback(async () => {
    if (!classroomId || !activeSemester) return;
    setLoading(true);
    const params = new URLSearchParams({ classroomId, semesterId: activeSemester.id });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`/api/attendance/recap?${params}`);
    setRows(await res.json());
    setLoading(false);
  }, [classroomId, activeSemester, from, to]);

  useEffect(() => { load(); }, [load]);

  const columns: ColumnDef<RecapRow>[] = [
    { accessorKey: "no", header: "No", size: 50 },
    { accessorKey: "nis", header: "NIS", size: 80 },
    { accessorKey: "name", header: "Nama Siswa" },
    {
      accessorKey: "hadir", header: "Hadir",
      cell: ({ getValue }) => <span className="font-semibold text-emerald-600">{getValue() as number}</span>,
    },
    {
      accessorKey: "sakit", header: "Sakit",
      cell: ({ getValue }) => <span className="font-semibold text-yellow-600">{getValue() as number}</span>,
    },
    {
      accessorKey: "izin", header: "Izin",
      cell: ({ getValue }) => <span className="font-semibold text-blue-600">{getValue() as number}</span>,
    },
    {
      accessorKey: "alfa", header: "Alfa",
      cell: ({ getValue }) => <span className="font-semibold text-red-600">{getValue() as number}</span>,
    },
    { accessorKey: "total", header: "Total Hari" },
    {
      accessorKey: "pct", header: "% Hadir",
      cell: ({ row }) => <PctBadge pct={row.original.pct} />,
    },
  ];

  const handleExport = () => {
    exportToExcel(
      rows.map((r) => ({ No: r.no, NIS: r.nis, Nama: r.name, Hadir: r.hadir, Sakit: r.sakit, Izin: r.izin, Alfa: r.alfa, Total: r.total, "% Hadir": r.pct !== null ? `${r.pct}%` : "-" })),
      `rekap-absensi-${classroomId}`,
      "Rekap Absensi"
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label>Kelas</Label>
              <select
                value={classroomId} onChange={(e) => setClassroomId(e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Pilih kelas...</option>
                {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Dari Tanggal</Label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="space-y-1">
              <Label>Sampai Tanggal</Label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={load} disabled={!classroomId || loading} size="sm" className="gap-2">
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Tampilkan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              Rekap Absensi
              {activeSemester && <Badge variant="secondary" className="ml-2 text-[10px]">{activeSemester.type} {activeSemester.academicYear.name}</Badge>}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={handleExport}>
                <Download className="h-3.5 w-3.5" /> Excel
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => printElement("recap-print")}>
                <Printer className="h-3.5 w-3.5" /> Cetak
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div id="recap-print">
              <DataTable data={rows} columns={columns} searchKey="name" searchPlaceholder="Cari siswa..." />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
