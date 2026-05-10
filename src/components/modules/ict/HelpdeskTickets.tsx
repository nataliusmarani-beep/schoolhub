"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Ticket, Clock, CheckCircle, Wrench, XCircle } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface ITTicket {
  id: string; title: string; description: string; priority: string; status: string;
  createdAt: string; updatedAt: string; resolvedAt: string | null;
  createdBy: { name: string }; assignedTo: { name: string } | null;
}

const STATUS_META: Record<string, { label: string; cls: string; Icon: React.ElementType }> = {
  OPEN:        { label: "Open",           cls: "bg-red-100 text-red-700 border-red-200",       Icon: Clock },
  IN_PROGRESS: { label: "In Progress",    cls: "bg-blue-100 text-blue-700 border-blue-200",    Icon: Wrench },
  RESOLVED:    { label: "Resolved",       cls: "bg-emerald-100 text-emerald-700 border-emerald-200", Icon: CheckCircle },
  CLOSED:      { label: "Closed",         cls: "bg-gray-100 text-gray-500 border-gray-200",    Icon: XCircle },
};

const PRIORITY_CLS: Record<string, string> = {
  LOW:      "bg-gray-100 text-gray-600",
  MEDIUM:   "bg-blue-100 text-blue-700",
  HIGH:     "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700 font-semibold",
};

const EMPTY_FORM = { title: "", description: "", priority: "MEDIUM" };

export default function HelpdeskTickets() {
  const [tickets, setTickets] = useState<ITTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [detailTicket, setDetailTicket] = useState<ITTicket | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [noteInput, setNoteInput] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await fetch("/api/ict/tickets").then((r) => r.json());
    setTickets(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.title || !form.description) return;
    setSaving(true);
    const res = await fetch("/api/ict/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setTickets((p) => [data, ...p]);
    setOpen(false);
    setForm(EMPTY_FORM);
    setSaving(false);
  };

  const updateStatus = async (ticket: ITTicket, status: string) => {
    const res = await fetch("/api/ict/tickets", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: ticket.id, status }) });
    const data = await res.json();
    setTickets((p) => p.map((t) => (t.id === ticket.id ? data : t)));
    if (detailTicket?.id === ticket.id) setDetailTicket(data);
  };

  const addNote = async (ticket: ITTicket) => {
    if (!noteInput.trim()) return;
    const res = await fetch("/api/ict/tickets", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: ticket.id, notes: noteInput }) });
    const data = await res.json();
    setTickets((p) => p.map((t) => (t.id === ticket.id ? data : t)));
    setDetailTicket(data);
    setNoteInput("");
  };

  const set = (k: keyof typeof EMPTY_FORM, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const filtered = statusFilter === "ALL" ? tickets : tickets.filter((t) => t.status === statusFilter);
  const counts: Record<string, number> = { ALL: tickets.length, OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 };
  tickets.forEach((t) => { counts[t.status] = (counts[t.status] || 0) + 1; });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {(["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const).map((s) => {
            const meta = STATUS_META[s];
            return (
              <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" className="h-8 text-xs gap-1"
                onClick={() => setStatusFilter(s)}>
                {s === "ALL" ? "Semua" : meta.label}
                <span className="font-bold">{counts[s]}</span>
              </Button>
            );
          })}
        </div>
        <Button size="sm" className="gap-1.5 h-9" onClick={() => { setForm(EMPTY_FORM); setOpen(true); }}>
          <Plus className="h-4 w-4" /> Buat Tiket
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Ticket className="h-4 w-4" /> {filtered.length} Tiket
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 && !loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Tidak ada tiket</p>
          ) : (
            <div className="divide-y">
              {filtered.map((t) => {
                const meta = STATUS_META[t.status] ?? STATUS_META.OPEN;
                const Icon = meta.Icon;
                return (
                  <div key={t.id} className="px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-gray-50" onClick={() => { setDetailTicket(t); setNoteInput(""); }}>
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${t.status === "OPEN" ? "text-red-500" : t.status === "IN_PROGRESS" ? "text-blue-500" : t.status === "RESOLVED" ? "text-emerald-600" : "text-gray-400"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{t.title}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PRIORITY_CLS[t.priority]}`}>{t.priority}</span>
                        <Badge variant="outline" className={`text-[10px] ${meta.cls}`}>{meta.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        <span>Oleh: {t.createdBy.name}</span>
                        {t.assignedTo && <span>· Ditangani: {t.assignedTo.name}</span>}
                        <span>· {format(new Date(t.createdAt), "d MMM", { locale: id })}</span>
                      </div>
                    </div>
                    {t.status === "OPEN" && (
                      <Button variant="outline" size="sm" className="h-7 text-xs shrink-0" onClick={(e) => { e.stopPropagation(); updateStatus(t, "IN_PROGRESS"); }}>
                        Tangani
                      </Button>
                    )}
                    {t.status === "IN_PROGRESS" && (
                      <Button variant="outline" size="sm" className="h-7 text-xs text-emerald-600 border-emerald-200 shrink-0" onClick={(e) => { e.stopPropagation(); updateStatus(t, "RESOLVED"); }}>
                        Selesai
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New ticket dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Buat Tiket IT</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Judul *</Label><Input value={form.title} onChange={(e) => set("title", e.target.value)} className="h-9" placeholder="Printer tidak bisa print..." /></div>
            <div className="space-y-1">
              <Label>Deskripsi *</Label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                rows={4} placeholder="Jelaskan masalah secara detail..." />
            </div>
            <div className="space-y-1">
              <Label>Prioritas</Label>
              <select value={form.priority} onChange={(e) => set("priority", e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none h-9">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={submit} disabled={saving || !form.title || !form.description} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Submit Tiket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket detail dialog */}
      {detailTicket && (
        <Dialog open={!!detailTicket} onOpenChange={() => setDetailTicket(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base">{detailTicket.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-1">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={`text-xs ${STATUS_META[detailTicket.status]?.cls}`}>
                  {STATUS_META[detailTicket.status]?.label ?? detailTicket.status}
                </Badge>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${PRIORITY_CLS[detailTicket.priority]}`}>{detailTicket.priority}</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>Dilaporkan oleh: <b>{detailTicket.createdBy.name}</b></p>
                <p>Tanggal: {format(new Date(detailTicket.createdAt), "d MMMM yyyy HH:mm", { locale: id })}</p>
                {detailTicket.assignedTo && <p>Ditangani: <b>{detailTicket.assignedTo.name}</b></p>}
                {detailTicket.resolvedAt && <p>Selesai: {format(new Date(detailTicket.resolvedAt), "d MMMM yyyy HH:mm", { locale: id })}</p>}
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{detailTicket.description}</p>
              </div>
              <div className="flex gap-2 flex-wrap pt-1">
                {detailTicket.status === "OPEN" && (
                  <Button size="sm" className="h-8 text-xs" onClick={() => updateStatus(detailTicket, "IN_PROGRESS")}>Mulai Tangani</Button>
                )}
                {detailTicket.status === "IN_PROGRESS" && (
                  <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatus(detailTicket, "RESOLVED")}>Tandai Selesai</Button>
                )}
                {detailTicket.status === "RESOLVED" && (
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => updateStatus(detailTicket, "CLOSED")}>Tutup Tiket</Button>
                )}
              </div>
              <div className="space-y-2 pt-1">
                <Label className="text-xs">Tambah Catatan</Label>
                <div className="flex gap-2">
                  <Input value={noteInput} onChange={(e) => setNoteInput(e.target.value)} className="h-8 text-sm flex-1" placeholder="Tulis catatan penanganan..." />
                  <Button size="sm" className="h-8 px-3" onClick={() => addNote(detailTicket)} disabled={!noteInput.trim()}>Kirim</Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
