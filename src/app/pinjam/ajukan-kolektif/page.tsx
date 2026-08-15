import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import BulkPengajuanForm from "./BulkPengajuanForm";

export default async function AjukanKolektifPage(
  props: PageProps<"/pinjam/ajukan-kolektif">
) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const draftId =
    typeof searchParams.draft === "string" ? searchParams.draft : null;
  const idsParam =
    typeof searchParams.ids === "string" ? searchParams.ids : null;

  let draftRow: {
    id: string;
    tanggal_rencana_kembali: string;
    keperluan: string | null;
  } | null = null;
  let unitIds: string[] = [];

  if (draftId) {
    const { data } = await supabase
      .from("peminjaman")
      .select("id, id_alat, tanggal_rencana_kembali, keperluan")
      .eq("id", draftId)
      .eq("peminjam_id", user.id)
      .eq("status", "draft")
      .maybeSingle();

    if (!data) notFound();
    draftRow = data;

    const { data: tambahan } = await supabase
      .from("peminjaman_unit_tambahan")
      .select("id_alat")
      .eq("peminjaman_id", draftId);

    unitIds = [data.id_alat, ...(tambahan ?? []).map((t) => t.id_alat)];
  } else if (idsParam) {
    unitIds = idsParam
      .split(",")
      .map((id) => decodeURIComponent(id))
      .filter(Boolean);
  }

  if (unitIds.length === 0) notFound();

  const { data: unitsRaw } = await supabase
    .from("alat")
    .select(
      "id_alat, nama_alat, tipe_alat, kode_alat, no_inventaris, status_ketersediaan, kondisi_alat"
    )
    .in("id_alat", unitIds);

  if (!unitsRaw || unitsRaw.length === 0) notFound();

  // Kolektif hanya untuk 1 jenis alat per pengajuan -- kalau id campuran
  // beberapa jenis (seharusnya tidak terjadi dari alur normal), ambil
  // jenis dari unit pertama saja.
  const namaAlat = unitsRaw[0].nama_alat;
  const units = unitsRaw.filter((u) => u.nama_alat === namaAlat);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          Ajukan Peminjaman Kolektif
        </h1>
        <div className="mt-6">
          <BulkPengajuanForm units={units} draft={draftRow} />
        </div>
      </main>
    </div>
  );
}
