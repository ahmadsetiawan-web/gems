import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";

export default async function AdminAlatOrganikPage() {
  const supabase = await createClient();

  const { data: alat } = await supabase
    .from("alat_organik")
    .select("id, nama_alat, merek, kondisi_alat, jumlah_total, jumlah_tersedia, foto_url")
    .order("nama_alat");

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">
            Kelola Alat Organik
          </h1>
          <Link
            href="/admin/alat-organik/baru"
            className="rounded-lg bg-[#F6EE29] px-4 py-2 text-sm font-semibold text-black hover:bg-[#d1cb23]"
          >
            + Tambah Alat
          </Link>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {alat?.length ?? 0} jenis alat organik terdaftar
        </p>

        <div className="mt-6 space-y-2">
          {(alat ?? []).length === 0 && (
            <p className="text-slate-400">Belum ada alat organik.</p>
          )}
          {(alat ?? []).map((a) => (
            <Link
              key={a.id}
              href={`/admin/alat-organik/${a.id}/edit`}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-[#d1cb23]"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {a.foto_url && (
                  <Image
                    src={a.foto_url}
                    alt={a.nama_alat}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">
                  {a.nama_alat} {a.merek && `- ${a.merek}`}
                </p>
                <p className="text-sm text-slate-500">
                  {a.jumlah_tersedia} dari {a.jumlah_total} tersedia &middot;{" "}
                  <span
                    className={
                      a.kondisi_alat === "Baik"
                        ? "text-green-700"
                        : "text-red-700"
                    }
                  >
                    {a.kondisi_alat}
                  </span>
                </p>
              </div>
              <span className="text-sm font-medium text-blue-600">Edit</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
