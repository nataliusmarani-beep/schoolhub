import { auth } from "@/lib/auth";
import db from "@/lib/db";
import Topbar from "@/components/shared/Topbar";
import InventoryClient from "@/components/modules/inventory/InventoryClient";
import type { InventoryItem } from "@/types";

export default async function InventoryPage() {
  const session = await auth();
  const user = session?.user as any;
  const schoolId = Number(user?.schoolId);

  const items = db.prepare(`
    WITH enriched AS (
      SELECT *,
        CASE
          WHEN quantity = 0 THEN 'out_of_stock'
          WHEN quantity <= min_threshold THEN 'low_stock'
          ELSE 'ok'
        END AS status
      FROM inventory_items
      WHERE school_id = ?
    )
    SELECT * FROM enriched ORDER BY name
  `).all(schoolId) as InventoryItem[];

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title="Inventaris" />
      <InventoryClient initialItems={items} schoolId={schoolId} />
    </div>
  );
}
