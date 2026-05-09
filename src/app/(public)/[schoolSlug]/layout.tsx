import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { BookOpen, Menu, Phone, Mail, MapPin } from "lucide-react";

async function getSchool(slug: string) {
  return prisma.school.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, logo: true, address: true, phone: true, email: true, type: true, city: true, province: true },
  });
}

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { schoolSlug: string };
}) {
  const school = await getSchool(params.schoolSlug);
  if (!school) notFound();

  const navLinks = [
    { label: "Beranda", href: `/${school.slug}` },
    { label: "Profil", href: `/${school.slug}/profil` },
    { label: "Berita", href: `/${school.slug}/berita` },
    { label: "Galeri", href: `/${school.slug}/galeri` },
    { label: "Kontak", href: `/${school.slug}/kontak` },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-30 bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href={`/${school.slug}`} className="flex items-center gap-2.5">
            {school.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={school.logo} alt={school.name} className="h-9 w-9 object-contain rounded-lg" />
            ) : (
              <div className="bg-primary rounded-lg p-1.5">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
            )}
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">{school.name}</p>
              {school.city && <p className="text-[11px] text-muted-foreground leading-tight">{school.city}</p>}
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100">
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-10 mt-auto">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                {school.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={school.logo} alt={school.name} className="h-8 w-8 object-contain rounded bg-white p-0.5" />
                ) : (
                  <div className="bg-primary rounded p-1.5">
                    <BookOpen className="h-4 w-4 text-white" />
                  </div>
                )}
                <span className="font-bold text-white">{school.name}</span>
              </div>
              <p className="text-sm text-gray-400">{school.type?.replace(/_/g, " ")} · {school.city}</p>
            </div>

            <div>
              <p className="font-semibold text-white mb-3 text-sm">Navigasi</p>
              <ul className="space-y-1.5">
                {navLinks.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-semibold text-white mb-3 text-sm">Kontak</p>
              <ul className="space-y-2">
                {school.address && (
                  <li className="flex items-start gap-2 text-sm text-gray-400">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{school.address}</span>
                  </li>
                )}
                {school.phone && (
                  <li className="flex items-center gap-2 text-sm text-gray-400">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span>{school.phone}</span>
                  </li>
                )}
                {school.email && (
                  <li className="flex items-center gap-2 text-sm text-gray-400">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span>{school.email}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} {school.name}. Powered by <span className="text-primary font-medium">SchoolHub</span>.
          </div>
        </div>
      </footer>
    </div>
  );
}
