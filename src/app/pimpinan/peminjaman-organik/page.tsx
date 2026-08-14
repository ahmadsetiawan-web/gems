import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import PersetujuanOrganikList, {
  type PengajuanOrganik,
} from "./PersetujuanOrganikList";

export default async function PersetujuanOrganikPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profil } = user
    ? await supabase
        .from("profiles")
        .select("nama, nip")
        .eq("id", user.id)
        .single()
    : { data: null };

  const { data: pegawai } = profil?.nip
    ? await supabase
        .from("pegawai")
        .select("jabatan_struktural")
        .eq("nip", profil.nip)
        .single()
    : { data: null };

  const { data: pengajuan } = (await supabase
    .from("peminjaman_organik")
    .select(
      "id, tanggal_pinjam, tanggal_rencana_kembali, jumlah_diambil, keperluan, alat_organik(nama_alat, merek), profiles!peminjam_id(nama, email)"
    )
    .eq("status", "diajukan")
    .order("created_at")) as { data: PengajuanOrganik[] | null };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          Persetujuan Peminjaman Alat Organik
        </h1>
        {profil?.nama && (
          <p className="mt-1 text-sm text-slate-500">
            {profil.nama}
            {pegawai?.jabatan_struktural && ` — ${pegawai.jabatan_struktural}`}
          </p>
        )}
        <p className="mt-1 text-sm text-slate-500">
          {pengajuan?.length ?? 0} pengajuan menunggu keputusan
        </p>
        <div className="mt-6">
          <PersetujuanOrganikList data={pengajuan ?? []} />
        </div>
      </main>
    </div>
  );
}
