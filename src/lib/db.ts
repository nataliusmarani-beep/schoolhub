import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// On Railway: set DATA_DIR to your volume mount path (e.g. /data)
// Locally: falls back to <project>/data/
const DB_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "schoolhub.sqlite");

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ── Schema ────────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS schools (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    address     TEXT,
    phone       TEXT,
    email       TEXT,
    logo_url    TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id   INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    password    TEXT NOT NULL,
    role        TEXT NOT NULL CHECK(role IN ('SUPER_ADMIN','SCHOOL_ADMIN','PRINCIPAL','TEACHER','STAFF','STUDENT','PARENT')),
    avatar_url  TEXT,
    active      INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS academic_years (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id   INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    start_date  TEXT NOT NULL,
    end_date    TEXT NOT NULL,
    is_active   INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS classes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id   INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    grade_level TEXT NOT NULL,
    teacher_id  INTEGER REFERENCES users(id),
    academic_year_id INTEGER REFERENCES academic_years(id),
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS subjects (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id   INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    code        TEXT NOT NULL,
    teacher_id  INTEGER REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS students (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    class_id    INTEGER REFERENCES classes(id),
    nis         TEXT,
    birth_date  TEXT,
    gender      TEXT,
    address     TEXT,
    parent_id   INTEGER REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id  INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id    INTEGER NOT NULL REFERENCES classes(id),
    date        TEXT NOT NULL,
    status      TEXT NOT NULL CHECK(status IN ('PRESENT','ABSENT','LATE','EXCUSED')),
    notes       TEXT,
    created_at  TEXT DEFAULT (datetime('now')),
    UNIQUE(student_id, date)
  );

  CREATE TABLE IF NOT EXISTS grades (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id  INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id  INTEGER NOT NULL REFERENCES subjects(id),
    type        TEXT NOT NULL CHECK(type IN ('DAILY','MID','FINAL')),
    score       REAL NOT NULL,
    max_score   REAL NOT NULL DEFAULT 100,
    semester    INTEGER NOT NULL DEFAULT 1,
    academic_year_id INTEGER REFERENCES academic_years(id),
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS schedule_entries (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id    INTEGER NOT NULL REFERENCES classes(id),
    subject_id  INTEGER NOT NULL REFERENCES subjects(id),
    teacher_id  INTEGER REFERENCES users(id),
    day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 1 AND 7),
    start_time  TEXT NOT NULL,
    end_time    TEXT NOT NULL,
    room        TEXT
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id   INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    author_id   INTEGER REFERENCES users(id),
    title       TEXT NOT NULL,
    body        TEXT NOT NULL,
    audience    TEXT NOT NULL DEFAULT 'ALL',
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS inventory_items (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id       INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    code            TEXT,
    category        TEXT NOT NULL,
    quantity        INTEGER NOT NULL DEFAULT 0,
    unit            TEXT NOT NULL DEFAULT 'pcs',
    min_threshold   INTEGER NOT NULL DEFAULT 5,
    location        TEXT,
    condition       TEXT NOT NULL DEFAULT 'Good' CHECK(condition IN ('Good','Fair','Poor')),
    description     TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS inventory_transactions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id     INTEGER NOT NULL REFERENCES inventory_items(id),
    type        TEXT NOT NULL CHECK(type IN ('IN','OUT','ADJUST')),
    quantity    INTEGER NOT NULL,
    note        TEXT,
    created_by  INTEGER REFERENCES users(id),
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leave_requests (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    type        TEXT NOT NULL,
    start_date  TEXT NOT NULL,
    end_date    TEXT NOT NULL,
    reason      TEXT,
    status      TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED')),
    reviewed_by INTEGER REFERENCES users(id),
    created_at  TEXT DEFAULT (datetime('now'))
  );
`);

export default db;
