import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import StatusPeminjamanList, { type StatusRow } from "./StatusPeminjamanList";

type SurveiRow = {
  id: string;
  tanggal_pinjam: string;
  tanggal_rencana_kembali: string;
  status: string;
  alat: { nama_alat: string } | null;
  profiles: { nama: string | null; email: string } | null;
  teknisi: { nama: string | null; email: string } | null;
};

type OrganikRow = {
  id: string;
  tanggal_pinjam: string;
  tanggal_rencana_kembali: string;
  jumlah_diambil: number;
  status: string;
  alat_organik: { nama_alat: string } | null;
  profiles: { nama: string | null; email: string } | null;
  teknisi: { nama: string | null; email: string } | null;
};

export default async function StatusPeminjamanPage() {
  const supabase = await createClient();

  const { data: survei } = (await supabase
    .from("peminjaman")
    .select(
      "id, tanggal_pinjam, tanggal_rencana_kembali, status, alat(nama_alat), profiles!peminjam_id(nama, email), teknisi:profiles!ditugaskan_ke(nama, email)"
    )
    .neq("status", "draft")
    .order("created_at", { ascending: false })) as { data: SurveiRow[] | null };

  const { data: organik } = (await supabase
    .from("peminjaman_organik")
    .select(
      "id, tanggal_pinjam, tanggal_rencana_kembali, jumlah_diambil, status, alat_organik(nama_alat), profiles!peminjam_id(nama, email), teknisi:profiles!ditugaskan_ke(nama, email)"
    )
    .neq("status", "draft")
    .order("created_at", { ascending: false })) as { data: OrganikRow[] | null };

  const rows: StatusRow[] = [
    ...(survei ?? []).map((r) => ({
      id: r.id,
      jenis: "Survei" as const,
      namaAlat: r.alat?.nama_alat ?? "-",
      peminjam: r.profiles?.nama || r.profiles?.email || "-",
      tanggalPinjam: r.tanggal_pinjam,
      tanggalRencanaKembali: r.tanggal_rencana_kembali,
      status: r.status,
      ditugaskanKe: r.teknisi?.nama || r.teknisi?.email || null,
    })),
    ...(organik ?? []).map((r) => ({
      id: r.id,
      jenis: "Organik" as const,
      namaAlat: `${r.alat_organik?.nama_alat ?? "-"} (x${r.jumlah_diambil})`,
      peminjam: r.profiles?.nama || r.profiles?.email || "-",
      tanggalPinjam: r.tanggal_pinjam,
      tanggalRencanaKembali: r.tanggal_rencana_kembali,
      status: r.status,
      ditugaskanKe: r.teknisi?.nama || r.teknisi?.email || null,
    })),
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          Status Semua Peminjaman
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {rows.length} peminjaman aktif maupun riwayat (survei & organik),
          semua tahap dalam satu tempat
        </p>
        <div className="mt-6">
          <StatusPeminjamanList data={rows} />
        </div>
      </main>
    </div>
  );
}
