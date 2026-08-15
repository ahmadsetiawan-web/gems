import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import KembalikanOrganikList, {
  type PinjamanOrganik,
} from "./KembalikanOrganikList";
import KonfirmasiKembaliOrganikList, {
  type SiapDikembalikanOrganik,
} from "./KonfirmasiKembaliOrganikList";
import RiwayatOrganikList, {
  type RiwayatOrganikRow,
} from "./RiwayatOrganikList";

export default async function AdminPeminjamanOrganikPage() {
  const supabase = await createClient();

  const { data: dipinjam } = (await supabase
    .from("peminjaman_organik")
    .select(
      "id, tanggal_pinjam, tanggal_rencana_kembali, jumlah_diambil, disetujui_oleh, alat_organik(nama_alat, merek), profiles!peminjam_id(nama, email)"
    )
    .eq("status", "dipinjam")
    .order("tanggal_rencana_kembali")) as { data: PinjamanOrganik[] | null };

  const { data: siapDikembalikan } = (await supabase
    .from("peminjaman_organik")
    .select(
      "id, tanggal_pinjam, tanggal_rencana_kembali, jumlah_diambil, catatan_pengembalian, diperiksa_kembali_oleh, disetujui_pengembalian_oleh, alat_organik(nama_alat, merek), profiles!peminjam_id(nama, email)"
    )
    .eq("status", "pengembalian_disetujui")
    .order("tanggal_rencana_kembali")) as { data: SiapDikembalikanOrganik[] | null };

  const { data: riwayat } = (await supabase
    .from("peminjaman_organik")
    .select(
      "id, tanggal_pinjam, tanggal_rencana_kembali, tanggal_kembali_aktual, jumlah_diambil, status, catatan_pimpinan, catatan_pengembalian, disetujui_oleh, alat_organik(nama_alat, merek), profiles!peminjam_id(nama, email)"
    )
    .in("status", ["dikembalikan", "ditolak"])
    .order("created_at", { ascending: false })) as { data: RiwayatOrganikRow[] | null };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Peminjaman Alat Organik Aktif
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {dipinjam?.length ?? 0} alat sedang dipinjam
          </p>
          <div className="mt-6">
            <KembalikanOrganikList data={dipinjam ?? []} />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Siap Dikonfirmasi Kembali
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {siapDikembalikan?.length ?? 0} alat sudah disetujui Pimpinan 2,
            tinggal konfirmasi final
          </p>
          <div className="mt-4">
            <KonfirmasiKembaliOrganikList data={siapDikembalikan ?? []} />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Riwayat Peminjaman Alat Organik
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Semua peminjaman yang sudah dikembalikan atau ditolak
          </p>
          <div className="mt-4">
            <RiwayatOrganikList data={riwayat ?? []} />
          </div>
        </div>
      </main>
    </div>
  );
}
