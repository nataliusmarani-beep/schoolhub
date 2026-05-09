import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Newspaper, Calendar, Tag } from "lucide-react";

export default async function BeritaPage({ params }: { params: { schoolSlug: string } }) {
  const school = await prisma.school.findUnique({
    where: { slug: params.schoolSlug },
    select: { id: true, name: true, slug: true },
  });
  if (!school) notFound();

  const posts = await prisma.websitePost.findMany({
    where: { schoolId: school.id, isPublished: true },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Berita & Artikel</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Informasi dan kegiatan terkini dari {school.name}
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Newspaper className="h-12 w-12 opacity-20" />
          <p className="font-medium text-gray-700">Belum ada artikel</p>
          <p className="text-sm">Artikel akan tampil di sini setelah dipublikasi.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map((post) => (
            <article key={post.id} className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col bg-white">
              {post.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.coverImage} alt={post.title} className="w-full h-44 object-cover" />
              ) : (
                <div className="w-full h-44 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <Newspaper className="h-8 w-8 text-primary/30" />
                </div>
              )}
              <div className="p-4 flex flex-col flex-1">
                <h2 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-snug mb-2">{post.title}</h2>
                {post.excerpt && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{post.excerpt}</p>
                )}
                <div className="mt-auto space-y-1.5">
                  {post.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Tag className="h-3 w-3 text-muted-foreground" />
                      {post.tags.map((t) => (
                        <span key={t} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                      : "-"}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
