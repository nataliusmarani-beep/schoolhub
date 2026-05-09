import db from "./db";
import bcrypt from "bcryptjs";

export async function seedIfEmpty() {
  const count = (db.prepare("SELECT COUNT(*) as n FROM schools").get() as { n: number }).n;
  if (count > 0) return;

  const hash = await bcrypt.hash("admin123", 10);

  const schoolId = (db.prepare(`
    INSERT INTO schools (name, slug, address, phone, email)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    "YPJ KK School",
    "ypj-kk",
    "Jl. YPJ No. 1, Kuala Kencana, Papua",
    "+62 901 234567",
    "info@ypjkk.sch.id"
  )).lastInsertRowid;

  db.prepare(`
    INSERT INTO users (school_id, name, email, password, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(schoolId, "Super Admin", "admin@schoolhub.id", hash, "SUPER_ADMIN");

  db.prepare(`
    INSERT INTO users (school_id, name, email, password, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(schoolId, "Kepala Sekolah", "principal@ypjkk.sch.id", hash, "PRINCIPAL");
}
