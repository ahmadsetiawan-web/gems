import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import TimKerjaForm from "./TimKerjaForm";
import FotoForm from "./FotoForm";

export default async function ProfilPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nip, email")
    .eq("id", user.id)
    .single();

  const { data: pegawai } = profile?.nip
    ? await supabase
        .from("pegawai")
        .select("nip, nama, golongan, jabatan, status_pegawai, tim_kerja, foto_url")
        .eq("nip", profile.nip)
        .single()
    : { data: null };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">Profil Saya</h1>

        {!pegawai && (
          <p className="mt-4 text-slate-500">Data pegawai tidak ditemukan.</p>
        )}

        {pegawai && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <FotoForm nip={pegawai.nip} fotoUrl={pegawai.foto_url} />

            <dl className="mt-5 space-y-3 border-t border-slate-200 pt-5 text-sm">
              <div>
                <dt className="text-slate-500">Nama</dt>
                <dd className="font-medium text-slate-900">{pegawai.nama}</dd>
              </div>
              <div>
                <dt className="text-slate-500">NIP</dt>
                <dd className="font-medium text-slate-900">{pegawai.nip}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Golongan</dt>
                <dd className="font-medium text-slate-900">
                  {pegawai.golongan}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Jabatan</dt>
                <dd className="font-medium text-slate-900">
                  {pegawai.jabatan}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Status Pegawai</dt>
                <dd className="font-medium text-slate-900">
                  {pegawai.status_pegawai ?? "-"}
                </dd>
              </div>
            </dl>

            <div className="mt-5 border-t border-slate-200 pt-5">
              <TimKerjaForm nip={pegawai.nip} timKerja={pegawai.tim_kerja} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
