"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, School } from "lucide-react";

type SchoolInfo = {
  name: string;
  slug: string;
  logo: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  city: string | null;
  province: string | null;
  type: string;
};

interface Props { info: SchoolInfo }

export default function WebsiteSettingsClient({ info }: Props) {
  const [form, setForm] = useState({
    name: info.name ?? "",
    logo: info.logo ?? "",
    address: info.address ?? "",
    phone: info.phone ?? "",
    email: info.email ?? "",
    website: info.website ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await fetch("/api/website/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Pengaturan Website</h1>
        <p className="text-sm text-muted-foreground">Kelola identitas dan informasi kontak sekolah</p>
      </div>

      <Card>
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <School className="h-4 w-4 text-primary" />
            Identitas Sekolah
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nama Sekolah</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Slug Website (read-only)</Label>
              <Input value={info.slug} disabled className="bg-gray-50 text-gray-500" />
              <p className="text-[11px] text-muted-foreground">URL website: /{info.slug}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>URL Logo</Label>
            <Input
              value={form.logo}
              onChange={(e) => set("logo", e.target.value)}
              placeholder="https://..."
            />
            {form.logo && (
              <div className="mt-2 h-16 w-16 rounded-lg overflow-hidden border bg-gray-50 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.logo} alt="logo preview" className="h-full w-full object-contain p-1" />
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Alamat</Label>
            <Textarea
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              rows={3}
              placeholder="Jl. Pendidikan No. 1..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nomor Telepon</Label>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="021-..." />
            </div>
            <div className="space-y-1.5">
              <Label>Email Sekolah</Label>
              <Input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="info@sekolah.sch.id" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Website Resmi (opsional)</Label>
            <Input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://sekolah.sch.id" />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
        {saved && <span className="text-sm text-emerald-600 font-medium">Tersimpan!</span>}
      </div>
    </div>
  );
}
