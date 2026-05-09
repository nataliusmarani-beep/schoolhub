import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, FileText, Newspaper, Image, Settings, ExternalLink } from "lucide-react";
import Link from "next/link";

export default async function WebsitePage() {
  const session = await auth();
  const schoolId = (session?.user as any)?.schoolId;
  const schoolSlug = (session?.user as any)?.schoolSlug;

  const [pages, posts, gallery, publishedPages, publishedPosts] = await Promise.all([
    prisma.websitePage.count({ where: { schoolId } }),
    prisma.websitePost.count({ where: { schoolId } }),
    prisma.websiteGallery.count({ where: { schoolId } }),
    prisma.websitePage.count({ where: { schoolId, isPublished: true } }),
    prisma.websitePost.count({ where: { schoolId, isPublished: true } }),
  ]);

  const sections = [
    {
      label: "Halaman Statis",
      description: "Kelola halaman seperti Profil, Visi-Misi, Kontak",
      href: "/dashboard/website/pages",
      icon: FileText,
      color: "bg-blue-50 text-blue-600",
      stat: `${publishedPages}/${pages} dipublikasi`,
    },
    {
      label: "Berita & Artikel",
      description: "Tulis dan kelola konten berita sekolah",
      href: "/dashboard/website/posts",
      icon: Newspaper,
      color: "bg-violet-50 text-violet-600",
      stat: `${publishedPosts}/${posts} dipublikasi`,
    },
    {
      label: "Galeri Foto",
      description: "Upload dan atur album foto kegiatan",
      href: "/dashboard/website/gallery",
      icon: Image,
      color: "bg-emerald-50 text-emerald-600",
      stat: `${gallery} foto`,
    },
    {
      label: "Pengaturan Website",
      description: "Nama, logo, kontak, dan info sekolah",
      href: "/dashboard/website/settings",
      icon: Settings,
      color: "bg-orange-50 text-orange-600",
      stat: "Identitas sekolah",
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Website Sekolah</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Kelola konten website publik sekolah Anda</p>
        </div>
        {schoolSlug && (
          <a
            href={`/${schoolSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium text-primary border border-primary/30 rounded-lg px-3 py-2 hover:bg-primary/5 transition-colors shrink-0"
          >
            <ExternalLink className="h-4 w-4" />
            Lihat Website
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sections.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className={`${s.color} p-2.5 rounded-xl`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{s.stat}</Badge>
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{s.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="bg-primary/10 rounded-xl p-3">
            <Globe className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm">Website Publik Aktif</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Website sekolah tersedia di{" "}
              <code className="bg-white px-1 py-0.5 rounded text-primary text-xs border">
                /{schoolSlug ?? "school-slug"}
              </code>
              . Konten yang dipublikasi akan langsung tampil.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
