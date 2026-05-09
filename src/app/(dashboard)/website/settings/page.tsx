import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import WebsiteSettingsClient from "@/components/modules/website/WebsiteSettingsClient";

export default async function WebsiteSettingsPage() {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { name: true, slug: true, logo: true, address: true, phone: true, email: true, website: true, city: true, province: true, type: true },
  });

  if (!school) return null;
  return <WebsiteSettingsClient info={school as any} />;
}
