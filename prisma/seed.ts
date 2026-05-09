import { PrismaClient, SchoolType, UserRole, SemesterType } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding SchoolHub...");

  // ── School ──────────────────────────────────────────────────────────────────
  const school = await prisma.school.upsert({
    where: { slug: "ypj-kk" },
    update: {},
    create: {
      name: "YPJ Kuala Kencana",
      slug: "ypj-kk",
      npsn: "60401234",
      type: SchoolType.SMA,
      address: "Jl. YPJ No. 1, Kuala Kencana",
      province: "Papua",
      city: "Mimika",
      phone: "+62 901 234567",
      email: "info@ypjkk.sch.id",
      website: "https://ypjkk.sch.id",
    },
  });
  console.log(`✅ School: ${school.name}`);

  // ── Users ────────────────────────────────────────────────────────────────────
  const hash = await bcrypt.hash("admin123", 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@schoolhub.id" },
    update: {},
    create: {
      schoolId: school.id,
      name: "Super Admin",
      email: "admin@schoolhub.id",
      password: hash,
      role: UserRole.SUPER_ADMIN,
    },
  });

  const principal = await prisma.user.upsert({
    where: { email: "principal@ypjkk.sch.id" },
    update: {},
    create: {
      schoolId: school.id,
      name: "Drs. Budi Santoso, M.Pd",
      email: "principal@ypjkk.sch.id",
      password: hash,
      role: UserRole.PRINCIPAL,
    },
  });

  const teacherUser1 = await prisma.user.upsert({
    where: { email: "teacher1@ypjkk.sch.id" },
    update: {},
    create: {
      schoolId: school.id,
      name: "Siti Rahma, S.Pd",
      email: "teacher1@ypjkk.sch.id",
      password: hash,
      role: UserRole.TEACHER,
    },
  });

  const teacherUser2 = await prisma.user.upsert({
    where: { email: "teacher2@ypjkk.sch.id" },
    update: {},
    create: {
      schoolId: school.id,
      name: "Ahmad Fauzi, S.Pd",
      email: "teacher2@ypjkk.sch.id",
      password: hash,
      role: UserRole.TEACHER,
    },
  });

  const parentUser = await prisma.user.upsert({
    where: { email: "parent@ypjkk.sch.id" },
    update: {},
    create: {
      schoolId: school.id,
      name: "Bapak Hendra",
      email: "parent@ypjkk.sch.id",
      password: hash,
      role: UserRole.PARENT,
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: "student1@ypjkk.sch.id" },
    update: {},
    create: {
      schoolId: school.id,
      name: "Andi Pratama",
      email: "student1@ypjkk.sch.id",
      password: hash,
      role: UserRole.STUDENT,
    },
  });
  console.log("✅ Users created");

  // ── Teacher profiles ─────────────────────────────────────────────────────────
  const teacher1 = await prisma.teacher.upsert({
    where: { userId: teacherUser1.id },
    update: {},
    create: {
      userId: teacherUser1.id,
      nip: "198501012010011001",
      specialization: "Matematika",
      education: "S1 Pendidikan Matematika",
      joinDate: new Date("2010-01-01"),
    },
  });

  const teacher2 = await prisma.teacher.upsert({
    where: { userId: teacherUser2.id },
    update: {},
    create: {
      userId: teacherUser2.id,
      nip: "198701012012011002",
      specialization: "Bahasa Indonesia",
      education: "S1 Pendidikan Bahasa Indonesia",
      joinDate: new Date("2012-01-01"),
    },
  });
  console.log("✅ Teacher profiles created");

  // ── Academic Year ─────────────────────────────────────────────────────────────
  const academicYear = await prisma.academicYear.upsert({
    where: { schoolId_name: { schoolId: school.id, name: "2024/2025" } },
    update: {},
    create: {
      schoolId: school.id,
      name: "2024/2025",
      startDate: new Date("2024-07-15"),
      endDate: new Date("2025-06-30"),
      isActive: true,
    },
  });

  const semesterGanjil = await prisma.semester.upsert({
    where: { academicYearId_type: { academicYearId: academicYear.id, type: SemesterType.GANJIL } },
    update: {},
    create: {
      academicYearId: academicYear.id,
      type: SemesterType.GANJIL,
      startDate: new Date("2024-07-15"),
      endDate: new Date("2024-12-20"),
      isActive: true,
    },
  });

  const semesterGenap = await prisma.semester.upsert({
    where: { academicYearId_type: { academicYearId: academicYear.id, type: SemesterType.GENAP } },
    update: {},
    create: {
      academicYearId: academicYear.id,
      type: SemesterType.GENAP,
      startDate: new Date("2025-01-06"),
      endDate: new Date("2025-06-30"),
      isActive: false,
    },
  });
  console.log("✅ Academic year + semesters created");

  // ── Grade Levels ──────────────────────────────────────────────────────────────
  const gradeLevel10 = await prisma.gradeLevel.upsert({
    where: { schoolId_level: { schoolId: school.id, level: 10 } },
    update: {},
    create: { schoolId: school.id, level: 10, name: "Kelas 10" },
  });

  const gradeLevel11 = await prisma.gradeLevel.upsert({
    where: { schoolId_level: { schoolId: school.id, level: 11 } },
    update: {},
    create: { schoolId: school.id, level: 11, name: "Kelas 11" },
  });

  const gradeLevel12 = await prisma.gradeLevel.upsert({
    where: { schoolId_level: { schoolId: school.id, level: 12 } },
    update: {},
    create: { schoolId: school.id, level: 12, name: "Kelas 12" },
  });
  console.log("✅ Grade levels created");

  // ── Classrooms ────────────────────────────────────────────────────────────────
  const classroom10A = await prisma.classroom.upsert({
    where: { academicYearId_name: { academicYearId: academicYear.id, name: "10A" } },
    update: {},
    create: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      gradeLevelId: gradeLevel10.id,
      name: "10A",
      homeroomTeacherId: teacher1.id,
      capacity: 32,
      room: "Ruang 101",
    },
  });

  const classroom10B = await prisma.classroom.upsert({
    where: { academicYearId_name: { academicYearId: academicYear.id, name: "10B" } },
    update: {},
    create: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      gradeLevelId: gradeLevel10.id,
      name: "10B",
      homeroomTeacherId: teacher2.id,
      capacity: 30,
      room: "Ruang 102",
    },
  });

  const classroom11A = await prisma.classroom.upsert({
    where: { academicYearId_name: { academicYearId: academicYear.id, name: "11A" } },
    update: {},
    create: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      gradeLevelId: gradeLevel11.id,
      name: "11A",
      capacity: 30,
      room: "Ruang 201",
    },
  });
  console.log("✅ Classrooms created");

  // ── Student profile ───────────────────────────────────────────────────────────
  await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      nis: "2024001",
      nisn: "0012345678",
      classroomId: classroom10A.id,
      parentId: parentUser.id,
      birthDate: new Date("2008-05-10"),
      birthPlace: "Timika",
      gender: "L",
      religion: "Kristen",
      entryYear: 2024,
    },
  });
  console.log("✅ Student profile created");

  // ── Subjects ──────────────────────────────────────────────────────────────────
  const subjects = [
    { name: "Matematika", code: "MTK" },
    { name: "Bahasa Indonesia", code: "BIND" },
    { name: "Bahasa Inggris", code: "BING" },
    { name: "Fisika", code: "FIS" },
    { name: "Kimia", code: "KIM" },
    { name: "Biologi", code: "BIO" },
    { name: "Sejarah Indonesia", code: "SEJ" },
    { name: "Pendidikan Agama", code: "PAI" },
    { name: "Pendidikan Jasmani", code: "PJOK" },
    { name: "Informatika", code: "INF" },
  ];

  for (const s of subjects) {
    await prisma.subject.upsert({
      where: { schoolId_code: { schoolId: school.id, code: s.code } },
      update: {},
      create: { schoolId: school.id, ...s },
    });
  }
  console.log("✅ Subjects created");

  // ── Inventory categories ──────────────────────────────────────────────────────
  const invCategories = [
    "Alat Tulis Kantor", "Kebersihan", "Alat Pembelajaran",
    "Bahan Habis Pakai", "Furnitur", "Elektronik", "Olahraga", "Kesehatan",
  ];

  for (const name of invCategories) {
    await prisma.inventoryCategory.upsert({
      where: { schoolId_name: { schoolId: school.id, name } },
      update: {},
      create: { schoolId: school.id, name },
    });
  }
  console.log("✅ Inventory categories created");

  // ── Sample announcement ───────────────────────────────────────────────────────
  const existingAnn = await prisma.announcement.findFirst({
    where: { schoolId: school.id, title: "Selamat Datang di SchoolHub" },
  });
  if (!existingAnn) {
    await prisma.announcement.create({
      data: {
        schoolId: school.id,
        authorId: superAdmin.id,
        title: "Selamat Datang di SchoolHub",
        body: "Platform manajemen sekolah terpadu kini telah aktif. Silakan eksplorasi fitur-fitur yang tersedia.",
        audience: "ALL",
        isPinned: true,
      },
    });
  }
  console.log("✅ Sample announcement created");

  console.log("\n🎉 Seeding complete!");
  console.log("─────────────────────────────────");
  console.log("Login credentials (password: admin123):");
  console.log("  Super Admin : admin@schoolhub.id");
  console.log("  Principal   : principal@ypjkk.sch.id");
  console.log("  Teacher     : teacher1@ypjkk.sch.id");
  console.log("  Student     : student1@ypjkk.sch.id");
  console.log("  Parent      : parent@ypjkk.sch.id");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
