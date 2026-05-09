import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import PagesClient from "@/components/modules/website/PagesClient";

export default async function WebsitePagesPage() {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;

  const pages = await prisma.websitePage.findMany({
    where: { schoolId },
    orderBy: { updatedAt: "desc" },
  });

  return <PagesClient initialPages={pages as any[]} />;
}
