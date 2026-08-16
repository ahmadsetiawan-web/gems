import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import KopSurat from "@/components/KopSurat";
import PrintButton from "./PrintButton";
import NomorSuratEditor from "@/components/NomorSuratEditor";

type PeminjamanOrganikDetail = {
  id: string;
  nomor_surat: string | null;
  tanggal_pinjam: string;
  tanggal_rencana_kembali: string;
  keperluan: string | null;
  jumlah_diambil: number;
  diajukan_pada: string | null;
  disetujui_oleh: string | null;
  disetujui_oleh_nip: string | null;
  disetujui_pada: string | null;
  diserahkan_oleh: string | null;
  diserahkan_oleh_nip: string | null;
  diserahkan_pada: string | null;
  disetujui2_oleh: string | null;
  disetujui2_oleh_nip: string | null;
  disetujui2_pada: string | null;
  alat_organik: { nama_alat: string } | null;
  profiles: { nama: string | null; nip: string | null } | null;
};

function formatWaktu(iso: string | null) {
  if (!iso) return null;
  return (
    new Date(iso).toLocaleString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }) + " WIB"
  );
}

export default async function SuratPeminjamanOrganikPage(
  props: PageProps<"/surat-organik/[id]">
) {
  const { id } = await props.params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, is_pimpinan, is_pimpinan2, is_teknisi, is_developer")
    .eq("id", user.id)
    .single();
  const isStaff = !!(
    profile?.is_admin ||
    profile?.is_pimpinan ||
    profile?.is_pimpinan2 ||
    profile?.is_teknisi ||
    profile?.is_developer
  );

  // RLS peminjaman_organik: pemilik lihat miliknya sendiri, staff lihat
  // semua -- jadi kalau baris ini null berarti bukan pemilik dan bukan
  // staff.
  const { data: peminjaman } = (await supabase
    .from("peminjaman_organik")
    .select(
      "id, nomor_surat, tanggal_pinjam, tanggal_rencana_kembali, keperluan, jumlah_diambil, diajukan_pada, disetujui_oleh, disetujui_oleh_nip, disetujui_pada, diserahkan_oleh, diserahkan_oleh_nip, diserahkan_pada, disetujui2_oleh, disetujui2_oleh_nip, disetujui2_pada, alat_organik(nama_alat), profiles!peminjam_id(nama, nip)"
    )
    .eq("id", id)
    .single()) as { data: PeminjamanOrganikDetail | null };

  if (!peminjaman) notFound();

  const { data: pimpinan2 } = await supabase
    .from("profiles")
    .select("nama, nip")
    .eq("is_pimpinan2", true)
    .limit(1)
    .maybeSingle();

  const { data: pegawai } = peminjaman.profiles?.nip
    ? await supabase
        .from("pegawai")
        .select("tim_kerja")
        .eq("nip", peminjaman.profiles.nip)
        .single()
    : { data: null };

  const pimpinan2Nip = peminjaman.disetujui2_oleh_nip ?? pimpinan2?.nip;
  const { data: pegawaiPimpinan2 } = pimpinan2Nip
    ? await supabase
        .from("pegawai")
        .select("jabatan_struktural")
        .eq("nip", pimpinan2Nip)
        .single()
    : { data: null };
  const jabatanPimpinan2 = pegawaiPimpinan2?.jabatan_struktural || null;

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <div className="no-print">
        <Navbar />
      </div>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="no-print mb-4 flex justify-end">
          <PrintButton />
        </div>

        {!peminjaman.nomor_surat ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Surat belum bisa dicetak — nomor surat baru terbentuk otomatis
            setelah pengajuan ini disetujui pimpinan.
          </div>
        ) : (
          <div className="border border-slate-900 bg-white text-xs">
            <KopSurat />
            <div className="border-b border-slate-900 p-1.5 text-center font-bold">
              SURAT PEMINJAMAN PERALATAN
            </div>
            <div className="border-b border-slate-900 p-1.5 text-center">
              <NomorSuratEditor
                id={peminjaman.id}
                nomorSurat={peminjaman.nomor_surat}
                table="peminjaman_organik"
                column="nomor_surat"
                canEdit={isStaff}
              />
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 border-b border-slate-900 p-3">
              <div>
                <span className="text-slate-500">Nama Peminjam</span>
                <p className="font-medium">{peminjaman.profiles?.nama ?? "-"}</p>
              </div>
              <div>
                <span className="text-slate-500">NIP</span>
                <p className="font-medium">{peminjaman.profiles?.nip ?? "-"}</p>
              </div>
              <div>
                <span className="text-slate-500">Tim Kerja</span>
                <p className="font-medium">{pegawai?.tim_kerja ?? "-"}</p>
              </div>
              <div>
                <span className="text-slate-500">Keperluan</span>
                <p className="font-medium">{peminjaman.keperluan ?? "-"}</p>
              </div>
              <div>
                <span className="text-slate-500">Tanggal Pinjam</span>
                <p className="font-medium">{peminjaman.tanggal_pinjam}</p>
              </div>
              <div>
                <span className="text-slate-500">Tanggal Rencana Kembali</span>
                <p className="font-medium">
                  {peminjaman.tanggal_rencana_kembali}
                </p>
              </div>
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-900">
                  <th className="border-r border-slate-900 px-2 py-0.5 text-left">
                    No.
                  </th>
                  <th className="border-r border-slate-900 px-2 py-0.5 text-left">
                    Nama Barang
                  </th>
                  <th className="px-2 py-0.5 text-left">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-900">
                  <td className="border-r border-slate-900 px-2 py-0.5">1</td>
                  <td className="border-r border-slate-900 px-2 py-0.5">
                    {peminjaman.alat_organik?.nama_alat ?? "-"}
                  </td>
                  <td className="px-2 py-0.5">{peminjaman.jumlah_diambil}</td>
                </tr>
              </tbody>
            </table>

            <div className="break-inside-avoid-page">
              <div className="border-b border-t border-slate-900 p-2">
                <p>Teknisi Peralatan :</p>
                {peminjaman.diserahkan_oleh ? (
                  <div className="mt-2 inline-block rounded border border-slate-400 p-1.5">
                    <p className="font-medium">{peminjaman.diserahkan_oleh}</p>
                    {peminjaman.diserahkan_oleh_nip && (
                      <p>NIP. {peminjaman.diserahkan_oleh_nip}</p>
                    )}
                    {peminjaman.diserahkan_pada && (
                      <p className="text-slate-500">
                        Diperiksa elektronik &middot;{" "}
                        {formatWaktu(peminjaman.diserahkan_pada)}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="h-8" />
                    <p>
                      ( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )
                    </p>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-3">
                <div>
                  <p>Mengetahui / Menyetujui :</p>
                  {jabatanPimpinan2 && <p>{jabatanPimpinan2}</p>}
                </div>
                <div>
                  <p>
                    Bandung,{" "}
                    {formatWaktu(peminjaman.diajukan_pada) ??
                      "...................................."}
                  </p>
                  <p>Atas Nama Peminjam Peralatan,</p>
                </div>

                <div className="rounded border border-slate-400 p-1.5">
                  <p className="font-medium">
                    {peminjaman.disetujui2_oleh ?? pimpinan2?.nama ?? "-"}
                  </p>
                  <p>
                    NIP.{" "}
                    {peminjaman.disetujui2_oleh_nip ?? pimpinan2?.nip ?? "-"}
                  </p>
                  <p className="text-slate-500">
                    Disetujui elektronik
                    {peminjaman.disetujui2_pada &&
                      ` · ${formatWaktu(peminjaman.disetujui2_pada)}`}
                  </p>
                </div>
                <div className="rounded border border-slate-400 p-1.5">
                  <p className="font-medium">
                    {peminjaman.profiles?.nama ?? "-"}
                  </p>
                  <p>NIP. {peminjaman.profiles?.nip ?? "-"}</p>
                  <p className="text-slate-500">
                    Diajukan elektronik
                    {peminjaman.diajukan_pada &&
                      ` · ${formatWaktu(peminjaman.diajukan_pada)}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
