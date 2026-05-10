"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2, Key, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";

interface License {
  id: string; software: string; licenseKey: string | null; seats: number; usedSeats: number;
  vendor: string | null; expiresAt: string | null; notes: string | null;
  expiring: boolean; expired: boolean;
}

const EMPTY = { software: "", licenseKey: "", seats: "1", usedSeats: "0", vendor: "", expiresAt: "", notes: "" };

export default function LicenseList() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<License | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    const data = await fetch("/api/ict/licenses").then((r) => r.json());
    setLicenses(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (l: License) => {
    setEditing(l);
    setForm({
      software: l.software, licenseKey: l.licenseKey ?? "", seats: l.seats.toString(),
      usedSeats: l.usedSeats.toString(), vendor: l.vendor ?? "",
      expiresAt: l.expiresAt?.slice(0, 10) ?? "", notes: l.notes ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    const body = editing ? { id: editing.id, ...form } : form;
    const method = editing ? "PUT" : "POST";
    const res = await fetch("/api/ict/licenses", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (editing) setLicenses((p) => p.map((l) => (l.id === editing.id ? data : l)));
    else setLicenses((p) => [...p, data]);
    setOpen(false);
    setSaving(false);
  };

  const remove = async (l: License) => {
    if (!confirm(`Hapus lisensi ${l.software}?`)) return;
    await fetch("/api/ict/licenses", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: l.id }) });
    setLicenses((p) => p.filter((x) => x.id !== l.id));
  };

  const set = (k: keyof typeof EMPTY, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const toggleKey = (id: string) => setShowKey((p) => ({ ...p, [id]: !p[id] }));

  const maskKey = (key: string) => key.length <= 8 ? "••••••••" : key.slice(0, 4) + "••••••••" + key.slice(-4);

  const expiring = licenses.filter((l) => l.expiring && !l.expired);

  return (
    <div className="space-y-4">
      {expiring.length > 0 && (
        <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-yellow-800">Lisensi akan segera berakhir</p>
            <p className="text-xs text-yellow-700 mt-0.5">
              {expiring.map((l) => l.software).join(", ")} — perlu diperpanjang dalam 30 hari.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5 h-9" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Tambah Lisensi
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Key className="h-4 w-4" /> {licenses.length} Lisensi Software
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {licenses.length === 0 && !loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Belum ada data lisensi</p>
          ) : (
            <div className="divide-y">
              {licenses.map((l) => {
                const daysLeft = l.expiresAt ? differenceInDays(new Date(l.expiresAt), new Date()) : null;
                return (
                  <div key={l.id} className="px-4 py-3 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900">{l.software}</p>
                        {l.expired && <Badge variant="destructive" className="text-[10px]">Kadaluarsa</Badge>}
                        {l.expiring && !l.expired && <Badge variant="outline" className="text-[10px] border-yellow-200 text-yellow-700">Segera Berakhir</Badge>}
                      </div>
                      {l.licenseKey && (
                        <div className="flex items-center gap-1 mt-1">
                          <code className="text-xs text-muted-foreground font-mono">
                            {showKey[l.id] ? l.licenseKey : maskKey(l.licenseKey)}
                          </code>
                          <button onClick={() => toggleKey(l.id)} className="p-0.5 text-muted-foreground hover:text-gray-700">
                            {showKey[l.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </button>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                        {l.vendor && <span>Vendor: {l.vendor}</span>}
                        <span>Seat: <b>{l.usedSeats}/{l.seats}</b></span>
                        {l.expiresAt && (
                          <span className={l.expired ? "text-red-600 font-semibold" : l.expiring ? "text-yellow-600 font-semibold" : ""}>
                            Berakhir: {format(new Date(l.expiresAt), "d MMM yyyy", { locale: id })}
                            {daysLeft !== null && daysLeft >= 0 && ` (${daysLeft} hari lagi)`}
                          </span>
                        )}
                      </div>
                      {l.notes && <p className="text-xs text-gray-500 mt-0.5 truncate">{l.notes}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(l)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => remove(l)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? "Edit Lisensi" : "Tambah Lisensi"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Nama Software *</Label><Input value={form.software} onChange={(e) => set("software", e.target.value)} className="h-9" placeholder="Microsoft Office 2021" /></div>
            <div className="space-y-1"><Label>License Key</Label><Input value={form.licenseKey} onChange={(e) => set("licenseKey", e.target.value)} className="h-9 text-sm font-mono" placeholder="XXXXX-XXXXX-XXXXX" /></div>
            <div className="space-y-1"><Label>Vendor</Label><Input value={form.vendor} onChange={(e) => set("vendor", e.target.value)} className="h-9 text-sm" placeholder="Microsoft, Adobe..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Total Seat</Label><Input type="number" min="1" value={form.seats} onChange={(e) => set("seats", e.target.value)} className="h-9 text-sm" /></div>
              <div className="space-y-1"><Label>Digunakan</Label><Input type="number" min="0" value={form.usedSeats} onChange={(e) => set("usedSeats", e.target.value)} className="h-9 text-sm" /></div>
            </div>
            <div className="space-y-1"><Label>Tanggal Berakhir</Label><Input type="date" value={form.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} className="h-9 text-sm" /></div>
            <div className="space-y-1"><Label>Catatan</Label><Input value={form.notes} onChange={(e) => set("notes", e.target.value)} className="h-9 text-sm" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={save} disabled={saving || !form.software} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
