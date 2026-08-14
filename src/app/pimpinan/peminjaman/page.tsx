import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import PersetujuanList, { type Pengajuan } from "./PersetujuanList";

export default async function PersetujuanPage() {
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
    .from("peminjaman")
    .select(
      "id, tanggal_pinjam, tanggal_rencana_kembali, keperluan, alat(nama_alat, tipe_alat), profiles!peminjam_id(nama, email)"
    )
    .eq("status", "diajukan")
    .order("created_at")) as { data: Pengajuan[] | null };

  type ChecklistRow = {
    peminjaman_id: string;
    jumlah_dibawa: number;
    kelengkapan_alat: { nama_bagian: string } | null;
  };

  const pengajuanIds = (pengajuan ?? []).map((p) => p.id);
  const { data: checklistRows } =
    pengajuanIds.length > 0
      ? ((await supabase
          .from("peminjaman_kelengkapan")
          .select("peminjaman_id, jumlah_dibawa, kelengkapan_alat(nama_bagian)")
          .in("peminjaman_id", pengajuanIds)) as { data: ChecklistRow[] | null })
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
          Persetujuan Peminjaman Alat Survei
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
          <PersetujuanList
            data={pengajuan ?? []}
            checklistByPeminjaman={checklistByPeminjaman}
          />
        </div>
      </main>
    </div>
  );
}
