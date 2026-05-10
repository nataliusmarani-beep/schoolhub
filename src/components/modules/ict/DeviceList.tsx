"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2, Monitor, Search } from "lucide-react";

interface Device {
  id: string; name: string; type: string; brand: string | null; model: string | null;
  serialNumber: string | null; assetTag: string | null; status: string;
  location: string | null; assignedTo: string | null; purchaseDate: string | null;
  warrantyUntil: string | null; notes: string | null;
}

const STATUS_CLS: Record<string, string> = {
  ACTIVE:      "bg-emerald-100 text-emerald-700 border-emerald-200",
  MAINTENANCE: "bg-yellow-100 text-yellow-700 border-yellow-200",
  RETIRED:     "bg-gray-100 text-gray-500 border-gray-200",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Aktif", MAINTENANCE: "Dalam Perbaikan", RETIRED: "Dihapus",
};

const DEVICE_TYPES = ["LAPTOP", "DESKTOP", "TABLET", "PRINTER", "PROJECTOR", "ROUTER", "LAINNYA"];

const EMPTY = {
  name: "", type: "LAPTOP", brand: "", model: "", serialNumber: "", assetTag: "",
  status: "ACTIVE", location: "", assignedTo: "", purchaseDate: "", warrantyUntil: "", notes: "",
};

export default function DeviceList() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Device | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await fetch("/api/ict/devices").then((r) => r.json());
    setDevices(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (d: Device) => {
    setEditing(d);
    setForm({
      name: d.name, type: d.type, brand: d.brand ?? "", model: d.model ?? "",
      serialNumber: d.serialNumber ?? "", assetTag: d.assetTag ?? "",
      status: d.status, location: d.location ?? "", assignedTo: d.assignedTo ?? "",
      purchaseDate: d.purchaseDate?.slice(0, 10) ?? "",
      warrantyUntil: d.warrantyUntil?.slice(0, 10) ?? "",
      notes: d.notes ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    const body = editing ? { id: editing.id, ...form } : form;
    const method = editing ? "PUT" : "POST";
    const res = await fetch("/api/ict/devices", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (editing) setDevices((p) => p.map((d) => (d.id === editing.id ? data : d)));
    else setDevices((p) => [...p, data]);
    setOpen(false);
    setSaving(false);
  };

  const remove = async (d: Device) => {
    if (!confirm(`Hapus perangkat ${d.name}?`)) return;
    await fetch("/api/ict/devices", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: d.id }) });
    setDevices((p) => p.filter((x) => x.id !== d.id));
  };

  const set = (k: keyof typeof EMPTY, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const filtered = devices.filter((d) => {
    const matchS = d.name.toLowerCase().includes(search.toLowerCase()) || (d.serialNumber ?? "").toLowerCase().includes(search.toLowerCase());
    const matchT = typeFilter === "ALL" || d.type === typeFilter;
    const matchSt = statusFilter === "ALL" || d.status === statusFilter;
    return matchS && matchT && matchSt;
  });

  const stats = devices.reduce((acc, d) => { acc[d.status] = (acc[d.status] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[["ACTIVE", "Aktif", "text-emerald-600"], ["MAINTENANCE", "Dalam Perbaikan", "text-yellow-600"], ["RETIRED", "Dihapus", "text-gray-400"]] .map(([s, label, cls]) => (
          <Card key={s} className="cursor-pointer hover:border-primary/30" onClick={() => setStatusFilter(statusFilter === s ? "ALL" : s)}>
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-bold ${cls}`}>{stats[s] ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama, serial..." className="pl-9 h-9 text-sm" />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none h-9">
            <option value="ALL">Semua Tipe</option>
            {DEVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <Button size="sm" className="gap-1.5 h-9 shrink-0" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Tambah Perangkat
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Monitor className="h-4 w-4" /> {filtered.length} Perangkat
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-2.5 text-left font-semibold text-gray-600">Nama / Tipe</th>
                <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Merk & Model</th>
                <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Serial / Aset</th>
                <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Lokasi</th>
                <th className="px-3 py-2.5 text-center font-semibold text-gray-600">Status</th>
                <th className="px-3 py-2.5 text-center font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-muted-foreground text-sm">Belum ada perangkat</td></tr>
              ) : filtered.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <p className="font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.type}</p>
                  </td>
                  <td className="px-3 py-2.5 text-sm">{[d.brand, d.model].filter(Boolean).join(" ") || "-"}</td>
                  <td className="px-3 py-2.5 text-xs font-mono text-muted-foreground">
                    <p>{d.serialNumber ?? "-"}</p>
                    {d.assetTag && <p className="text-[10px]">{d.assetTag}</p>}
                  </td>
                  <td className="px-3 py-2.5 text-sm">{d.location ?? "-"}</td>
                  <td className="px-3 py-2.5 text-center">
                    <Badge variant="outline" className={`text-[10px] ${STATUS_CLS[d.status]}`}>
                      {STATUS_LABELS[d.status] ?? d.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(d)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => remove(d)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Perangkat" : "Tambah Perangkat"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2 max-h-[70vh] overflow-y-auto pr-1">
            <div className="col-span-2 space-y-1">
              <Label>Nama Perangkat *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} className="h-9" placeholder="Laptop Dell Latitude 5520" />
            </div>
            <div className="space-y-1">
              <Label>Tipe *</Label>
              <select value={form.type} onChange={(e) => set("type", e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none h-9">
                {DEVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none h-9">
                <option value="ACTIVE">Aktif</option>
                <option value="MAINTENANCE">Dalam Perbaikan</option>
                <option value="RETIRED">Dihapus</option>
              </select>
            </div>
            <div className="space-y-1"><Label>Merk</Label><Input value={form.brand} onChange={(e) => set("brand", e.target.value)} className="h-9 text-sm" placeholder="Dell, HP, Canon..." /></div>
            <div className="space-y-1"><Label>Model</Label><Input value={form.model} onChange={(e) => set("model", e.target.value)} className="h-9 text-sm" placeholder="Latitude 5520" /></div>
            <div className="space-y-1"><Label>Serial Number</Label><Input value={form.serialNumber} onChange={(e) => set("serialNumber", e.target.value)} className="h-9 text-sm font-mono" /></div>
            <div className="space-y-1"><Label>Kode Aset</Label><Input value={form.assetTag} onChange={(e) => set("assetTag", e.target.value)} className="h-9 text-sm" placeholder="AST-001" /></div>
            <div className="space-y-1"><Label>Lokasi</Label><Input value={form.location} onChange={(e) => set("location", e.target.value)} className="h-9 text-sm" placeholder="Lab Komputer, Ruang Guru..." /></div>
            <div className="space-y-1"><Label>Ditugaskan ke</Label><Input value={form.assignedTo} onChange={(e) => set("assignedTo", e.target.value)} className="h-9 text-sm" placeholder="Nama pengguna..." /></div>
            <div className="space-y-1"><Label>Tanggal Beli</Label><Input type="date" value={form.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} className="h-9 text-sm" /></div>
            <div className="space-y-1"><Label>Garansi Hingga</Label><Input type="date" value={form.warrantyUntil} onChange={(e) => set("warrantyUntil", e.target.value)} className="h-9 text-sm" /></div>
            <div className="col-span-2 space-y-1"><Label>Catatan</Label><Input value={form.notes} onChange={(e) => set("notes", e.target.value)} className="h-9 text-sm" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={save} disabled={saving || !form.name} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
