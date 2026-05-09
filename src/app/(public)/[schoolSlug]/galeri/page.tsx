import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Image as ImageIcon } from "lucide-react";

export default async function GaleriPage({ params }: { params: { schoolSlug: string } }) {
  const school = await prisma.school.findUnique({
    where: { slug: params.schoolSlug },
    select: { id: true, name: true, slug: true },
  });
  if (!school) notFound();

  const items = await prisma.websiteGallery.findMany({
    where: { schoolId: school.id },
    orderBy: [{ albumName: "asc" }, { sortOrder: "asc" }],
  });

  // Group by album
  const albums: Record<string, typeof items> = {};
  for (const item of items) {
    if (!albums[item.albumName]) albums[item.albumName] = [];
    albums[item.albumName].push(item);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Galeri Kegiatan</h1>
        <p className="text-muted-foreground text-sm mt-1">Dokumentasi kegiatan dan momen terbaik {school.name}</p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <ImageIcon className="h-12 w-12 opacity-20" />
          <p className="font-medium text-gray-700">Belum ada foto</p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(albums).map(([albumName, albumItems]) => (
            <section key={albumName}>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="h-1 w-5 bg-primary rounded-full inline-block" />
                {albumName}
                <span className="text-sm font-normal text-muted-foreground">({albumItems.length} foto)</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {albumItems.map((item) => (
                  <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.caption ?? albumName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {item.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                        <p className="text-white text-xs line-clamp-2">{item.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
