import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import PeralatanOrganikList from "./PeralatanOrganikList";

export default async function PeralatanOrganikPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: alat } = await supabase
    .from("alat_organik")
    .select(
      "id, nama_alat, merek, nup, tahun_pembelian, kondisi_alat, jumlah_total, jumlah_tersedia, foto_url"
    )
    .order("nama_alat");

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          Peralatan Organik
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Katalog seluruh alat organik
        </p>
        <div className="mt-6">
          <PeralatanOrganikList data={alat ?? []} />
        </div>
      </main>
    </div>
  );
}
