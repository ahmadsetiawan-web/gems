import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import PengajuanOrganikForm from "./PengajuanOrganikForm";

export default async function AjukanPinjamOrganikPage(
  props: PageProps<"/pinjam-organik/ajukan/[id]">
) {
  const { id } = await props.params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: alat } = await supabase
    .from("alat_organik")
    .select("id, nama_alat, merek, kondisi_alat, jumlah_tersedia")
    .eq("id", id)
    .single();

  if (!alat) notFound();

  const { data: draft } = await supabase
    .from("peminjaman_organik")
    .select("id, jumlah_diambil, tanggal_rencana_kembali, keperluan")
    .eq("id_alat_organik", id)
    .eq("peminjam_id", user.id)
    .eq("status", "draft")
    .maybeSingle();

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          Ajukan Peminjaman Alat Organik
        </h1>
        <div className="mt-6">
          <PengajuanOrganikForm alat={alat} draft={draft} />
        </div>
      </main>
    </div>
  );
}
