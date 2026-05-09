import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";

export async function POST(req: Request) {
  const { schoolName, schoolSlug, adminName, email, password } = await req.json();

  if (!schoolName || !schoolSlug || !adminName || !email || !password) {
    return NextResponse.json({ error: "Semua field wajib diisi." }, { status: 400 });
  }

  const existing = db.prepare("SELECT id FROM schools WHERE slug = ?").get(schoolSlug);
  if (existing) {
    return NextResponse.json({ error: "Slug sudah digunakan." }, { status: 409 });
  }

  const emailExists = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (emailExists) {
    return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
  }

  const hash = await bcrypt.hash(password, 10);

  const schoolId = db.prepare(
    "INSERT INTO schools (name, slug) VALUES (?, ?)"
  ).run(schoolName, schoolSlug).lastInsertRowid;

  db.prepare(
    "INSERT INTO users (school_id, name, email, password, role) VALUES (?, ?, ?, ?, 'SCHOOL_ADMIN')"
  ).run(schoolId, adminName, email, hash);

  return NextResponse.json({ ok: true });
}
