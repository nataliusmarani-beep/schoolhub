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

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const schoolId = Number((session.user as any).schoolId);

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";

  const items = db.prepare(`
    SELECT * FROM inventory_items
    WHERE school_id = ?
      AND (? = '' OR name LIKE ? OR code LIKE ?)
      AND (? = '' OR category = ?)
    ORDER BY name
  `).all(schoolId, search, `%${search}%`, `%${search}%`, category, category);

  return NextResponse.json(items.map(enrich));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const schoolId = Number((session.user as any).schoolId);

  const body = await req.json();
  const { name, code, category, quantity, unit, min_threshold, location, condition, description } = body;

  const result = db.prepare(`
    INSERT INTO inventory_items (school_id, name, code, category, quantity, unit, min_threshold, location, condition, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(schoolId, name, code || null, category, quantity, unit, min_threshold, location || null, condition, description || null);

  const item = db.prepare("SELECT * FROM inventory_items WHERE id = ?").get(result.lastInsertRowid);
  return NextResponse.json(enrich(item), { status: 201 });
}
