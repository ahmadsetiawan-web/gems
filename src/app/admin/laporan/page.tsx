import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import LaporanClient, { type RiwayatItem } from "./LaporanClient";

// Cuma hitung peminjaman yang benar-benar pernah keluar secara fisik --
// draft/diajukan/disetujui/ditugaskan/diperiksa (belum resmi dipinjam)
// dan ditolak (tidak pernah terjadi) tidak dihitung sebagai "sudah
// dipinjam".
const SUDAH_DIPINJAM = [
  "dipinjam",
  "pengembalian_ditugaskan",
  "pengembalian_diperiksa",
  "pengembalian_disetujui",
  "dikembalikan",
];

// Label per unit fisik, misal "MTU5C_802 - MTU-5C" -- bukan nama
// jenisnya (yang bisa dipakai banyak unit sekaligus).
function labelUnit(idAlat: string, tipeAlat: string | null) {
  return tipeAlat ? `${idAlat} - ${tipeAlat}` : idAlat;
}

export default async function LaporanPage() {
  const supabase = await createClient();

  type SurveiRow = {
    id: string;
    tanggal_pinjam: string;
    tanggal_kembali_aktual: string | null;
    status: string;
    alat: { id_alat: string; tipe_alat: string | null } | null;
    profiles: { nama: string | null; email: string } | null;
  };

  const { data: survei } = (await supabase
    .from("peminjaman")
    .select(
      "id, tanggal_pinjam, tanggal_kembali_aktual, status, alat(id_alat, tipe_alat), profiles!peminjam_id(nama, email)"
    )
    .in("status", SUDAH_DIPINJAM)
    .order("tanggal_pinjam", { ascending: false })) as {
    data: SurveiRow[] | null;
  };

  const surveiIds = (survei ?? []).map((s) => s.id);

  // Pengajuan kolektif (borongan) melibatkan lebih dari 1 unit fisik --
  // ambil semua unit tambahannya supaya tiap unit dihitung sendiri-sendiri
  // di peringkat, bukan cuma unit utamanya.
  type UnitTambahanRow = {
    peminjaman_id: string;
    alat: { id_alat: string; tipe_alat: string | null } | null;
  };

  const { data: unitTambahanRaw } =
    surveiIds.length > 0
      ? ((await supabase
          .from("peminjaman_unit_tambahan")
          .select("peminjaman_id, alat(id_alat, tipe_alat)")
          .in("peminjaman_id", surveiIds)) as { data: UnitTambahanRow[] | null })
      : { data: [] as UnitTambahanRow[] };

  const unitTambahanByPeminjaman = new Map<
    string,
    { id_alat: string; tipe_alat: string | null }[]
  >();
  for (const u of unitTambahanRaw ?? []) {
    if (!u.alat) continue;
    if (!unitTambahanByPeminjaman.has(u.peminjaman_id)) {
      unitTambahanByPeminjaman.set(u.peminjaman_id, []);
    }
    unitTambahanByPeminjaman.get(u.peminjaman_id)!.push(u.alat);
  }

  type OrganikRow = {
    id: string;
    tanggal_pinjam: string;
    tanggal_kembali_aktual: string | null;
    jumlah_diambil: number;
    status: string;
    alat_organik: { nama_alat: string } | null;
    profiles: { nama: string | null; email: string } | null;
  };

  const { data: organik } = (await supabase
    .from("peminjaman_organik")
    .select(
      "id, tanggal_pinjam, tanggal_kembali_aktual, jumlah_diambil, status, alat_organik(nama_alat), profiles!peminjam_id(nama, email)"
    )
    .in("status", SUDAH_DIPINJAM)
    .order("tanggal_pinjam", { ascending: false })) as {
    data: OrganikRow[] | null;
  };

  // Peringkat per UNIT FISIK untuk Alat Survei (bukan per jenis), dan
  // sekaligus daftar siapa saja yang meminjam tiap unit itu. Untuk
  // pengajuan kolektif, 1 baris peminjaman ikut menyumbang hitungan ke
  // SEMUA unit yang terlibat di dalamnya (unit utama + unit tambahan).
  const riwayatPerUnitSurvei: Record<string, RiwayatItem[]> = {};

  for (const r of survei ?? []) {
    if (!r.alat) continue;
    const semuaUnit = [r.alat, ...(unitTambahanByPeminjaman.get(r.id) ?? [])];
    const item: RiwayatItem = {
      id: r.id,
      jenis: "Survei",
      namaAlat: semuaUnit.map((u) => labelUnit(u.id_alat, u.tipe_alat)).join(", "),
      peminjam: r.profiles?.nama || r.profiles?.email || "-",
      tanggalPinjam: r.tanggal_pinjam,
      tanggalKembali: r.tanggal_kembali_aktual,
      status: r.status,
    };
    for (const u of semuaUnit) {
      const label = labelUnit(u.id_alat, u.tipe_alat);
      if (!riwayatPerUnitSurvei[label]) riwayatPerUnitSurvei[label] = [];
      riwayatPerUnitSurvei[label].push(item);
    }
  }

  // Alat Organik tidak dibuatkan histogram (tidak dibutuhkan) -- data
  // ini cuma dipakai untuk ikut muncul di pencarian "Riwayat per Pegawai".
  const riwayatOrganik: RiwayatItem[] = (organik ?? []).map((r) => ({
    id: r.id,
    jenis: "Organik",
    namaAlat: `${r.alat_organik?.nama_alat ?? "-"} (x${r.jumlah_diambil})`,
    peminjam: r.profiles?.nama || r.profiles?.email || "-",
    tanggalPinjam: r.tanggal_pinjam,
    tanggalKembali: r.tanggal_kembali_aktual,
    status: r.status,
  }));

  // Riwayat gabungan per peminjam, untuk pencarian "pegawai X pernah
  // pinjam alat apa saja".
  const riwayat: RiwayatItem[] = [
    ...Object.values(riwayatPerUnitSurvei)
      .flat()
      .filter(
        (item, i, arr) => arr.findIndex((x) => x.id === item.id) === i
      ),
    ...riwayatOrganik,
  ].sort((a, b) => (a.tanggalPinjam < b.tanggalPinjam ? 1 : -1));

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Laporan Peminjaman
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Alat paling sering dipinjam, dan riwayat peminjaman per
            pegawai. Cuma menghitung peminjaman yang benar-benar pernah
            resmi keluar (bukan yang masih diproses atau ditolak).
          </p>
        </div>

        <LaporanClient
          riwayatPerUnitSurvei={riwayatPerUnitSurvei}
          riwayat={riwayat}
        />
      </main>
    </div>
  );
}
