// Re-export Prisma enums and extend with app-specific types
export type { UserRole, SchoolType, AttendanceStatus, GradeType, ItemCondition, DocumentStatus, EmployeeStatus } from "@/generated/prisma";

export interface EnrichedInventoryItem {
  id: string;
  schoolId: string;
  name: string;
  code: string | null;
  categoryId: string | null;
  quantity: number;
  unit: string;
  minThreshold: number;
  condition: string;
  location: string | null;
  description: string | null;
  purchaseDate: Date | null;
  purchasePrice: number | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  status: "ok" | "low_stock" | "out_of_stock";
  category?: { id: string; name: string; icon: string | null } | null;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolId: string;
  schoolSlug: string;
  schoolName: string;
  image?: string | null;
}
