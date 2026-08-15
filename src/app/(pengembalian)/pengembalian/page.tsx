import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import { getJumlahUnitTambahan } from "@/lib/peminjamanKolektif";
import KembalikanList, { type Pinjaman } from "./KembalikanList";
import KonfirmasiKembaliList, {
  type SiapDikembalikan,
} from "./KonfirmasiKembaliList";
import RiwayatList, { type RiwayatRow } from "./RiwayatList";

export default async function AdminPeminjamanPage() {
  const supabase = await createClient();

  const { data: dipinjam } = (await supabase
    .from("peminjaman")
    .select(
      "id, tanggal_pinjam, tanggal_rencana_kembali, keperluan, disetujui_oleh, alat(nama_alat, tipe_alat), profiles!peminjam_id(nama, email)"
    )
    .eq("status", "dipinjam")
    .order("tanggal_rencana_kembali")) as { data: Pinjaman[] | null };

  const { data: siapDikembalikan } = (await supabase
    .from("peminjaman")
    .select(
      "id, tanggal_pinjam, tanggal_rencana_kembali, catatan_pengembalian, diperiksa_kembali_oleh, disetujui_pengembalian_oleh, alat(nama_alat, tipe_alat), profiles!peminjam_id(nama, email)"
    )
    .eq("status", "pengembalian_disetujui")
    .order("tanggal_rencana_kembali")) as { data: SiapDikembalikan[] | null };

  const { data: riwayat } = (await supabase
    .from("peminjaman")
    .select(
      "id, tanggal_pinjam, tanggal_rencana_kembali, tanggal_kembali_aktual, status, catatan_pimpinan, catatan_pengembalian, disetujui_oleh, alat(nama_alat, tipe_alat), profiles!peminjam_id(nama, email)"
    )
    .in("status", ["dikembalikan", "ditolak"])
    .order("created_at", { ascending: false })) as { data: RiwayatRow[] | null };

  type ChecklistRow = {
    peminjaman_id: string;
    kelengkapan_id: string;
    jumlah_dibawa: number;
    kelengkapan_alat: { nama_bagian: string } | null;
  };

  const semuaId = [
    ...(dipinjam ?? []).map((d) => d.id),
    ...(riwayat ?? []).map((r) => r.id),
  ];
  const { data: checklistRows } =
    semuaId.length > 0
      ? ((await supabase
          .from("peminjaman_kelengkapan")
          .select("peminjaman_id, kelengkapan_id, jumlah_dibawa, kelengkapan_alat(nama_bagian)")
          .in("peminjaman_id", semuaId)) as { data: ChecklistRow[] | null })
      : { data: [] as ChecklistRow[] };

  const checklistByPeminjaman: Record<string, ChecklistRow[]> = {};
  for (const c of checklistRows ?? []) {
    if (!checklistByPeminjaman[c.peminjaman_id]) {
      checklistByPeminjaman[c.peminjaman_id] = [];
    }
    checklistByPeminjaman[c.peminjaman_id].push(c);
  }

  const jumlahUnitMap = await getJumlahUnitTambahan(supabase, [
    ...semuaId,
    ...(siapDikembalikan ?? []).map((s) => s.id),
  ]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Peminjaman Alat Survei Aktif
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {dipinjam?.length ?? 0} alat sedang dipinjam
          </p>
          <div className="mt-6">
            <KembalikanList
              data={dipinjam ?? []}
              checklistByPeminjaman={checklistByPeminjaman}
              jumlahUnitMap={jumlahUnitMap}
            />
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
            <KonfirmasiKembaliList
              data={siapDikembalikan ?? []}
              jumlahUnitMap={jumlahUnitMap}
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Riwayat Peminjaman Alat Survei
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Semua peminjaman yang sudah dikembalikan atau ditolak
          </p>
          <div className="mt-4">
            <RiwayatList
              data={riwayat ?? []}
              checklistByPeminjaman={checklistByPeminjaman}
              jumlahUnitMap={jumlahUnitMap}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
