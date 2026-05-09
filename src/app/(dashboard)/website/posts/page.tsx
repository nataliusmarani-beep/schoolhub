import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import PostsClient from "@/components/modules/website/PostsClient";

export default async function WebsitePostsPage() {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;

  const posts = await prisma.websitePost.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
  });

  return <PostsClient initialPosts={posts as any[]} />;
}
