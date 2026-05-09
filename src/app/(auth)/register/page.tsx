"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Loader2, CheckCircle2, ChevronRight, ChevronLeft, Building2, User, PartyPopper } from "lucide-react";

const SCHOOL_TYPES = ["SD", "SMP", "SMA", "SMK", "MI", "MTS", "MA"];
const PROVINCES = [
  "Aceh","Bali","Banten","Bengkulu","DI Yogyakarta","DKI Jakarta","Gorontalo","Jambi",
  "Jawa Barat","Jawa Tengah","Jawa Timur","Kalimantan Barat","Kalimantan Selatan",
  "Kalimantan Tengah","Kalimantan Timur","Kalimantan Utara","Kepulauan Bangka Belitung",
  "Kepulauan Riau","Lampung","Maluku","Maluku Utara","Nusa Tenggara Barat",
  "Nusa Tenggara Timur","Papua","Papua Barat","Papua Barat Daya","Papua Pegunungan",
  "Papua Selatan","Papua Tengah","Riau","Sulawesi Barat","Sulawesi Selatan",
  "Sulawesi Tengah","Sulawesi Tenggara","Sulawesi Utara","Sumatera Barat",
  "Sumatera Selatan","Sumatera Utara",
];

const STEPS = [
  { id: 1, label: "Info Sekolah", icon: Building2 },
  { id: 2, label: "Akun Admin",  icon: User },
  { id: 3, label: "Selesai",     icon: CheckCircle2 },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [school, setSchool] = useState({
    name: "", slug: "", npsn: "", type: "SMA", province: "", city: "",
  });
  const [admin, setAdmin] = useState({
    name: "", email: "", password: "", confirm: "",
  });

  function setSchoolField(k: string, v: string) {
    setSchool((s) => {
      const next = { ...s, [k]: v };
      if (k === "name" && !s.slug) {
        next.slug = v.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
      }
      return next;
    });
  }

  function validateStep1() {
    if (!school.name.trim()) return "Nama sekolah wajib diisi.";
    if (!school.type) return "Pilih jenis sekolah.";
    if (!school.city.trim()) return "Kota wajib diisi.";
    if (!school.slug.trim()) return "Slug URL wajib diisi.";
    return "";
  }

  function validateStep2() {
    if (!admin.name.trim()) return "Nama admin wajib diisi.";
    if (!admin.email.trim()) return "Email wajib diisi.";
    if (admin.password.length < 8) return "Password minimal 8 karakter.";
    if (admin.password !== admin.confirm) return "Password tidak cocok.";
    return "";
  }

  async function submit() {
    setError("");
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...school, ...admin }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Pendaftaran gagal.");
      return;
    }
    setStep(3);
  }

  function nextStep() {
    const err = step === 1 ? validateStep1() : validateStep2();
    if (err) { setError(err); return; }
    setError("");
    if (step === 2) { submit(); } else { setStep(step + 1); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="bg-primary rounded-xl p-2.5 shadow-md">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">SchoolHub</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-6 gap-0">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                step === s.id ? "bg-primary text-white" :
                step > s.id ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
              }`}>
                <s.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.id}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-6 mx-1 ${step > s.id ? "bg-green-400" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {/* Step 1 – School Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Informasi Sekolah</h2>
                <p className="text-sm text-muted-foreground">Data dasar sekolah Anda</p>
              </div>

              <div className="space-y-1.5">
                <Label>Nama Sekolah <span className="text-red-500">*</span></Label>
                <Input value={school.name} onChange={(e) => setSchoolField("name", e.target.value)} placeholder="SMA Negeri 1 Timika" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Jenis Sekolah <span className="text-red-500">*</span></Label>
                  <select className="w-full h-10 border rounded-md px-3 text-sm bg-white" value={school.type} onChange={(e) => setSchoolField("type", e.target.value)}>
                    {SCHOOL_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>NPSN</Label>
                  <Input value={school.npsn} onChange={(e) => setSchoolField("npsn", e.target.value)} placeholder="60401234" maxLength={8} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Provinsi</Label>
                  <select className="w-full h-10 border rounded-md px-3 text-sm bg-white" value={school.province} onChange={(e) => setSchoolField("province", e.target.value)}>
                    <option value="">Pilih provinsi</option>
                    {PROVINCES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Kota / Kabupaten <span className="text-red-500">*</span></Label>
                  <Input value={school.city} onChange={(e) => setSchoolField("city", e.target.value)} placeholder="Timika" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Slug URL <span className="text-red-500">*</span></Label>
                <div className="flex items-center border rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-primary/30">
                  <span className="px-3 text-sm text-muted-foreground bg-gray-50 border-r py-2.5 shrink-0">schoolhub.id/</span>
                  <input
                    className="flex-1 px-3 py-2.5 text-sm outline-none bg-white"
                    value={school.slug}
                    onChange={(e) => setSchoolField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="sma-negeri-1-timika"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2 – Admin Account */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Akun Administrator</h2>
                <p className="text-sm text-muted-foreground">Akun untuk mengelola platform</p>
              </div>

              <div className="space-y-1.5">
                <Label>Nama Lengkap <span className="text-red-500">*</span></Label>
                <Input value={admin.name} onChange={(e) => setAdmin({ ...admin, name: e.target.value })} placeholder="Budi Santoso" autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label>Email <span className="text-red-500">*</span></Label>
                <Input type="email" value={admin.email} onChange={(e) => setAdmin({ ...admin, email: e.target.value })} placeholder="admin@sekolah.sch.id" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Password <span className="text-red-500">*</span></Label>
                  <Input type="password" value={admin.password} onChange={(e) => setAdmin({ ...admin, password: e.target.value })} placeholder="min. 8 karakter" />
                </div>
                <div className="space-y-1.5">
                  <Label>Konfirmasi <span className="text-red-500">*</span></Label>
                  <Input type="password" value={admin.confirm} onChange={(e) => setAdmin({ ...admin, confirm: e.target.value })} placeholder="ulangi password" />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
                Ringkasan: <strong>{school.type} {school.name}</strong> di <strong>{school.city}</strong>
              </div>
            </div>
          )}

          {/* Step 3 – Done */}
          {step === 3 && (
            <div className="text-center py-4 space-y-4">
              <div className="flex justify-center">
                <div className="bg-green-100 rounded-full p-4">
                  <PartyPopper className="h-10 w-10 text-green-600" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Pendaftaran Berhasil!</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  <strong>{school.name}</strong> telah terdaftar di SchoolHub.
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-left space-y-1">
                <p><span className="text-muted-foreground">Email:</span> <strong>{admin.email}</strong></p>
                <p><span className="text-muted-foreground">URL Sekolah:</span> <strong>/schoolhub.id/{school.slug}</strong></p>
              </div>
              <Button className="w-full" onClick={() => router.push(`/login?registered=1`)}>
                Masuk Sekarang
              </Button>
            </div>
          )}

          {/* Navigation buttons */}
          {step < 3 && (
            <div className={`flex mt-6 ${step > 1 ? "justify-between" : "justify-end"}`}>
              {step > 1 && (
                <Button variant="outline" onClick={() => { setError(""); setStep(step - 1); }} className="gap-1">
                  <ChevronLeft className="h-4 w-4" /> Kembali
                </Button>
              )}
              <Button onClick={nextStep} disabled={loading} className="gap-1 min-w-28">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Memproses...</> :
                  step === 2 ? "Daftarkan" : <><span>Lanjut</span> <ChevronRight className="h-4 w-4" /></>}
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">Masuk di sini</Link>
        </p>
      </div>
    </div>
  );
}
