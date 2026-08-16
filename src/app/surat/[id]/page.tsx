import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import KopSurat from "@/components/KopSurat";
import PrintButton from "./PrintButton";
import NomorSuratEditor from "@/components/NomorSuratEditor";

type PeminjamanDetail = {
  id: string;
  nomor_surat: string | null;
  tanggal_pinjam: string;
  tanggal_rencana_kembali: string;
  tanggal_kembali_aktual: string | null;
  keperluan: string | null;
  catatan_tambahan: string | null;
  status: string;
  catatan_pengembalian: string | null;
  diajukan_pada: string | null;
  disetujui_oleh: string | null;
  disetujui_oleh_nip: string | null;
  disetujui_pada: string | null;
  dikonfirmasi_oleh: string | null;
  dikonfirmasi_oleh_nip: string | null;
  dikonfirmasi_pada: string | null;
  diserahkan_oleh: string | null;
  diserahkan_oleh_nip: string | null;
  diserahkan_pada: string | null;
  disetujui2_oleh: string | null;
  disetujui2_oleh_nip: string | null;
  disetujui2_pada: string | null;
  alat: { id_alat: string; nama_alat: string; no_inventaris: string | null } | null;
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

type ChecklistItem = {
  jumlah_dibawa: number;
  kelengkapan_alat: {
    nomor: string | null;
    nama_bagian: string;
    no_inventaris: string | null;
  } | null;
};

export default async function SuratPeminjamanPage(
  props: PageProps<"/surat/[id]">
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

  // RLS peminjaman: pemilik lihat miliknya sendiri, staff lihat semua --
  // jadi kalau baris ini null berarti bukan pemilik dan bukan staff.
  const { data: peminjaman } = (await supabase
    .from("peminjaman")
    .select(
      "id, nomor_surat, tanggal_pinjam, tanggal_rencana_kembali, tanggal_kembali_aktual, keperluan, catatan_tambahan, status, catatan_pengembalian, diajukan_pada, disetujui_oleh, disetujui_oleh_nip, disetujui_pada, dikonfirmasi_oleh, dikonfirmasi_oleh_nip, dikonfirmasi_pada, diserahkan_oleh, diserahkan_oleh_nip, diserahkan_pada, disetujui2_oleh, disetujui2_oleh_nip, disetujui2_pada, alat(id_alat, nama_alat, no_inventaris), profiles!peminjam_id(nama, nip)"
    )
    .eq("id", id)
    .single()) as { data: PeminjamanDetail | null };

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

  const { data: checklist } = (await supabase
    .from("peminjaman_kelengkapan")
    .select("jumlah_dibawa, kelengkapan_alat(nomor, nama_bagian, no_inventaris)")
    .eq("peminjaman_id", id)) as { data: ChecklistItem[] | null };

  type UnitTambahan = {
    alat: { id_alat: string; no_inventaris: string | null } | null;
  };

  const { data: unitTambahanRaw } = (await supabase
    .from("peminjaman_unit_tambahan")
    .select("alat(id_alat, no_inventaris)")
    .eq("peminjaman_id", id)) as { data: UnitTambahan[] | null };

  const unitTambahan = unitTambahanRaw ?? [];

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
                    Label
                  </th>
                  <th className="border-r border-slate-900 px-2 py-0.5 text-left">
                    Nama Barang
                  </th>
                  <th className="border-r border-slate-900 px-2 py-0.5 text-left">
                    No. Alat / Inventaris
                  </th>
                  <th className="px-2 py-0.5 text-left">Unit Pinjam</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-900 font-medium">
                  <td className="border-r border-slate-900 px-2 py-0.5"></td>
                  <td className="border-r border-slate-900 px-2 py-0.5">A</td>
                  <td className="border-r border-slate-900 px-2 py-0.5">
                    Equipments: {peminjaman.alat?.nama_alat ?? "-"}
                    {unitTambahan.length > 0 &&
                      ` — ${unitTambahan.length + 1} unit`}
                  </td>
                  <td className="border-r border-slate-900 px-2 py-0.5">
                    {unitTambahan.length === 0
                      ? (peminjaman.alat?.no_inventaris ?? "-")
                      : ""}
                  </td>
                  <td className="px-2 py-0.5"></td>
                </tr>
                {unitTambahan.length > 0 && (
                  <>
                    {[
                      { id_alat: peminjaman.alat?.id_alat, no_inventaris: peminjaman.alat?.no_inventaris },
                      ...unitTambahan.map((u) => u.alat),
                    ].map((u, i) => (
                      <tr key={u?.id_alat ?? i} className="border-b border-slate-900">
                        <td className="border-r border-slate-900 px-2 py-0.5">
                          {i + 1}
                        </td>
                        <td className="border-r border-slate-900 px-2 py-0.5"></td>
                        <td className="border-r border-slate-900 px-2 py-0.5">
                          {u?.id_alat ?? "-"}
                        </td>
                        <td className="border-r border-slate-900 px-2 py-0.5">
                          {u?.no_inventaris ?? "-"}
                        </td>
                        <td className="px-2 py-0.5">1</td>
                      </tr>
                    ))}
                  </>
                )}
                {(checklist ?? []).map((c, i) => (
                  <tr key={i} className="border-b border-slate-900">
                    <td className="border-r border-slate-900 px-2 py-0.5">
                      {i + 1}
                    </td>
                    <td className="border-r border-slate-900 px-2 py-0.5">
                      {c.kelengkapan_alat?.nomor ?? "-"}
                    </td>
                    <td className="border-r border-slate-900 px-2 py-0.5">
                      {c.kelengkapan_alat?.nama_bagian ?? "-"}
                    </td>
                    <td className="border-r border-slate-900 px-2 py-0.5">
                      {c.kelengkapan_alat?.no_inventaris ?? "-"}
                    </td>
                    <td className="px-2 py-0.5">{c.jumlah_dibawa}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="break-inside-avoid-page">
              <div className="grid grid-cols-2 gap-4 border-b border-t border-slate-900 p-2">
                <div>
                  <p>Catatan tambahan :</p>
                  <p className="mt-2 font-medium">
                    {peminjaman.catatan_tambahan ?? "-"}
                  </p>
                </div>
                <div>
                  <p>Teknisi Peralatan :</p>
                  {peminjaman.diserahkan_oleh ? (
                    <div className="mt-2 rounded border border-slate-400 p-1.5">
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
