"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<{ name: string; logo?: string } | null>(null);
  const registered = params.get("registered") === "1";

  useEffect(() => {
    const slug = params.get("school");
    if (!slug) return;
    fetch(`/api/school/${slug}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setSchoolInfo({ name: d.name, logo: d.logo }))
      .catch(() => {});
  }, [params]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Email atau password salah. Silakan coba lagi.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4">
      <div className="w-full max-w-[400px]">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          {schoolInfo?.logo ? (
            <Image src={schoolInfo.logo} alt={schoolInfo.name} width={64} height={64} className="rounded-xl mb-3 object-contain" />
          ) : (
            <div className="bg-primary rounded-xl p-3 mb-3 shadow-md">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
          )}
          <h1 className="text-xl font-bold text-gray-900">
            {schoolInfo?.name ?? "SchoolHub"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Platform Manajemen Sekolah
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Masuk ke Akun</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Masukkan email dan password Anda
          </p>

          {registered && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Pendaftaran berhasil! Silakan masuk.
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@sekolah.sch.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                  Lupa password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-10" disabled={loading}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat...</>
              ) : "Masuk"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-5">
            Sekolah belum terdaftar?{" "}
            <Link href="/register" className="text-primary font-medium hover:underline">
              Daftarkan sekarang
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} SchoolHub · Semua hak dilindungi
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
