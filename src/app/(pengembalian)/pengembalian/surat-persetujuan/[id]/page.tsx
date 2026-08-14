import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import KopSurat from "@/components/KopSurat";
import PrintButton from "./PrintButton";

type PersetujuanDetail = {
  id: string;
  tanggal_pinjam: string;
  tanggal_rencana_kembali: string;
  keperluan: string | null;
  status: string;
  diajukan_pada: string | null;
  disetujui_oleh: string | null;
  disetujui_oleh_nip: string | null;
  disetujui_pada: string | null;
  alat: { nama_alat: string; tipe_alat: string | null; kode_alat: string | null } | null;
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

export default async function SuratPersetujuanPage(
  props: PageProps<"/pengembalian/surat-persetujuan/[id]">
) {
  const { id } = await props.params;

  const supabase = await createClient();

  const { data: peminjaman } = (await supabase
    .from("peminjaman")
    .select(
      "id, tanggal_pinjam, tanggal_rencana_kembali, keperluan, status, diajukan_pada, disetujui_oleh, disetujui_oleh_nip, disetujui_pada, alat(nama_alat, tipe_alat, kode_alat), profiles!peminjam_id(nama, nip)"
    )
    .eq("id", id)
    .single()) as { data: PersetujuanDetail | null };

  if (!peminjaman) notFound();

  const sudahDisetujui =
    !!peminjaman.disetujui_oleh && peminjaman.status !== "ditolak";

  const { data: pegawai } = peminjaman.profiles?.nip
    ? await supabase
        .from("pegawai")
        .select("tim_kerja")
        .eq("nip", peminjaman.profiles.nip)
        .single()
    : { data: null };

  const { data: pegawaiPimpinan1 } = peminjaman.disetujui_oleh_nip
    ? await supabase
        .from("pegawai")
        .select("jabatan_struktural")
        .eq("nip", peminjaman.disetujui_oleh_nip)
        .single()
    : { data: null };
  const jabatanPimpinan1 = pegawaiPimpinan1?.jabatan_struktural || null;

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <div className="no-print">
        <Navbar />
      </div>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="no-print mb-4 flex justify-end">
          <PrintButton />
        </div>

        {!sudahDisetujui ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Surat belum bisa dicetak — dokumen ini baru terbentuk otomatis
            setelah pengajuan ini disetujui Pimpinan 1.
          </div>
        ) : (
          <div className="border border-slate-900 bg-white text-xs">
            <KopSurat />
            <div className="border-b border-slate-900 p-1.5 text-center font-bold">
              DATA SURAT PERSETUJUAN PEMINJAMAN
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
                <span className="text-slate-500">Nama Alat</span>
                <p className="font-medium">{peminjaman.alat?.nama_alat ?? "-"}</p>
              </div>
              <div>
                <span className="text-slate-500">Tipe Alat</span>
                <p className="font-medium">{peminjaman.alat?.tipe_alat ?? "-"}</p>
              </div>
              <div>
                <span className="text-slate-500">Kode Alat</span>
                <p className="font-medium">{peminjaman.alat?.kode_alat ?? "-"}</p>
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

            <div className="break-inside-avoid-page grid grid-cols-2 gap-x-4 gap-y-2 p-3">
              <div>
                <p>Mengetahui / Menyetujui :</p>
                {jabatanPimpinan1 && <p>{jabatanPimpinan1}</p>}
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
                  {peminjaman.disetujui_oleh ?? "-"}
                </p>
                <p>NIP. {peminjaman.disetujui_oleh_nip ?? "-"}</p>
                <p className="text-slate-500">
                  Disetujui elektronik
                  {peminjaman.disetujui_pada &&
                    ` · ${formatWaktu(peminjaman.disetujui_pada)}`}
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
        )}
      </main>
    </div>
  );
}
