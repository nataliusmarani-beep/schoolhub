import Payroll from "@/components/modules/hr/Payroll";

export default function PayrollPage() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Penggajian</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Kelola penggajian bulanan dan cetak slip gaji</p>
      </div>
      <Payroll />
    </div>
  );
}
