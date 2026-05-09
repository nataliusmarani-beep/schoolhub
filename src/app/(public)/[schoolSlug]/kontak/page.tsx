import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { MapPin, Phone, Mail, Globe, Clock } from "lucide-react";

export default async function KontakPage({ params }: { params: { schoolSlug: string } }) {
  const school = await prisma.school.findUnique({
    where: { slug: params.schoolSlug },
    select: {
      id: true, name: true, slug: true, address: true,
      phone: true, email: true, website: true, city: true, province: true,
    },
  });
  if (!school) notFound();

  const kontakPage = await prisma.websitePage.findFirst({
    where: { schoolId: school.id, isPublished: true, slug: { in: ["kontak", "contact"] } },
  });

  const contactItems = [
    { icon: MapPin, label: "Alamat", value: school.address, href: school.address ? `https://maps.google.com/?q=${encodeURIComponent(school.address)}` : null },
    { icon: Phone, label: "Telepon", value: school.phone, href: school.phone ? `tel:${school.phone}` : null },
    { icon: Mail, label: "Email", value: school.email, href: school.email ? `mailto:${school.email}` : null },
    { icon: Globe, label: "Website", value: school.website, href: school.website },
  ].filter((i) => i.value);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Hubungi Kami</h1>
        <p className="text-muted-foreground text-sm mt-1">Informasi kontak {school.name}</p>
      </div>

      {kontakPage && (
        <div
          className="prose prose-sm max-w-none text-gray-700 mb-8"
          dangerouslySetInnerHTML={{ __html: kontakPage.content }}
        />
      )}

      {/* Contact cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {contactItems.map((item) => (
          <div key={item.label} className="border rounded-xl p-5 flex gap-4 hover:border-primary/30 hover:bg-primary/5 transition-colors">
            <div className="bg-primary/10 rounded-xl p-3 shrink-0">
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1">{item.label}</p>
              {item.href ? (
                <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-900 hover:text-primary transition-colors break-words">
                  {item.value}
                </a>
              ) : (
                <p className="text-sm text-gray-900 break-words">{item.value}</p>
              )}
            </div>
          </div>
        ))}

        <div className="border rounded-xl p-5 flex gap-4">
          <div className="bg-primary/10 rounded-xl p-3 shrink-0">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Jam Operasional</p>
            <p className="text-sm text-gray-900">Senin – Jumat</p>
            <p className="text-sm text-gray-900">07.00 – 15.00 WIB</p>
          </div>
        </div>
      </div>

      {/* Google Maps embed placeholder */}
      {school.address && (
        <div className="border rounded-xl overflow-hidden">
          <iframe
            title="Lokasi Sekolah"
            src={`https://maps.google.com/maps?q=${encodeURIComponent(school.address + (school.city ? ", " + school.city : ""))}&output=embed`}
            className="w-full h-64"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}
