import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import KopSurat from "@/components/KopSurat";
import PrintButton from "./PrintButton";

type PengantarDetail = {
  id: string;
  nomor_surat: string | null;
  tanggal_pinjam: string;
  keperluan: string | null;
  disetujui2_oleh: string | null;
  disetujui2_oleh_nip: string | null;
  disetujui2_pada: string | null;
  alat: {
    id_alat: string;
    nama_alat: string;
    tipe_alat: string | null;
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

export default async function SuratPengantarPage(
  props: PageProps<"/surat-pengantar/[id]">
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
      "id, nomor_surat, tanggal_pinjam, keperluan, disetujui2_oleh, disetujui2_oleh_nip, disetujui2_pada, alat(id_alat, nama_alat, tipe_alat, no_inventaris)"
    )
    .eq("id", id)
    .single()) as { data: PengantarDetail | null };

  if (!peminjaman) notFound();

  const { data: pimpinan2 } = await supabase
    .from("profiles")
    .select("nama, nip")
    .eq("is_pimpinan2", true)
    .limit(1)
    .maybeSingle();

  const pimpinan2Nip = peminjaman.disetujui2_oleh_nip ?? pimpinan2?.nip;
  const { data: pegawaiPimpinan2 } = pimpinan2Nip
    ? await supabase
        .from("pegawai")
        .select("jabatan_struktural")
        .eq("nip", pimpinan2Nip)
        .single()
    : { data: null };
  const jabatanPimpinan2 = pegawaiPimpinan2?.jabatan_struktural || null;

  type UnitTambahan = {
    alat: {
      id_alat: string;
      nama_alat: string;
      tipe_alat: string | null;
      no_inventaris: string | null;
    } | null;
  };

  const { data: unitTambahanRaw } = (await supabase
    .from("peminjaman_unit_tambahan")
    .select("alat(id_alat, nama_alat, tipe_alat, no_inventaris)")
    .eq("peminjaman_id", id)) as { data: UnitTambahan[] | null };

  const unitTambahan = unitTambahanRaw ?? [];
  const semuaUnit = [peminjaman.alat, ...unitTambahan.map((u) => u.alat)];

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
            Surat belum bisa dicetak — dokumen ini baru terbentuk setelah
            barang resmi dipinjamkan (disetujui Pimpinan 2).
          </div>
        ) : (
          <div className="border border-slate-900 bg-white text-xs">
            <KopSurat />
            <div className="border-b border-slate-900 p-1.5 text-center font-bold">
              SURAT PENGANTAR BARANG
            </div>
            <div className="border-b border-slate-900 p-1.5 text-center text-slate-500">
              Referensi Surat Peminjaman: {peminjaman.nomor_surat}
            </div>

            <div className="border-b border-slate-900 p-3">
              Yang bertanda tangan dibawah ini Penanggungjawab Kegiatan
              Pengelolaan Sarana Penyelidikan, Pusat Survei Geologi
              menerangkan bahwa barang-barang tersebut di bawah ini :
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
                  <th className="border-r border-slate-900 px-2 py-0.5 text-left">
                    No. Inventaris
                  </th>
                  <th className="border-r border-slate-900 px-2 py-0.5 text-left">
                    Jumlah
                  </th>
                  <th className="px-2 py-0.5 text-left">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {semuaUnit.map((u, i) => (
                  <tr key={u?.id_alat ?? i} className="border-b border-slate-900">
                    <td className="border-r border-slate-900 px-2 py-0.5">
                      {i + 1}
                    </td>
                    <td className="border-r border-slate-900 px-2 py-0.5">
                      {u?.nama_alat ?? "-"}
                    </td>
                    <td className="border-r border-slate-900 px-2 py-0.5">
                      {u?.no_inventaris ?? "-"}
                    </td>
                    <td className="border-r border-slate-900 px-2 py-0.5">1</td>
                    <td className="px-2 py-0.5">{u?.tipe_alat ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-b border-slate-900 p-3">
              Adalah barang-barang inventaris Pusat Survei Geologi yang akan
              dipergunakan untuk keperluan {peminjaman.keperluan ?? "-"}.
            </div>

            <div className="break-inside-avoid-page p-3">
              <p>
                Demikian surat pengantar barang ini, agar yang berkepentingan
                harap maklum.
              </p>

              <div className="mt-4 flex justify-end">
                <div className="w-56 text-center">
                  <p>
                    Bandung,{" "}
                    {formatWaktu(peminjaman.disetujui2_pada) ??
                      "...................................."}
                  </p>
                  {jabatanPimpinan2 && <p>{jabatanPimpinan2}</p>}
                  <div className="mt-4 rounded border border-slate-400 p-1.5">
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
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
