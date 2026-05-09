"use client";

import { useState, useMemo } from "react";
import type { EnrichedInventoryItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Package, AlertTriangle } from "lucide-react";

interface Category { id: string; name: string; icon: string | null; }

function StatusBadge({ status }: { status: string }) {
  if (status === "out_of_stock") return <Badge variant="destructive">Habis</Badge>;
  if (status === "low_stock") return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Kritis</Badge>;
  return <Badge variant="secondary">OK</Badge>;
}

const CONDITIONS = ["BAIK", "RUSAK_RINGAN", "RUSAK_BERAT", "HILANG"] as const;

interface Props {
  initialItems: EnrichedInventoryItem[];
  categories: Category[];
  schoolId: string;
}

export default function InventoryClient({ initialItems, categories, schoolId }: Props) {
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EnrichedInventoryItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", code: "", categoryId: "", quantity: 0,
    unit: "pcs", minThreshold: 5, location: "", condition: "BAIK", description: "",
  });

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.code ?? "").toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === "all" || item.categoryId === categoryFilter;
      const matchStat = statusFilter === "all" || item.status === statusFilter;
      return matchSearch && matchCat && matchStat;
    });
  }, [items, search, categoryFilter, statusFilter]);

  function openAdd() {
    setEditing(null);
    setForm({ name: "", code: "", categoryId: "", quantity: 0, unit: "pcs", minThreshold: 5, location: "", condition: "BAIK", description: "" });
    setShowForm(true);
  }

  function openEdit(item: EnrichedInventoryItem) {
    setEditing(item);
    setForm({
      name: item.name, code: item.code ?? "", categoryId: item.categoryId ?? "",
      quantity: item.quantity, unit: item.unit, minThreshold: item.minThreshold,
      location: item.location ?? "", condition: item.condition, description: item.description ?? "",
    });
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    const url = editing ? `/api/inventory/${editing.id}` : "/api/inventory";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, school_id: schoolId }),
    });
    if (res.ok) {
      const updated = await res.json();
      if (editing) {
        setItems((prev) => prev.map((i) => (i.id === editing.id ? updated : i)));
      } else {
        setItems((prev) => [...prev, updated]);
      }
      setShowForm(false);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus item ini?")) return;
    await fetch(`/api/inventory/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const lowCount = items.filter((i) => i.status !== "ok").length;

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-3">
          <div className="bg-white border rounded-lg px-4 py-2 text-center">
            <p className="text-xl font-bold text-gray-900">{items.length}</p>
            <p className="text-xs text-muted-foreground">Total Item</p>
          </div>
          {lowCount > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-xl font-bold text-orange-700">{lowCount}</p>
                <p className="text-xs text-orange-600">Kritis / Habis</p>
              </div>
            </div>
          )}
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" /> Tambah Item
        </Button>
      </div>

      <Card>
        <CardContent className="p-3 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Cari nama atau kode..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="border rounded-md px-3 py-2 text-sm bg-white" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">Semua Kategori</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="border rounded-md px-3 py-2 text-sm bg-white" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Semua Status</option>
            <option value="ok">OK</option>
            <option value="low_stock">Kritis</option>
            <option value="out_of_stock">Habis</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["Nama", "Kode", "Kategori", "Qty", "Satuan", "Lokasi", "Kondisi", "Status", "Aksi"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      Tidak ada item ditemukan
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.code ?? "-"}</td>
                      <td className="px-4 py-3">{item.category?.name ?? "-"}</td>
                      <td className="px-4 py-3 font-semibold">{item.quantity}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.unit}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.location ?? "-"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={item.condition === "BAIK" ? "secondary" : item.condition === "RUSAK_RINGAN" ? "outline" : "destructive"}>
                          {item.condition.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={item.status ?? "ok"} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(item)} className="text-xs text-blue-600 hover:underline">Edit</button>
                          <button onClick={() => handleDelete(item.id)} className="text-xs text-red-600 hover:underline">Hapus</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Item" : "Tambah Item Baru"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label>Nama Item</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama item" />
            </div>
            <div className="space-y-1">
              <Label>Kode</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="ATK-001" />
            </div>
            <div className="space-y-1">
              <Label>Kategori</Label>
              <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Tanpa Kategori</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Jumlah</Label>
              <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
            </div>
            <div className="space-y-1">
              <Label>Satuan</Label>
              <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="pcs" />
            </div>
            <div className="space-y-1">
              <Label>Min. Stok</Label>
              <Input type="number" value={form.minThreshold} onChange={(e) => setForm({ ...form, minThreshold: Number(e.target.value) })} />
            </div>
            <div className="space-y-1">
              <Label>Kondisi</Label>
              <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
                {CONDITIONS.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Lokasi</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Gudang A" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Deskripsi</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Opsional" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving || !form.name}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
