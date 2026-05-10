"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, ArrowDown, ArrowUp, Wrench, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Item { id: string; name: string; code: string | null; quantity: number; unit: string }
interface Transaction {
  id: string; type: string; quantity: number; note: string | null; createdAt: string;
  item: { name: string; code: string | null };
}

const TX_META: Record<string, { label: string; cls: string; Icon: React.ElementType }> = {
  MASUK:     { label: "Masuk",     cls: "bg-emerald-100 text-emerald-700 border-emerald-200", Icon: ArrowDown },
  KELUAR:    { label: "Keluar",    cls: "bg-red-100 text-red-700 border-red-200",             Icon: ArrowUp },
  RUSAK:     { label: "Rusak",     cls: "bg-orange-100 text-orange-700 border-orange-200",    Icon: Trash2 },
  PERBAIKAN: { label: "Perbaikan", cls: "bg-blue-100 text-blue-700 border-blue-200",          Icon: Wrench },
};

const EMPTY = { itemId: "", type: "MASUK", quantity: "1", note: "" };

export default function InventoryTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const loadItems = useCallback(async () => {
    const data = await fetch("/api/inventory").then((r) => r.json());
    setItems(Array.isArray(data) ? data : []);
  }, []);

  const loadTxs = useCallback(async () => {
    setLoading(true);
    const data = await fetch("/api/inventory/transactions").then((r) => r.json());
    setTransactions(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { loadItems(); loadTxs(); }, [loadItems, loadTxs]);

  const save = async () => {
    if (!form.itemId || !form.quantity) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/inventory/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Gagal menyimpan"); setSaving(false); return; }
    setTransactions((p) => [data, ...p]);
    setOpen(false);
    setForm(EMPTY);
    setSaving(false);
    loadItems();
  };

  const set = (k: keyof typeof EMPTY, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const filtered = typeFilter === "ALL" ? transactions : transactions.filter((t) => t.type === typeFilter);

  const selectedItem = items.find((i) => i.id === form.itemId);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {(["ALL", "MASUK", "KELUAR", "RUSAK", "PERBAIKAN"] as const).map((t) => (
            <Button key={t} variant={typeFilter === t ? "default" : "outline"} size="sm" className="h-8 text-xs"
              onClick={() => setTypeFilter(t)}>
              {t === "ALL" ? "Semua" : TX_META[t].label}
            </Button>
          ))}
        </div>
        <Button size="sm" className="gap-1.5 h-9" onClick={() => { setForm(EMPTY); setError(""); setOpen(true); }}>
          <Plus className="h-4 w-4" /> Tambah Transaksi
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold">{filtered.length} Transaksi</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Belum ada transaksi</p>
          ) : (
            <div className="divide-y">
              {filtered.map((tx) => {
                const meta = TX_META[tx.type] ?? TX_META.MASUK;
                const Icon = meta.Icon;
                return (
                  <div key={tx.id} className="flex items-center px-4 py-3 gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${meta.cls}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{tx.item.name}</p>
                        {tx.item.code && <span className="text-[10px] text-muted-foreground font-mono">{tx.item.code}</span>}
                        <Badge variant="outline" className={`text-[10px] ${meta.cls}`}>{meta.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        <span>Qty: <b>{tx.type === "KELUAR" ? `-${tx.quantity}` : `+${tx.quantity}`}</b></span>
                        {tx.note && <span>· {tx.note}</span>}
                        <span>· {format(new Date(tx.createdAt), "d MMM yyyy", { locale: id })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Tambah Transaksi</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
            <div className="space-y-1">
              <Label>Barang *</Label>
              <select value={form.itemId} onChange={(e) => set("itemId", e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none h-9">
                <option value="">Pilih barang...</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>{i.name} (stok: {i.quantity} {i.unit})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Jenis Transaksi *</Label>
              <select value={form.type} onChange={(e) => set("type", e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none h-9">
                <option value="MASUK">Masuk (tambah stok)</option>
                <option value="KELUAR">Keluar (kurangi stok)</option>
                <option value="RUSAK">Rusak (catat kerusakan)</option>
                <option value="PERBAIKAN">Perbaikan (catat perbaikan)</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Jumlah *</Label>
              <Input type="number" min="1" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} className="h-9 text-sm" />
              {selectedItem && form.type === "KELUAR" && (
                <p className="text-xs text-muted-foreground">Stok tersedia: {selectedItem.quantity} {selectedItem.unit}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Keterangan</Label>
              <Input value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="Catatan..." className="h-9 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={save} disabled={saving || !form.itemId} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
