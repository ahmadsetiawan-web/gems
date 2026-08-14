import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import AlatTable from "./AlatTable";

export default async function AdminAlatPage() {
  const supabase = await createClient();

  const { data: alat } = await supabase
    .from("alat")
    .select(
      "id_alat, nama_alat, tipe_alat, tahun_alat, kondisi_alat, status_ketersediaan, lokasi_penyimpanan"
    )
    .order("nama_alat");

  const { data: jenisAlat } = await supabase
    .from("jenis_alat")
    .select("nama_alat, foto_url");

  const jenisMap = Object.fromEntries(
    (jenisAlat ?? []).map((j) => [j.nama_alat, { foto_url: j.foto_url }])
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">
            Kelola Alat Survei
          </h1>
          <Link
            href="/admin/alat/baru"
            className="rounded-lg bg-[#F6EE29] px-4 py-2 text-sm font-semibold text-black hover:bg-[#d1cb23]"
          >
            + Tambah Alat
          </Link>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {alat?.length ?? 0} alat terdaftar
        </p>

        <div className="mt-6">
          <AlatTable data={alat ?? []} jenisMap={jenisMap} />
        </div>
      </main>
    </div>
  );
}
