"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, FileText, Loader2 } from "lucide-react";
import TiptapEditor from "./TiptapEditor";

type Page = {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
  updatedAt: string;
};

interface Props { initialPages: Page[] }

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-");
}

const EMPTY = { title: "", slug: "", content: "", isPublished: false };

export default function PagesClient({ initialPages }: Props) {
  const [pages, setPages] = useState<Page[]>(initialPages);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Page | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const openNew = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (p: Page) => {
    setEditing(p);
    setForm({ title: p.title, slug: p.slug, content: p.content, isPublished: p.isPublished });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.slug.trim()) return;
    setSaving(true);
    const payload = { title: form.title.trim(), slug: form.slug.trim(), content: form.content, isPublished: form.isPublished };
    try {
      if (editing) {
        await fetch(`/api/website/pages/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setPages((prev) => prev.map((pg) => pg.id === editing.id ? { ...pg, ...payload, updatedAt: new Date().toISOString() } : pg));
      } else {
        const res = await fetch("/api/website/pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const created = await res.json();
        setPages((prev) => [created, ...prev]);
      }
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus halaman ini?")) return;
    setDeleting(id);
    await fetch(`/api/website/pages/${id}`, { method: "DELETE" });
    setPages((prev) => prev.filter((p) => p.id !== id));
    setDeleting(null);
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Halaman Statis</h1>
          <p className="text-sm text-muted-foreground">Kelola halaman tetap seperti Profil, Visi-Misi, Kontak</p>
        </div>
        <Button onClick={openNew} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Tambah Halaman
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {pages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
              <FileText className="h-10 w-10 opacity-20" />
              <p className="font-medium text-gray-700">Belum ada halaman</p>
              <p className="text-sm">Tambahkan halaman seperti &ldquo;Profil Sekolah&rdquo; atau &ldquo;Kontak&rdquo;.</p>
            </div>
          ) : (
            <div className="divide-y">
              {pages.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-gray-900">{p.title}</p>
                      <Badge variant={p.isPublished ? "default" : "secondary"} className="text-[10px]">
                        {p.isPublished ? "Aktif" : "Draft"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted-foreground">/{p.slug}</span>
                      <span className="text-[11px] text-muted-foreground">·</span>
                      <span className="text-[11px] text-muted-foreground">
                        Diperbarui {new Date(p.updatedAt).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(p.id)}
                      disabled={deleting === p.id}
                    >
                      {deleting === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Halaman" : "Tambah Halaman Baru"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Judul Halaman *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value, slug: editing ? f.slug : slugify(e.target.value) }))}
                  placeholder="Profil Sekolah"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Slug (URL) *</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="profil-sekolah"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Konten Halaman</Label>
              <TiptapEditor
                value={form.content}
                onChange={(html) => setForm((f) => ({ ...f, content: html }))}
                className="min-h-[280px]"
              />
            </div>
            <div className="flex items-center gap-3 py-1">
              <Switch
                checked={form.isPublished}
                onCheckedChange={(v: boolean) => setForm((f) => ({ ...f, isPublished: v }))}
              />
              <span className="text-sm text-gray-700">
                {form.isPublished ? "Aktif (tampil di website)" : "Draft (tidak tampil)"}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving || !form.title.trim()} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Simpan" : "Buat Halaman"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
