import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import PemeriksaanList, { type Penugasan } from "./PemeriksaanList";

export default async function SerahTerimaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: menunggu } = (await supabase
    .from("peminjaman")
    .select(
      "id, id_alat, tanggal_pinjam, tanggal_rencana_kembali, keperluan, catatan_pimpinan2, alat(nama_alat, tipe_alat), profiles!peminjam_id(nama, email)"
    )
    .eq("status", "ditugaskan")
    .eq("ditugaskan_ke", user?.id ?? "")
    .order("tanggal_pinjam")) as { data: Penugasan[] | null };

  type KelengkapanItem = {
    id: string;
    id_alat: string;
    nama_bagian: string;
    no_inventaris: string | null;
    kategori: string | null;
    jumlah_standar: number;
  };

  const idAlatList = [...new Set((menunggu ?? []).map((m) => m.id_alat))];
  const { data: kelengkapanRows } =
    idAlatList.length > 0
      ? ((await supabase
          .from("kelengkapan_alat")
          .select("id, id_alat, nama_bagian, no_inventaris, kategori, jumlah_standar")
          .in("id_alat", idAlatList)
          .order("urutan")) as { data: KelengkapanItem[] | null })
      : { data: [] as KelengkapanItem[] };

  const kelengkapanByAlat: Record<string, KelengkapanItem[]> = {};
  for (const k of kelengkapanRows ?? []) {
    if (!kelengkapanByAlat[k.id_alat]) kelengkapanByAlat[k.id_alat] = [];
    kelengkapanByAlat[k.id_alat].push(k);
  }

  type ChecklistRow = {
    peminjaman_id: string;
    kelengkapan_id: string;
    jumlah_dibawa: number;
    kelengkapan_alat: { nama_bagian: string } | null;
  };

  const menungguIds = (menunggu ?? []).map((m) => m.id);
  const { data: checklistRows } =
    menungguIds.length > 0
      ? ((await supabase
          .from("peminjaman_kelengkapan")
          .select("peminjaman_id, kelengkapan_id, jumlah_dibawa, kelengkapan_alat(nama_bagian)")
          .in("peminjaman_id", menungguIds)) as { data: ChecklistRow[] | null })
      : { data: [] as ChecklistRow[] };

  const checklistByPeminjaman: Record<string, ChecklistRow[]> = {};
  for (const c of checklistRows ?? []) {
    if (!checklistByPeminjaman[c.peminjaman_id]) {
      checklistByPeminjaman[c.peminjaman_id] = [];
    }
    checklistByPeminjaman[c.peminjaman_id].push(c);
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          Serah Terima Alat Survei
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {menunggu?.length ?? 0} alat ditugaskan Pimpinan 2 untuk kamu
          periksa sebelum diserahkan ke peminjam
        </p>
        <div className="mt-6">
          <PemeriksaanList
            data={menunggu ?? []}
            checklistByPeminjaman={checklistByPeminjaman}
            kelengkapanByAlat={kelengkapanByAlat}
          />
        </div>
      </main>
    </div>
  );
}
