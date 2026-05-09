"use client";

import { useSession } from "next-auth/react";
import { Bell } from "lucide-react";

const roleLabel: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  SCHOOL_ADMIN: "Admin Sekolah",
  PRINCIPAL: "Kepala Sekolah",
  TEACHER: "Guru",
  STAFF: "Staf",
  STUDENT: "Siswa",
  PARENT: "Orang Tua",
};

export default function Topbar({ title }: { title: string }) {
  const { data: session } = useSession();
  const user = session?.user as any;

  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-4 md:px-6 shrink-0">
      <h1 className="font-semibold text-gray-900 text-sm md:text-base">{title}</h1>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
          <Bell className="h-4 w-4 text-gray-600" />
        </button>

        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary">
              {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
            </span>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-xs font-medium text-gray-900 leading-none">{user?.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {roleLabel[user?.role] ?? user?.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
