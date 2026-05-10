import DeviceList from "@/components/modules/ict/DeviceList";

export default function DevicesPage() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Perangkat ICT</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Kelola inventaris perangkat teknologi sekolah</p>
      </div>
      <DeviceList />
    </div>
  );
}
