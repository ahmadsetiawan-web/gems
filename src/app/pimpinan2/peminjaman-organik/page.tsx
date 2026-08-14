import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import PenugasanOrganikList, {
  type PengajuanOrganik,
} from "./PenugasanOrganikList";
import AccPemeriksaanOrganikList, {
  type PemeriksaanOrganik,
} from "./AccPemeriksaanOrganikList";
import PenugasanPengembalianOrganikList, {
  type PinjamanOrganik,
} from "./PenugasanPengembalianOrganikList";
import AccPemeriksaanPengembalianOrganikList, {
  type PemeriksaanPengembalianOrganik,
} from "./AccPemeriksaanPengembalianOrganikList";

export default async function Pimpinan2PeminjamanOrganikPage() {
  const supabase = await createClient();

  const { data: menungguPenugasan } = (await supabase
    .from("peminjaman_organik")
    .select(
      "id, tanggal_pinjam, tanggal_rencana_kembali, jumlah_diambil, keperluan, alat_organik(nama_alat, merek), profiles!peminjam_id(nama, email)"
    )
    .eq("status", "disetujui")
    .order("tanggal_pinjam")) as { data: PengajuanOrganik[] | null };

  const { data: menungguAcc } = (await supabase
    .from("peminjaman_organik")
    .select(
      "id, tanggal_pinjam, tanggal_rencana_kembali, jumlah_diambil, catatan_pemeriksaan_teknisi, diserahkan_oleh, alat_organik(nama_alat, merek), profiles!peminjam_id(nama, email)"
    )
    .eq("status", "diperiksa")
    .order("tanggal_pinjam")) as { data: PemeriksaanOrganik[] | null };

  const { data: dipinjam } = (await supabase
    .from("peminjaman_organik")
    .select(
      "id, tanggal_pinjam, tanggal_rencana_kembali, jumlah_diambil, alat_organik(nama_alat, merek), profiles!peminjam_id(nama, email)"
    )
    .eq("status", "dipinjam")
    .order("tanggal_rencana_kembali")) as { data: PinjamanOrganik[] | null };

  const { data: menungguAccPengembalian } = (await supabase
    .from("peminjaman_organik")
    .select(
      "id, tanggal_pinjam, tanggal_rencana_kembali, jumlah_diambil, catatan_pengembalian, diperiksa_kembali_oleh, alat_organik(nama_alat, merek), profiles!peminjam_id(nama, email)"
    )
    .eq("status", "pengembalian_diperiksa")
    .order("tanggal_pinjam")) as { data: PemeriksaanPengembalianOrganik[] | null };

  const { data: teknisiList } = await supabase
    .from("profiles")
    .select("id, nama, email")
    .eq("is_teknisi", true)
    .order("nama");

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
            <PenugasanOrganikList
              data={menungguPenugasan ?? []}
              teknisiList={teknisiList ?? []}
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Menunggu ACC Hasil Pemeriksaan
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {menungguAcc?.length ?? 0} hasil pemeriksaan Teknisi menunggu ACC
            kamu
          </p>
          <div className="mt-4">
            <AccPemeriksaanOrganikList data={menungguAcc ?? []} />
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
            <PenugasanPengembalianOrganikList
              data={dipinjam ?? []}
              teknisiList={teknisiList ?? []}
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Menunggu ACC Pemeriksaan Pengembalian
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {menungguAccPengembalian?.length ?? 0} hasil pemeriksaan
            pengembalian Teknisi menunggu ACC kamu
          </p>
          <div className="mt-4">
            <AccPemeriksaanPengembalianOrganikList
              data={menungguAccPengembalian ?? []}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
