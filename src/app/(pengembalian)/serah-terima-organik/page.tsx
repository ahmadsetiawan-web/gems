import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import PemeriksaanOrganikList, {
  type PenugasanOrganik,
} from "./PemeriksaanOrganikList";

export default async function SerahTerimaOrganikPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: menunggu } = (await supabase
    .from("peminjaman_organik")
    .select(
      "id, tanggal_pinjam, tanggal_rencana_kembali, jumlah_diambil, keperluan, catatan_pimpinan2, alat_organik(nama_alat, merek), profiles!peminjam_id(nama, email)"
    )
    .eq("status", "ditugaskan")
    .eq("ditugaskan_ke", user?.id ?? "")
    .order("tanggal_pinjam")) as { data: PenugasanOrganik[] | null };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          Serah Terima Alat Organik
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {menunggu?.length ?? 0} alat ditugaskan Pimpinan 2 untuk kamu
          periksa sebelum diserahkan ke peminjam
        </p>
        <div className="mt-6">
          <PemeriksaanOrganikList data={menunggu ?? []} />
        </div>
      </main>
    </div>
  );
}
