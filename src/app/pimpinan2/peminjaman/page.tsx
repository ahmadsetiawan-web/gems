import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import { getJumlahUnitTambahan } from "@/lib/peminjamanKolektif";
import PenugasanList, { type Pengajuan } from "./PenugasanList";
import AccPemeriksaanList, { type Pemeriksaan } from "./AccPemeriksaanList";
import PenugasanPengembalianList, {
  type Pinjaman,
} from "./PenugasanPengembalianList";
import AccPemeriksaanPengembalianList, {
  type PemeriksaanPengembalian,
} from "./AccPemeriksaanPengembalianList";

export default async function Pimpinan2PeminjamanPage() {
  const supabase = await createClient();

  const { data: menungguPenugasan } = (await supabase
    .from("peminjaman")
    .select(
      "id, tanggal_pinjam, tanggal_rencana_kembali, keperluan, alat(nama_alat, tipe_alat), profiles!peminjam_id(nama, email)"
    )
    .eq("status", "disetujui")
    .order("tanggal_pinjam")) as { data: Pengajuan[] | null };

  const { data: menungguAcc } = (await supabase
    .from("peminjaman")
    .select(
      "id, tanggal_pinjam, tanggal_rencana_kembali, keperluan, catatan_pemeriksaan_teknisi, diserahkan_oleh, alat(nama_alat, tipe_alat), profiles!peminjam_id(nama, email)"
    )
    .eq("status", "diperiksa")
    .order("tanggal_pinjam")) as { data: Pemeriksaan[] | null };

  const { data: dipinjam } = (await supabase
    .from("peminjaman")
    .select(
      "id, tanggal_pinjam, tanggal_rencana_kembali, alat(nama_alat, tipe_alat), profiles!peminjam_id(nama, email)"
    )
    .eq("status", "dipinjam")
    .order("tanggal_rencana_kembali")) as { data: Pinjaman[] | null };

  const { data: menungguAccPengembalian } = (await supabase
    .from("peminjaman")
    .select(
      "id, tanggal_pinjam, tanggal_rencana_kembali, catatan_pengembalian, diperiksa_kembali_oleh, alat(nama_alat, tipe_alat), profiles!peminjam_id(nama, email)"
    )
    .eq("status", "pengembalian_diperiksa")
    .order("tanggal_pinjam")) as { data: PemeriksaanPengembalian[] | null };

  const { data: teknisiList } = await supabase
    .from("profiles")
    .select("id, nama, email")
    .eq("is_teknisi", true)
    .order("nama");

  type ChecklistRow = {
    peminjaman_id: string;
    jumlah_dibawa: number;
    kelengkapan_alat: { nama_bagian: string } | null;
  };

  const ids = (menungguPenugasan ?? []).map((p) => p.id);
  const { data: checklistRows } =
    ids.length > 0
      ? ((await supabase
          .from("peminjaman_kelengkapan")
          .select("peminjaman_id, jumlah_dibawa, kelengkapan_alat(nama_bagian)")
          .in("peminjaman_id", ids)) as { data: ChecklistRow[] | null })
      : { data: [] as ChecklistRow[] };

  const checklistByPeminjaman: Record<string, ChecklistRow[]> = {};
  for (const c of checklistRows ?? []) {
    if (!checklistByPeminjaman[c.peminjaman_id]) {
      checklistByPeminjaman[c.peminjaman_id] = [];
    }
    checklistByPeminjaman[c.peminjaman_id].push(c);
  }

  const jumlahUnitMap = await getJumlahUnitTambahan(supabase, [
    ...(menungguPenugasan ?? []).map((p) => p.id),
    ...(menungguAcc ?? []).map((p) => p.id),
    ...(dipinjam ?? []).map((p) => p.id),
    ...(menungguAccPengembalian ?? []).map((p) => p.id),
  ]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Menunggu Penugasan Teknisi
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {menungguPenugasan?.length ?? 0} pengajuan sudah disetujui
            Pimpinan 1, tunjuk Teknisi untuk memeriksa alat
          </p>
          <div className="mt-6">
            <PenugasanList
              data={menungguPenugasan ?? []}
              teknisiList={teknisiList ?? []}
              checklistByPeminjaman={checklistByPeminjaman}
              jumlahUnitMap={jumlahUnitMap}
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Menunggu Persetujuan Hasil Pemeriksaan
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {menungguAcc?.length ?? 0} hasil pemeriksaan Teknisi menunggu persetujuan
            kamu
          </p>
          <div className="mt-4">
            <AccPemeriksaanList
              data={menungguAcc ?? []}
              jumlahUnitMap={jumlahUnitMap}
            />
          </div>
        </div>

        <div className="border-t border-slate-200 pt-8">
          <h2 className="text-xl font-semibold text-slate-900">
            Alat Dipinjam — Tugaskan Teknisi untuk Cek Pengembalian
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {dipinjam?.length ?? 0} alat sedang dipinjam. Kalau alatnya sudah
            kembali secara fisik, tunjuk Teknisi untuk memeriksa kondisinya.
          </p>
          <div className="mt-4">
            <PenugasanPengembalianList
              data={dipinjam ?? []}
              teknisiList={teknisiList ?? []}
              jumlahUnitMap={jumlahUnitMap}
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Menunggu Persetujuan Pemeriksaan Pengembalian
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {menungguAccPengembalian?.length ?? 0} hasil pemeriksaan
            pengembalian Teknisi menunggu persetujuan kamu
          </p>
          <div className="mt-4">
            <AccPemeriksaanPengembalianList
              data={menungguAccPengembalian ?? []}
              jumlahUnitMap={jumlahUnitMap}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
