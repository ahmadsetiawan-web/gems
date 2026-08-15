import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import KopSurat from "@/components/KopSurat";
import PrintButton from "./PrintButton";

type PengembalianDetail = {
  id: string;
  nomor_surat: string | null;
  tanggal_pinjam: string;
  tanggal_rencana_kembali: string;
  tanggal_kembali_aktual: string | null;
  catatan_pengembalian: string | null;
  diperiksa_kembali_oleh: string | null;
  diperiksa_kembali_oleh_nip: string | null;
  diperiksa_kembali_pada: string | null;
  disetujui_pengembalian_oleh: string | null;
  disetujui_pengembalian_oleh_nip: string | null;
  disetujui_pengembalian_pada: string | null;
  dikonfirmasi_oleh: string | null;
  dikonfirmasi_oleh_nip: string | null;
  dikonfirmasi_pada: string | null;
  alat: { id_alat: string; nama_alat: string; no_inventaris: string | null } | null;
  profiles: { nama: string | null; nip: string | null } | null;
};

type ChecklistItem = {
  jumlah_dikembalikan: number;
  kelengkapan_alat: {
    nomor: string | null;
    nama_bagian: string;
    no_inventaris: string | null;
  } | null;
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

export default async function SuratPengembalianPage(
  props: PageProps<"/surat-pengembalian/[id]">
) {
  const { id } = await props.params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS peminjaman: pemilik lihat miliknya sendiri, staff lihat semua --
  // jadi kalau baris ini null berarti bukan pemilik dan bukan staff.
  const { data: peminjaman } = (await supabase
    .from("peminjaman")
    .select(
      "id, nomor_surat, tanggal_pinjam, tanggal_rencana_kembali, tanggal_kembali_aktual, catatan_pengembalian, diperiksa_kembali_oleh, diperiksa_kembali_oleh_nip, diperiksa_kembali_pada, disetujui_pengembalian_oleh, disetujui_pengembalian_oleh_nip, disetujui_pengembalian_pada, dikonfirmasi_oleh, dikonfirmasi_oleh_nip, dikonfirmasi_pada, alat(id_alat, nama_alat, no_inventaris), profiles!peminjam_id(nama, nip)"
    )
    .eq("id", id)
    .single()) as { data: PengembalianDetail | null };

  if (!peminjaman) notFound();

  const { data: pegawai } = peminjaman.profiles?.nip
    ? await supabase
        .from("pegawai")
        .select("tim_kerja")
        .eq("nip", peminjaman.profiles.nip)
        .single()
    : { data: null };

  const { data: pegawaiPimpinan2 } = peminjaman.disetujui_pengembalian_oleh_nip
    ? await supabase
        .from("pegawai")
        .select("jabatan_struktural")
        .eq("nip", peminjaman.disetujui_pengembalian_oleh_nip)
        .single()
    : { data: null };
  const jabatanPimpinan2 = pegawaiPimpinan2?.jabatan_struktural || null;

  const { data: checklist } = (await supabase
    .from("peminjaman_kelengkapan_kembali")
    .select(
      "jumlah_dikembalikan, kelengkapan_alat(nomor, nama_bagian, no_inventaris)"
    )
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

        {!peminjaman.tanggal_kembali_aktual ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Surat belum bisa dicetak — dokumen ini baru terbentuk setelah
            proses pengembalian selesai dikonfirmasi Admin.
          </div>
        ) : (
          <div className="border border-slate-900 bg-white text-xs">
            <KopSurat />
            <div className="border-b border-slate-900 p-1.5 text-center font-bold">
              SURAT PENGEMBALIAN PERALATAN
            </div>
            {peminjaman.nomor_surat && (
              <div className="border-b border-slate-900 p-1.5 text-center text-slate-500">
                Referensi Surat Peminjaman: {peminjaman.nomor_surat}
              </div>
            )}

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
                <span className="text-slate-500">Nama Alat</span>
                <p className="font-medium">{peminjaman.alat?.nama_alat ?? "-"}</p>
              </div>
              <div>
                <span className="text-slate-500">Tanggal Pinjam</span>
                <p className="font-medium">{peminjaman.tanggal_pinjam}</p>
              </div>
              <div>
                <span className="text-slate-500">Tanggal Dikembalikan</span>
                <p className="font-medium">
                  {peminjaman.tanggal_kembali_aktual}
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
                  <th className="px-2 py-0.5 text-left">Unit Dikembalikan</th>
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
                    <td className="px-2 py-0.5">{c.jumlah_dikembalikan}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-b border-slate-900 p-3">
              <span className="text-slate-500">
                Catatan Pemeriksaan Pengembalian
              </span>
              <p className="font-medium">
                {peminjaman.catatan_pengembalian ?? "-"}
              </p>
            </div>

            <div className="break-inside-avoid-page grid grid-cols-3 gap-x-4 gap-y-2 p-3">
              <div>
                <p>Diperiksa oleh Teknisi :</p>
              </div>
              <div>
                <p>Disetujui oleh :</p>
                {jabatanPimpinan2 && <p>{jabatanPimpinan2}</p>}
              </div>
              <div>
                <p>Dikonfirmasi Admin :</p>
              </div>

              <div className="rounded border border-slate-400 p-1.5">
                <p className="font-medium">
                  {peminjaman.diperiksa_kembali_oleh ?? "-"}
                </p>
                <p>NIP. {peminjaman.diperiksa_kembali_oleh_nip ?? "-"}</p>
                <p className="text-slate-500">
                  Diperiksa elektronik
                  {peminjaman.diperiksa_kembali_pada &&
                    ` · ${formatWaktu(peminjaman.diperiksa_kembali_pada)}`}
                </p>
              </div>
              <div className="rounded border border-slate-400 p-1.5">
                <p className="font-medium">
                  {peminjaman.disetujui_pengembalian_oleh ?? "-"}
                </p>
                <p>NIP. {peminjaman.disetujui_pengembalian_oleh_nip ?? "-"}</p>
                <p className="text-slate-500">
                  Disetujui elektronik
                  {peminjaman.disetujui_pengembalian_pada &&
                    ` · ${formatWaktu(peminjaman.disetujui_pengembalian_pada)}`}
                </p>
              </div>
              <div className="rounded border border-slate-400 p-1.5">
                <p className="font-medium">
                  {peminjaman.dikonfirmasi_oleh ?? "-"}
                </p>
                <p>NIP. {peminjaman.dikonfirmasi_oleh_nip ?? "-"}</p>
                <p className="text-slate-500">
                  Dikonfirmasi elektronik
                  {peminjaman.dikonfirmasi_pada &&
                    ` · ${formatWaktu(peminjaman.dikonfirmasi_pada)}`}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
