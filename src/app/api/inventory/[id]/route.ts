import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import db from "@/lib/db";

function enrich(item: any) {
  return {
    ...item,
    status:
      item.quantity === 0
        ? "out_of_stock"
        : item.quantity <= item.min_threshold
        ? "low_stock"
        : "ok",
  };
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, code, category, quantity, unit, min_threshold, location, condition, description } = body;

  db.prepare(`
    UPDATE inventory_items SET
      name = ?, code = ?, category = ?, quantity = ?, unit = ?,
      min_threshold = ?, location = ?, condition = ?, description = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(name, code || null, category, quantity, unit, min_threshold, location || null, condition, description || null, params.id);

  const item = db.prepare("SELECT * FROM inventory_items WHERE id = ?").get(params.id);
  return NextResponse.json(enrich(item));
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  db.prepare("DELETE FROM inventory_items WHERE id = ?").run(params.id);
  return NextResponse.json({ ok: true });
}
