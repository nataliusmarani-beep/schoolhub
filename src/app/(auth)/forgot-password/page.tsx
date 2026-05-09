import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4">
      <div className="w-full max-w-[400px]">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary rounded-xl p-3 mb-3 shadow-md">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">SchoolHub</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Lupa Password</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Masukkan email Anda dan kami akan mengirimkan instruksi reset password.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" placeholder="nama@sekolah.sch.id" />
          </div>
          <Button className="w-full">Kirim Instruksi</Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">← Kembali ke halaman masuk</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
