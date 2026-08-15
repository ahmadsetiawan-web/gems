import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import PengajuanForm from "./PengajuanForm";

export default async function AjukanPinjamPage(
  props: PageProps<"/pinjam/ajukan/[id]">
) {
  const { id } = await props.params;
  const idAlat = decodeURIComponent(id);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: alat } = await supabase
    .from("alat")
    .select("*")
    .eq("id_alat", idAlat)
    .single();

  if (!alat) notFound();

  const { data: kelengkapan } = await supabase
    .from("kelengkapan_alat")
    .select("id, nama_bagian, no_inventaris, kategori, jumlah_standar")
    .eq("id_alat", idAlat)
    .order("urutan")
    .order("created_at");

  const { data: draftRow } = await supabase
    .from("peminjaman")
    .select("id, tanggal_rencana_kembali, keperluan, catatan_tambahan")
    .eq("id_alat", idAlat)
    .eq("peminjam_id", user.id)
    .eq("status", "draft")
    .maybeSingle();

  const { data: draftChecklist } = draftRow
    ? await supabase
        .from("peminjaman_kelengkapan")
        .select("kelengkapan_id, jumlah_dibawa")
        .eq("peminjaman_id", draftRow.id)
    : { data: null };

  const draft = draftRow
    ? { ...draftRow, checklist: draftChecklist ?? [] }
    : null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          Ajukan Peminjaman
        </h1>
        <div className="mt-6">
          <PengajuanForm alat={alat} kelengkapan={kelengkapan ?? []} draft={draft} />
        </div>
      </main>
    </div>
  );
}
