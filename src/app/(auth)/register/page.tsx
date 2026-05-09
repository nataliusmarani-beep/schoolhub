"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    schoolName: "",
    schoolSlug: "",
    adminName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  function set(field: string, value: string) {
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (field === "schoolName" && !f.schoolSlug) {
        next.schoolSlug = value
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-");
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Password tidak cocok.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Pendaftaran gagal.");
      return;
    }

    router.push("/login?registered=1");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-xl p-2">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">SchoolHub</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Daftarkan Sekolah Anda</CardTitle>
            <CardDescription>
              Buat akun admin untuk sekolah Anda
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label>Nama Sekolah</Label>
                <Input
                  placeholder="SMA Negeri 1 Timika"
                  value={form.schoolName}
                  onChange={(e) => set("schoolName", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Slug URL Sekolah</Label>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">schoolhub.id/</span>
                  <Input
                    placeholder="sma-negeri-1-timika"
                    value={form.schoolSlug}
                    onChange={(e) => set("schoolSlug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nama Admin</Label>
                <Input
                  placeholder="John Doe"
                  value={form.adminName}
                  onChange={(e) => set("adminName", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Email Admin</Label>
                <Input
                  type="email"
                  placeholder="admin@sekolah.sch.id"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    placeholder="min. 8 karakter"
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Konfirmasi</Label>
                  <Input
                    type="password"
                    placeholder="ulangi password"
                    value={form.confirmPassword}
                    onChange={(e) => set("confirmPassword", e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mendaftar...
                  </>
                ) : (
                  "Daftarkan Sekolah"
                )}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Sudah punya akun?{" "}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Masuk di sini
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
