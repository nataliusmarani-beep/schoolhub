"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";

type GalleryItem = {
  id: string;
  albumName: string;
  imageUrl: string;
  caption: string | null;
  sortOrder: number;
};

interface Props { initialItems: GalleryItem[] }

const EMPTY = { albumName: "", imageUrl: "", caption: "" };

export default function GalleryClient({ initialItems }: Props) {
  const [items, setItems] = useState<GalleryItem[]>(initialItems);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filterAlbum, setFilterAlbum] = useState("all");

  const albums = ["all", ...Array.from(new Set(items.map((i) => i.albumName))).sort()];
  const filtered = filterAlbum === "all" ? items : items.filter((i) => i.albumName === filterAlbum);

  const handleSave = async () => {
    if (!form.albumName.trim() || !form.imageUrl.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/website/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumName: form.albumName.trim(), imageUrl: form.imageUrl.trim(), caption: form.caption.trim() || null }),
      });
      const created = await res.json();
      setItems((prev) => [...prev, created]);
      setForm(EMPTY);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus foto ini?")) return;
    setDeleting(id);
    await fetch("/api/website/gallery", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems((prev) => prev.filter((i) => i.id !== id));
    setDeleting(null);
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Galeri Foto</h1>
          <p className="text-sm text-muted-foreground">Kelola album dan foto kegiatan sekolah</p>
        </div>
        <Button onClick={() => setOpen(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Tambah Foto
        </Button>
      </div>

      {/* Album filter */}
      <div className="flex gap-2 flex-wrap">
        {albums.map((a) => (
          <button
            key={a}
            onClick={() => setFilterAlbum(a)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterAlbum === a
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {a === "all" ? "Semua Album" : a}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
            <ImageIcon className="h-10 w-10 opacity-20" />
            <p className="font-medium text-gray-700">Belum ada foto</p>
            <p className="text-sm">Tambahkan foto dengan memasukkan URL gambar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((item) => (
            <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt={item.caption ?? item.albumName}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder-image.svg"; }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end p-2">
                <div className="hidden group-hover:flex items-center justify-between w-full">
                  {item.caption && (
                    <p className="text-white text-xs truncate flex-1">{item.caption}</p>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deleting === item.id}
                    className="ml-auto bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-lg transition-colors"
                  >
                    {deleting === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  </button>
                </div>
              </div>
              <div className="absolute top-1.5 left-1.5">
                <Badge variant="secondary" className="text-[9px] py-0 px-1.5 bg-black/50 text-white border-0">
                  {item.albumName}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Foto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nama Album *</Label>
              <Input
                value={form.albumName}
                onChange={(e) => setForm((f) => ({ ...f, albumName: e.target.value }))}
                placeholder="Wisuda 2025, Kegiatan Olahraga..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>URL Gambar *</Label>
              <Input
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://..."
              />
              {form.imageUrl && (
                <div className="mt-2 aspect-video rounded-lg overflow-hidden bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Keterangan (opsional)</Label>
              <Input
                value={form.caption}
                onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
                placeholder="Keterangan foto..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving || !form.albumName.trim() || !form.imageUrl.trim()} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan Foto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
