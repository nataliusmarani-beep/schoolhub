import EmployeeList from "@/components/modules/hr/EmployeeList";

export default function EmployeesPage() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Data Pegawai</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Kelola data guru dan staf sekolah</p>
      </div>
      <EmployeeList />
    </div>
  );
}
