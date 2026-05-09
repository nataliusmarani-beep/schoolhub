export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/shared/Sidebar";
import SessionProvider from "@/components/shared/SessionProvider";
import type { UserRole } from "@/generated/prisma";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user as any;

  return (
    <SessionProvider session={session}>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar role={user.role as UserRole} schoolName={user.schoolName ?? "SchoolHub"} />
        <div className="flex flex-col flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </SessionProvider>
  );
}
