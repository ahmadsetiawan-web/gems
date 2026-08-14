import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import KelolaPenggunaList, { type PenggunaRow } from "./KelolaPenggunaList";

export default async function KelolaPenggunaPage() {
  const supabase = await createClient();

  const { data: pegawai } = await supabase
    .from("pegawai")
    .select("nip, nama, jabatan")
    .order("nama");

  const { data: profiles } = await supabase
    .from("profiles")
    .select(
      "id, nama, email, nip, is_admin, is_pimpinan, is_pimpinan2, is_teknisi, is_developer"
    );

  const profileByNip = new Map(
    (profiles ?? [])
      .filter((p) => p.nip)
      .map((p) => [p.nip as string, p])
  );

  const rows: PenggunaRow[] = (pegawai ?? []).map((p) => ({
    nip: p.nip,
    nama: p.nama,
    jabatan: p.jabatan,
    profile: profileByNip.get(p.nip) ?? null,
  }));

  const pegawaiNipSet = new Set((pegawai ?? []).map((p) => p.nip));
  for (const prof of profiles ?? []) {
    if (!prof.nip || !pegawaiNipSet.has(prof.nip)) {
      rows.push({
        nip: prof.nip,
        nama: prof.nama ?? prof.email,
        jabatan: null,
        profile: prof,
      });
    }
  }

  rows.sort((a, b) => a.nama.localeCompare(b.nama));

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          Kelola Pengguna
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Atur siapa yang berperan sebagai Admin, Pimpinan 1, Pimpinan 2, atau
          Teknisi. Menampilkan seluruh pegawai — yang belum pernah
          login/daftar akun ditandai &quot;Belum daftar akun&quot; dan belum
          bisa diberi role.
        </p>
        <div className="mt-6">
          <KelolaPenggunaList data={rows} />
        </div>
      </main>
    </div>
  );
}
