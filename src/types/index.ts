export type Role =
  | "SUPER_ADMIN"
  | "SCHOOL_ADMIN"
  | "PRINCIPAL"
  | "TEACHER"
  | "STAFF"
  | "STUDENT"
  | "PARENT";

export interface School {
  id: number;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  created_at: string;
}

export interface User {
  id: number;
  school_id: number;
  name: string;
  email: string;
  role: Role;
  avatar_url?: string;
  active: boolean;
  created_at: string;
}

export interface Student {
  id: number;
  user_id: number;
  class_id?: number;
  nis?: string;
  birth_date?: string;
  gender?: string;
  address?: string;
  parent_id?: number;
  name: string;
  email: string;
}

export interface InventoryItem {
  id: number;
  school_id: number;
  name: string;
  code?: string;
  category: string;
  quantity: number;
  unit: string;
  min_threshold: number;
  location?: string;
  condition: "Good" | "Fair" | "Poor";
  description?: string;
  created_at: string;
  updated_at: string;
  status?: "ok" | "low_stock" | "out_of_stock";
}

export interface AttendanceRecord {
  id: number;
  student_id: number;
  class_id: number;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  notes?: string;
}

export interface Grade {
  id: number;
  student_id: number;
  subject_id: number;
  type: "DAILY" | "MID" | "FINAL";
  score: number;
  max_score: number;
  semester: number;
}

export interface Announcement {
  id: number;
  school_id: number;
  author_id: number;
  title: string;
  body: string;
  audience: string;
  created_at: string;
}
