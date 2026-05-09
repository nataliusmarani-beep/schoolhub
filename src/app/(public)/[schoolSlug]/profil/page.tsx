import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { School } from "lucide-react";

export default async function ProfilPage({ params }: { params: { schoolSlug: string } }) {
  const school = await prisma.school.findUnique({
    where: { slug: params.schoolSlug },
    select: { id: true, name: true, slug: true, logo: true, type: true, city: true, province: true, address: true, phone: true, email: true, npsn: true },
  });
  if (!school) notFound();

  const profilPage = await prisma.websitePage.findFirst({
    where: { schoolId: school.id, isPublished: true, slug: { in: ["profil", "profil-sekolah", "about"] } },
  });

  const otherPages = await prisma.websitePage.findMany({
    where: { schoolId: school.id, isPublished: true },
    orderBy: { title: "asc" },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* School header */}
      <div className="flex items-center gap-4 mb-8">
        {school.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={school.logo} alt={school.name} className="h-16 w-16 object-contain rounded-xl border bg-white p-1 shadow-sm" />
        ) : (
          <div className="bg-primary/10 rounded-xl p-3.5">
            <School className="h-8 w-8 text-primary" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{school.name}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {school.type?.replace(/_/g, " ")}
            {school.city ? ` · ${school.city}` : ""}
            {school.province ? `, ${school.province}` : ""}
          </p>
        </div>
      </div>

      {profilPage ? (
        <div
          className="prose prose-sm max-w-none text-gray-700"
          dangerouslySetInnerHTML={{ __html: profilPage.content }}
        />
      ) : (
        <>
          <div className="prose prose-sm max-w-none text-gray-700">
            <h2>Profil Sekolah</h2>
            <p>
              {school.name} adalah lembaga pendidikan yang berkomitmen memberikan layanan pendidikan berkualitas
              bagi masyarakat.
            </p>
          </div>

          {/* Info table */}
          <div className="mt-8 border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {[
                  { label: "Nama Sekolah", value: school.name },
                  { label: "Jenis", value: school.type?.replace(/_/g, " ") },
                  { label: "NPSN", value: school.npsn ?? "-" },
                  { label: "Kota/Kabupaten", value: school.city ?? "-" },
                  { label: "Provinsi", value: school.province ?? "-" },
                  { label: "Alamat", value: school.address ?? "-" },
                  { label: "Telepon", value: school.phone ?? "-" },
                  { label: "Email", value: school.email ?? "-" },
                ].map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="px-4 py-3 font-medium text-gray-600 w-40 shrink-0">{row.label}</td>
                    <td className="px-4 py-3 text-gray-900">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Other static pages */}
      {otherPages.filter((p) => !["profil", "profil-sekolah", "about"].includes(p.slug)).length > 0 && (
        <div className="mt-10 space-y-8">
          {otherPages
            .filter((p) => !["profil", "profil-sekolah", "about"].includes(p.slug))
            .map((page) => (
              <section key={page.id}>
                <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">{page.title}</h2>
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: page.content }}
                />
              </section>
            ))}
        </div>
      )}
    </div>
  );
}
