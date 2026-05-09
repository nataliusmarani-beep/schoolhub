import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import GalleryClient from "@/components/modules/website/GalleryClient";

export default async function WebsiteGalleryPage() {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;

  const items = await prisma.websiteGallery.findMany({
    where: { schoolId },
    orderBy: [{ albumName: "asc" }, { sortOrder: "asc" }],
  });

  return <GalleryClient initialItems={items as any[]} />;
}
