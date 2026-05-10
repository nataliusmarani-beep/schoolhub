"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Pencil, Trash2, Loader2, Search, Users } from "lucide-react";

interface Employee {
  id: string;
  employeeNumber: string | null;
  position: string;
  department: string | null;
  status: string;
  joinDate: string;
  salary: number | null;
  user: { id: string; name: string; email: string; phone: string | null; role: string };
}

const EMPTY = {
  name: "", email: "", phone: "", role: "STAFF",
  employeeNumber: "", position: "", department: "", status: "ACTIVE",
  joinDate: new Date().toISOString().slice(0, 10), salary: "",
};

const STATUS_CLS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  INACTIVE: "bg-gray-100 text-gray-600 border-gray-200",
  RESIGNED: "bg-red-100 text-red-600 border-red-200",
};

const ROLE_LABELS: Record<string, string> = {
  SCHOOL_ADMIN: "Admin", PRINCIPAL: "Kepala Sekolah", TEACHER: "Guru",
  STAFF: "Staf", STUDENT: "Siswa",
};

export default function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const data = await fetch("/api/hr/employees").then((r) => r.json());
    setEmployees(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setError(""); setOpen(true); };
  const openEdit = (e: Employee) => {
    setEditing(e);
    setForm({
      name: e.user.name, email: e.user.email, phone: e.user.phone ?? "",
      role: e.user.role, employeeNumber: e.employeeNumber ?? "",
      position: e.position, department: e.department ?? "",
      status: e.status, joinDate: e.joinDate.slice(0, 10),
      salary: e.salary?.toString() ?? "",
    });
    setError("");
    setOpen(true);
  };

  const save = async () => {
    if (!form.name || !form.email || !form.position || !form.joinDate) return;
    setSaving(true);
    setError("");
    const method = editing ? "PUT" : "POST";
    const body = editing ? { id: editing.id, ...form } : form;
    const res = await fetch("/api/hr/employees", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Gagal menyimpan"); setSaving(false); return; }
    if (editing) setEmployees((p) => p.map((e) => (e.id === editing.id ? data : e)));
    else setEmployees((p) => [...p, data]);
    setOpen(false);
    setSaving(false);
  };

  const remove = async (emp: Employee) => {
    if (!confirm(`Hapus pegawai ${emp.user.name}?`)) return;
    await fetch("/api/hr/employees", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: emp.id }) });
    setEmployees((p) => p.filter((e) => e.id !== emp.id));
  };

  const filtered = employees.filter((e) =>
    e.user.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.employeeNumber ?? "").toLowerCase().includes(search.toLowerCase()) ||
    e.position.toLowerCase().includes(search.toLowerCase())
  );

  const set = (k: keyof typeof EMPTY, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama, NIP, jabatan..." className="pl-9 h-9 text-sm" />
          </div>
          <Button size="sm" className="gap-1.5 h-9" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Tambah Pegawai
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" /> {filtered.length} Pegawai
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Belum ada data pegawai</p>
          ) : (
            <div className="divide-y">
              {filtered.map((emp) => {
                const initials = emp.user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
                return (
                  <div key={emp.id} className="flex items-center px-4 py-3 gap-3 hover:bg-gray-50">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{emp.user.name}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
                        {emp.employeeNumber && <span>NIP: {emp.employeeNumber}</span>}
                        <span>{emp.position}</span>
                        {emp.department && <span>· {emp.department}</span>}
                        <span className="text-[10px] text-blue-600">{ROLE_LABELS[emp.user.role] ?? emp.user.role}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${STATUS_CLS[emp.status]}`}>
                      {emp.status === "ACTIVE" ? "Aktif" : emp.status === "INACTIVE" ? "Nonaktif" : "Resign"}
                    </Badge>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(emp)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => remove(emp)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Pegawai" : "Tambah Pegawai"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2 max-h-[70vh] overflow-y-auto pr-1">
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Data Pribadi</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label>Nama Lengkap *</Label>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} disabled={!!editing} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label>Nomor HP</Label>
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="h-9 text-sm" />
              </div>
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1">Data Kepegawaian</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>NIP / No. Pegawai</Label>
                <Input value={form.employeeNumber} onChange={(e) => set("employeeNumber", e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label>Role Sistem</Label>
                <select value={form.role} onChange={(e) => set("role", e.target.value)}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none h-9">
                  <option value="TEACHER">Guru</option>
                  <option value="STAFF">Staf</option>
                  <option value="SCHOOL_ADMIN">Admin Sekolah</option>
                  <option value="PRINCIPAL">Kepala Sekolah</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Jabatan *</Label>
                <Input value={form.position} onChange={(e) => set("position", e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label>Departemen</Label>
                <Input value={form.department} onChange={(e) => set("department", e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label>Tanggal Bergabung *</Label>
                <Input type="date" value={form.joinDate} onChange={(e) => set("joinDate", e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <select value={form.status} onChange={(e) => set("status", e.target.value)}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none h-9">
                  <option value="ACTIVE">Aktif</option>
                  <option value="INACTIVE">Nonaktif</option>
                  <option value="RESIGNED">Resign</option>
                </select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Gaji Pokok (Rp)</Label>
                <Input type="number" value={form.salary} onChange={(e) => set("salary", e.target.value)} className="h-9 text-sm" placeholder="0" />
              </div>
            </div>
            {!editing && (
              <p className="text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                Password awal: <b>SchoolHub123!</b> — pegawai dapat mengubahnya setelah login.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={save} disabled={saving || !form.name || !form.email || !form.position} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
