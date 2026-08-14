import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import PeralatanList from "./PeralatanList";

export default async function PeralatanPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: alat } = await supabase
    .from("alat")
    .select(
      "id_alat, nama_alat, tipe_alat, kode_alat, no_inventaris, tahun_alat, kondisi_alat, status_ketersediaan, lokasi_penyimpanan"
    )
    .order("nama_alat");

  const { data: jenisAlat } = await supabase
    .from("jenis_alat")
    .select("nama_alat, foto_url, manual_url, dokumen_url");

  const jenisMap = Object.fromEntries(
    (jenisAlat ?? []).map((j) => [
      j.nama_alat,
      {
        foto_url: j.foto_url,
        manual_url: j.manual_url,
        dokumen_url: j.dokumen_url,
      },
    ])
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">Peralatan Survei</h1>
        <p className="mt-1 text-sm text-slate-500">
          Katalog seluruh alat survei geofisika
        </p>
        <div className="mt-6">
          <PeralatanList data={alat ?? []} jenisMap={jenisMap} />
        </div>
      </main>
    </div>
  );
}
