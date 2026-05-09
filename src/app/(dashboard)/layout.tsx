export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SessionProvider from "@/components/shared/SessionProvider";
import DashboardShell from "@/components/shared/DashboardShell";
import type { UserRole } from "@/generated/prisma";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user as any;

  return (
    <SessionProvider session={session}>
      <DashboardShell role={user.role as UserRole} schoolName={user.schoolName ?? "SchoolHub"}>
        {children}
      </DashboardShell>
    </SessionProvider>
  );
}
