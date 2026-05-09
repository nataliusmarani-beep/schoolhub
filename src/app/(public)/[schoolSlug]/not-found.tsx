import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="text-xl font-bold text-gray-900">Halaman Tidak Ditemukan</h1>
      <p className="text-sm text-muted-foreground max-w-xs">
        Halaman yang Anda cari tidak ada atau sudah dihapus.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors text-sm"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
