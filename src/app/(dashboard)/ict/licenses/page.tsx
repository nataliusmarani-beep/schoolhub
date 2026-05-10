import LicenseList from "@/components/modules/ict/LicenseList";

export default function LicensesPage() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Lisensi Software</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Kelola lisensi software dan notifikasi kadaluarsa</p>
      </div>
      <LicenseList />
    </div>
  );
}
