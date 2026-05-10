import HrAttendance from "@/components/modules/hr/HrAttendance";

export default function HrAttendancePage() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Kehadiran Pegawai</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Input dan rekap kehadiran harian staf</p>
      </div>
      <HrAttendance />
    </div>
  );
}
