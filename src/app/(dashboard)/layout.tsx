export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { seedIfEmpty } from "@/lib/seed";
import Sidebar from "@/components/shared/Sidebar";
import SessionProvider from "@/components/shared/SessionProvider";
import type { Role } from "@/types";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await seedIfEmpty();

  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user as any;

  return (
    <SessionProvider session={session}>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar role={user.role as Role} schoolName={user.schoolName ?? "SchoolHub"} />
        <div className="flex flex-col flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </SessionProvider>
  );
}
