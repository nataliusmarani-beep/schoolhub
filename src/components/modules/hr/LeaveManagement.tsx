"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, CheckCircle, XCircle, Clock } from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import { id } from "date-fns/locale";

interface LeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: string;
  createdAt: string;
  user: { name: string; role: string };
  reviewer: { name: string } | null;
  reviewedAt: string | null;
}

const EMPTY = { type: "CUTI_TAHUNAN", startDate: "", endDate: "", reason: "" };

const TYPE_LABELS: Record<string, string> = {
  SAKIT: "Sakit", CUTI_TAHUNAN: "Cuti Tahunan", IZIN: "Izin", DINAS_LUAR: "Dinas Luar",
};

const STATUS_CLS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  PENDING: Clock, APPROVED: CheckCircle, REJECTED: XCircle,
};

export default function LeaveManagement() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("ALL");

  const load = async () => {
    setLoading(true);
    const url = filter !== "ALL" ? `/api/hr/leave?status=${filter}` : "/api/hr/leave";
    const data = await fetch(url).then((r) => r.json());
    setRequests(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const submit = async () => {
    if (!form.type || !form.startDate || !form.endDate) return;
    setSaving(true);
    const res = await fetch("/api/hr/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setRequests((p) => [data, ...p]);
    setOpen(false);
    setForm(EMPTY);
    setSaving(false);
  };

  const review = async (id: string, status: "APPROVED" | "REJECTED") => {
    const res = await fetch("/api/hr/leave", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const updated = await res.json();
    setRequests((p) => p.map((r) => (r.id === id ? updated : r)));
  };

  const set = (k: keyof typeof EMPTY, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const counts = { ALL: requests.length, PENDING: 0, APPROVED: 0, REJECTED: 0 };
  requests.forEach((r) => { counts[r.status as keyof typeof counts] = (counts[r.status as keyof typeof counts] || 0) + 1; });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
            <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" className="h-8 text-xs gap-1"
              onClick={() => setFilter(s)}>
              {s === "ALL" ? "Semua" : s === "PENDING" ? "Menunggu" : s === "APPROVED" ? "Disetujui" : "Ditolak"}
              <span className="ml-0.5 font-bold">{counts[s]}</span>
            </Button>
          ))}
        </div>
        <Button size="sm" className="gap-1.5 h-9" onClick={() => { setForm(EMPTY); setOpen(true); }}>
          <Plus className="h-4 w-4" /> Ajukan Cuti
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : requests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Tidak ada pengajuan</p>
          ) : (
            <div className="divide-y">
              {requests.map((req) => {
                const Icon = STATUS_ICONS[req.status] ?? Clock;
                const days = differenceInCalendarDays(new Date(req.endDate), new Date(req.startDate)) + 1;
                return (
                  <div key={req.id} className="px-4 py-3 flex items-start gap-3">
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${req.status === "APPROVED" ? "text-emerald-600" : req.status === "REJECTED" ? "text-red-500" : "text-yellow-500"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-gray-900">{req.user.name}</p>
                        <Badge variant="outline" className="text-[10px]">{TYPE_LABELS[req.type] ?? req.type}</Badge>
                        <Badge variant="outline" className={`text-[10px] ${STATUS_CLS[req.status]}`}>
                          {req.status === "PENDING" ? "Menunggu" : req.status === "APPROVED" ? "Disetujui" : "Ditolak"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(req.startDate), "d MMM yyyy", { locale: id })}
                        {req.startDate !== req.endDate && ` – ${format(new Date(req.endDate), "d MMM yyyy", { locale: id })}`}
                        {" "}· <b>{days} hari</b>
                      </p>
                      {req.reason && <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{req.reason}</p>}
                      {req.reviewer && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Ditinjau oleh {req.reviewer.name} · {format(new Date(req.reviewedAt!), "d MMM", { locale: id })}
                        </p>
                      )}
                    </div>
                    {req.status === "PENDING" && (
                      <div className="flex gap-1 shrink-0">
                        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          onClick={() => review(req.id, "APPROVED")}>
                          <CheckCircle className="h-3 w-3" /> Setuju
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs text-red-500 border-red-200 hover:bg-red-50"
                          onClick={() => review(req.id, "REJECTED")}>
                          <XCircle className="h-3 w-3" /> Tolak
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Ajukan Cuti / Izin</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Jenis</Label>
              <select value={form.type} onChange={(e) => set("type", e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none h-9">
                <option value="CUTI_TAHUNAN">Cuti Tahunan</option>
                <option value="SAKIT">Sakit</option>
                <option value="IZIN">Izin</option>
                <option value="DINAS_LUAR">Dinas Luar</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tanggal Mulai *</Label>
                <Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label>Tanggal Selesai *</Label>
                <Input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} className="h-9 text-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Alasan</Label>
              <textarea value={form.reason} onChange={(e) => set("reason", e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                rows={3} placeholder="Alasan pengajuan..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={submit} disabled={saving || !form.startDate || !form.endDate} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Ajukan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
