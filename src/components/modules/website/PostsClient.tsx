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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Newspaper, Loader2 } from "lucide-react";
import TiptapEditor from "./TiptapEditor";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  tags: string[];
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
};

interface Props {
  initialPosts: Post[];
}

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-");
}

const EMPTY_FORM = { title: "", slug: "", excerpt: "", content: "", coverImage: "", tags: "", isPublished: false };

export default function PostsClient({ initialPosts }: Props) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setOpen(true); };
  const openEdit = (p: Post) => {
    setEditing(p);
    setForm({
      title: p.title, slug: p.slug, excerpt: p.excerpt ?? "",
      content: p.content, coverImage: p.coverImage ?? "",
      tags: p.tags.join(", "), isPublished: p.isPublished,
    });
    setOpen(true);
  };

  const handleTitleChange = (v: string) => {
    setForm((f) => ({ ...f, title: v, slug: editing ? f.slug : slugify(v) }));
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.slug.trim()) return;
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      excerpt: form.excerpt.trim() || null,
      content: form.content,
      coverImage: form.coverImage.trim() || null,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      isPublished: form.isPublished,
    };

    try {
      if (editing) {
        await fetch(`/api/website/posts/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setPosts((prev) => prev.map((p) => p.id === editing.id ? { ...p, ...payload, publishedAt: p.publishedAt } : p));
      } else {
        const res = await fetch("/api/website/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const created = await res.json();
        setPosts((prev) => [created, ...prev]);
      }
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus artikel ini?")) return;
    setDeleting(id);
    await fetch(`/api/website/posts/${id}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setDeleting(null);
  };

  const filtered = posts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Berita & Artikel</h1>
          <p className="text-sm text-muted-foreground">Kelola konten berita dan artikel sekolah</p>
        </div>
        <Button onClick={openNew} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Tulis Artikel
        </Button>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Cari artikel..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
              <Newspaper className="h-10 w-10 opacity-20" />
              <p className="font-medium text-gray-700">Belum ada artikel</p>
              <p className="text-sm">Klik &ldquo;Tulis Artikel&rdquo; untuk mulai membuat konten.</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((p) => (
                <div key={p.id} className="flex items-start gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 text-sm">{p.title}</p>
                      <Badge variant={p.isPublished ? "default" : "secondary"} className="text-[10px]">
                        {p.isPublished ? "Dipublikasi" : "Draft"}
                      </Badge>
                    </div>
                    {p.excerpt && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.excerpt}</p>}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[11px] text-muted-foreground">/{p.slug}</span>
                      {p.tags.map((t) => (
                        <Badge key={t} variant="outline" className="text-[10px] py-0">{t}</Badge>
                      ))}
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString("id-ID")}
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
            <DialogTitle>{editing ? "Edit Artikel" : "Tulis Artikel Baru"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Judul *</Label>
                <Input value={form.title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Judul artikel" />
              </div>
              <div className="space-y-1.5">
                <Label>Slug (URL) *</Label>
                <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="judul-artikel" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Ringkasan / Excerpt</Label>
              <Textarea value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} placeholder="Deskripsi singkat artikel..." rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Foto Sampul (URL)</Label>
              <Input value={form.coverImage} onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label>Tags (pisah dengan koma)</Label>
              <Input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="berita, kegiatan, prestasi" />
            </div>
            <div className="space-y-1.5">
              <Label>Konten Artikel</Label>
              <TiptapEditor
                value={form.content}
                onChange={(html) => setForm((f) => ({ ...f, content: html }))}
                className="min-h-[260px]"
              />
            </div>
            <div className="flex items-center gap-3 py-1">
              <Switch
                checked={form.isPublished}
                onCheckedChange={(v: boolean) => setForm((f) => ({ ...f, isPublished: v }))}
              />
              <span className="text-sm text-gray-700">
                {form.isPublished ? "Dipublikasi (tampil di website)" : "Draft (tidak tampil)"}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving || !form.title.trim()} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Simpan Perubahan" : "Terbitkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
