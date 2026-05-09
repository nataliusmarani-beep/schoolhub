import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowRight, Newspaper, Phone } from "lucide-react";

export async function generateMetadata({ params }: { params: { schoolSlug: string } }) {
  const school = await prisma.school.findUnique({ where: { slug: params.schoolSlug }, select: { name: true } });
  return { title: school?.name ?? "Website Sekolah" };
}

export default async function PublicHome({ params }: { params: { schoolSlug: string } }) {
  const school = await prisma.school.findUnique({
    where: { slug: params.schoolSlug },
    select: { id: true, name: true, slug: true, logo: true, address: true, phone: true, email: true, type: true, city: true, province: true },
  });
  if (!school) notFound();

  const [latestPosts, galleryPreview] = await Promise.all([
    prisma.websitePost.findMany({
      where: { schoolId: school.id, isPublished: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
    prisma.websiteGallery.findMany({
      where: { schoolId: school.id },
      take: 6,
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {school.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={school.logo} alt={school.name} className="h-20 w-20 object-contain mx-auto mb-6 rounded-2xl border bg-white p-1 shadow-sm" />
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{school.name}</h1>
          <p className="text-lg text-muted-foreground">
            {school.type?.replace(/_/g, " ")}
            {school.city ? ` · ${school.city}` : ""}
            {school.province ? `, ${school.province}` : ""}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <Link
              href={`/${school.slug}/profil`}
              className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors text-sm"
            >
              Profil Sekolah <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/${school.slug}/kontak`}
              className="inline-flex items-center gap-2 bg-white text-primary border border-primary/30 px-5 py-2.5 rounded-xl font-medium hover:bg-primary/5 transition-colors text-sm"
            >
              Hubungi Kami
            </Link>
          </div>
        </div>
      </section>

      {/* Latest News */}
      {latestPosts.length > 0 && (
        <section className="py-14 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Berita Terbaru</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Informasi dan kegiatan terkini</p>
              </div>
              <Link
                href={`/${school.slug}/berita`}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                Lihat semua <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {latestPosts.map((post) => (
                <Link key={post.id} href={`/${school.slug}/berita`} className="group">
                  <div className="rounded-xl overflow-hidden border hover:shadow-md transition-shadow h-full flex flex-col">
                    {post.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.coverImage} alt={post.title} className="w-full h-44 object-cover" />
                    ) : (
                      <div className="w-full h-44 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <Newspaper className="h-8 w-8 text-primary/30" />
                      </div>
                    )}
                    <div className="p-4 flex-1">
                      <p className="font-semibold text-gray-900 group-hover:text-primary transition-colors text-sm line-clamp-2">{post.title}</p>
                      {post.excerpt && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{post.excerpt}</p>}
                      <p className="text-[11px] text-muted-foreground mt-3">
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : ""}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery preview */}
      {galleryPreview.length > 0 && (
        <section className="py-14 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Galeri Kegiatan</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Dokumentasi kegiatan sekolah</p>
              </div>
              <Link href={`/${school.slug}/galeri`} className="text-sm text-primary hover:underline flex items-center gap-1">
                Lihat semua <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {galleryPreview.map((g) => (
                <div key={g.id} className="aspect-video rounded-xl overflow-hidden bg-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.imageUrl} alt={g.caption ?? g.albumName} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact CTA */}
      <section className="py-14 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-primary/10 rounded-2xl p-8">
            <Phone className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Hubungi Kami</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Punya pertanyaan atau ingin mengetahui lebih lanjut? Jangan ragu menghubungi kami.
            </p>
            <Link
              href={`/${school.slug}/kontak`}
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors text-sm"
            >
              Lihat Kontak <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
