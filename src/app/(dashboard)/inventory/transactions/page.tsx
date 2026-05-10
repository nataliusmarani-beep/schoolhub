import InventoryTransactions from "@/components/modules/inventory/InventoryTransactions";

export default function TransactionsPage() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Transaksi Inventaris</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Log masuk, keluar, rusak, dan perbaikan barang</p>
      </div>
      <InventoryTransactions />
    </div>
  );
}
