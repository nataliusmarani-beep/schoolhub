import LeaveManagement from "@/components/modules/hr/LeaveManagement";

export default function LeavePage() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Cuti & Izin</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Kelola pengajuan cuti dan izin pegawai</p>
      </div>
      <LeaveManagement />
    </div>
  );
}
