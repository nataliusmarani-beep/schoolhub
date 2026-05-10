"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Printer, CheckCircle } from "lucide-react";

interface Employee { employeeId: string; name: string; position: string; baseSalary: number }
interface PayrollRow {
  id: string;
  employeeId: string;
  period: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  isPaid: boolean;
  notes: string | null;
  employee: { user: { name: string }; position: string };
}
interface EditRow { baseSalary: number; allowances: number; deductions: number; notes: string }

const fmt = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export default function Payroll() {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollRow[]>([]);
  const [edits, setEdits] = useState<Record<string, EditRow>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [printData, setPrintData] = useState<PayrollRow | null>(null);

  const loadEmployees = useCallback(async () => {
    const data = await fetch("/api/hr/payroll").then((r) => r.json());
    setEmployees(Array.isArray(data) ? data : []);
  }, []);

  const loadPayrolls = useCallback(async () => {
    setLoading(true);
    const data = await fetch(`/api/hr/payroll?period=${period}`).then((r) => r.json());
    const rows: PayrollRow[] = Array.isArray(data) ? data : [];
    setPayrolls(rows);
    const newEdits: Record<string, EditRow> = {};
    employees.forEach((emp) => {
      const existing = rows.find((r) => r.employeeId === emp.employeeId);
      newEdits[emp.employeeId] = {
        baseSalary: existing?.baseSalary ?? emp.baseSalary,
        allowances: existing?.allowances ?? 0,
        deductions: existing?.deductions ?? 0,
        notes: existing?.notes ?? "",
      };
    });
    setEdits(newEdits);
    setLoading(false);
  }, [period, employees]);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);
  useEffect(() => { if (employees.length > 0) loadPayrolls(); }, [loadPayrolls, employees]);

  const setEdit = (empId: string, k: keyof EditRow, v: string | number) =>
    setEdits((prev) => ({ ...prev, [empId]: { ...prev[empId], [k]: typeof v === "string" ? v : Number(v) } }));

  const save = async () => {
    setSaving(true);
    const records = employees.map((emp) => ({
      employeeId: emp.employeeId,
      ...edits[emp.employeeId],
    }));
    await fetch("/api/hr/payroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ period, records }),
    });
    await loadPayrolls();
    setSaving(false);
  };

  const markPaid = async (id: string, isPaid: boolean) => {
    await fetch("/api/hr/payroll", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isPaid }),
    });
    setPayrolls((p) => p.map((r) => (r.id === id ? { ...r, isPaid, paidAt: isPaid ? new Date().toISOString() : null } : r)));
  };

  const printSlip = (row: PayrollRow) => {
    setPrintData(row);
    setTimeout(() => window.print(), 300);
  };

  return (
    <div className="space-y-4">
      <style>{`
        @media print {
          body > * { display: none !important; }
          .print-slip { display: block !important; }
        }
        .print-slip { display: none; }
      `}</style>

      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-end gap-3">
          <div className="space-y-1">
            <Label>Periode</Label>
            <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)}
              className="text-sm border rounded-lg px-3 py-2 h-9 focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <Button size="sm" className="gap-1.5 h-9" onClick={save} disabled={saving || employees.length === 0}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan Penggajian
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold">
            Penggajian {period}
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground inline ml-2" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-2.5 text-left font-semibold text-gray-600">Pegawai</th>
                <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Gaji Pokok</th>
                <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Tunjangan</th>
                <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Potongan</th>
                <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Gaji Bersih</th>
                <th className="px-3 py-2.5 text-center font-semibold text-gray-600">Status</th>
                <th className="px-3 py-2.5 text-center font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {employees.map((emp) => {
                const edit = edits[emp.employeeId] ?? { baseSalary: 0, allowances: 0, deductions: 0, notes: "" };
                const net = edit.baseSalary + edit.allowances - edit.deductions;
                const saved = payrolls.find((r) => r.employeeId === emp.employeeId);
                return (
                  <tr key={emp.employeeId} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <p className="font-medium">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.position}</p>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input type="number" value={edit.baseSalary} onChange={(e) => setEdit(emp.employeeId, "baseSalary", e.target.value)}
                        className="w-32 text-right text-sm border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input type="number" value={edit.allowances} onChange={(e) => setEdit(emp.employeeId, "allowances", e.target.value)}
                        className="w-28 text-right text-sm border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input type="number" value={edit.deductions} onChange={(e) => setEdit(emp.employeeId, "deductions", e.target.value)}
                        className="w-28 text-right text-sm border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-emerald-700">{fmt(net)}</td>
                    <td className="px-3 py-2.5 text-center">
                      {saved ? (
                        <Badge variant="outline" className={saved.isPaid ? "border-emerald-200 text-emerald-700" : "border-yellow-200 text-yellow-700"}>
                          {saved.isPaid ? "Dibayar" : "Belum dibayar"}
                        </Badge>
                      ) : <span className="text-xs text-muted-foreground">Belum disimpan</span>}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex justify-center gap-1">
                        {saved && !saved.isPaid && (
                          <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => markPaid(saved.id, true)}>
                            <CheckCircle className="h-3 w-3" /> Bayar
                          </Button>
                        )}
                        {saved && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => printSlip(saved)}>
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Print slip */}
      {printData && (
        <div className="print-slip p-8 max-w-lg mx-auto text-sm">
          <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
            <h1 className="text-lg font-bold uppercase">Slip Gaji Pegawai</h1>
            <p className="text-sm text-gray-600">Periode: {printData.period}</p>
          </div>
          <div className="mb-4">
            <p><span className="text-gray-500 w-32 inline-block">Nama</span><b>{printData.employee.user.name}</b></p>
            <p><span className="text-gray-500 w-32 inline-block">Jabatan</span>{printData.employee.position}</p>
          </div>
          <table className="w-full border-collapse mb-4">
            <tbody>
              <tr className="border-b"><td className="py-1.5 text-gray-600">Gaji Pokok</td><td className="py-1.5 text-right">{fmt(printData.baseSalary)}</td></tr>
              <tr className="border-b"><td className="py-1.5 text-gray-600">Tunjangan</td><td className="py-1.5 text-right text-emerald-700">+ {fmt(printData.allowances)}</td></tr>
              <tr className="border-b"><td className="py-1.5 text-gray-600">Potongan</td><td className="py-1.5 text-right text-red-600">- {fmt(printData.deductions)}</td></tr>
              <tr className="font-bold border-t-2 border-gray-800">
                <td className="pt-2">Gaji Bersih</td>
                <td className="pt-2 text-right text-emerald-700">{fmt(printData.netSalary)}</td>
              </tr>
            </tbody>
          </table>
          {printData.notes && <p className="text-xs text-gray-500">Catatan: {printData.notes}</p>}
          <div className="flex justify-between mt-12 text-sm">
            <div className="text-center"><p>Penerima</p><div className="h-14 mt-2 border-b border-gray-400 w-28"></div><p className="mt-1 text-xs text-gray-500">( ........................ )</p></div>
            <div className="text-center"><p>Kepala Sekolah</p><div className="h-14 mt-2 border-b border-gray-400 w-28"></div><p className="mt-1 text-xs text-gray-500">( ........................ )</p></div>
          </div>
        </div>
      )}
    </div>
  );
}
