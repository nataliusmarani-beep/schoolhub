import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import InventoryClient from "@/components/modules/inventory/InventoryClient";

export default async function InventoryPage() {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;

  const [items, categories] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: { schoolId },
      include: { category: true },
      orderBy: { name: "asc" },
    }),
    prisma.inventoryCategory.findMany({
      where: { schoolId },
      orderBy: { name: "asc" },
    }),
  ]);

  const enriched = items.map((item) => ({
    ...item,
    status: (
      item.quantity === 0
        ? "out_of_stock"
        : item.quantity <= item.minThreshold
        ? "low_stock"
        : "ok"
    ) as "ok" | "low_stock" | "out_of_stock",
  }));

  return (
    <div className="p-4 md:p-6">
      <InventoryClient initialItems={enriched} categories={categories} schoolId={schoolId} />
    </div>
  );
}
