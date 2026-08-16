"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export type RiwayatOrganikRow = {
  id: string;
  tanggal_pinjam: string;
  tanggal_rencana_kembali: string;
  tanggal_kembali_aktual: string | null;
  jumlah_diambil: number;
  status: string;
  catatan_pimpinan: string | null;
  catatan_pengembalian: string | null;
  disetujui_oleh: string | null;
  alat_organik: { nama_alat: string; merek: string | null } | null;
  profiles: { nama: string | null; email: string } | null;
};

const statusLabel: Record<string, string> = {
  dikembalikan: "Dikembalikan",
  ditolak: "Ditolak",
};

const statusStyle: Record<string, string> = {
  dikembalikan: "bg-green-100 text-green-800",
  ditolak: "bg-red-100 text-red-700",
};

export default function RiwayatOrganikList({
  data,
}: {
  data: RiwayatOrganikRow[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string, namaAlat: string) {
    if (
      !confirm(
        `Hapus riwayat peminjaman "${namaAlat}" ini? Tindakan ini tidak bisa dibatalkan.`
      )
    ) {
      return;
    }

    setDeletingId(id);
    await supabase.from("peminjaman_organik").delete().eq("id", id);
    setDeletingId(null);
    router.refresh();
  }

  if (data.length === 0) {
    return <p className="text-slate-400">Belum ada riwayat.</p>;
  }

  return (
    <div className="space-y-2">
      {data.map((r) => (
        <div
          key={r.id}
          className="rounded-lg border border-slate-200 bg-white p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-slate-900">
                {r.alat_organik?.nama_alat ?? "-"}{" "}
                {r.alat_organik?.merek && `(${r.alat_organik.merek})`}
                {" "}&middot; Jumlah: {r.jumlah_diambil}
              </p>
              <p className="text-sm text-slate-500">
                Peminjam: {r.profiles?.nama || r.profiles?.email}
              </p>
              <p className="text-sm text-slate-500">
                Pinjam: {r.tanggal_pinjam} &middot; Rencana kembali:{" "}
                {r.tanggal_rencana_kembali}
                {r.tanggal_kembali_aktual &&
                  ` · Dikembalikan: ${r.tanggal_kembali_aktual}`}
              </p>
              {r.disetujui_oleh && (
                <p className="text-sm text-slate-500">
                  {r.status === "ditolak" ? "Ditolak oleh" : "Disetujui oleh"}:{" "}
                  {r.disetujui_oleh}
                </p>
              )}
              {r.catatan_pimpinan && (
                <p className="mt-1 text-sm text-slate-600">
                  Catatan pimpinan: {r.catatan_pimpinan}
                </p>
              )}
              {r.catatan_pengembalian && (
                <p className="mt-1 text-sm text-slate-600">
                  Catatan pemeriksaan: {r.catatan_pengembalian}
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  statusStyle[r.status] ?? "bg-slate-100 text-slate-700"
                }`}
              >
                {statusLabel[r.status] ?? r.status}
              </span>
              {r.status === "dikembalikan" && (
                <>
                  <Link
                    href={`/surat-persetujuan-organik/${r.id}`}
                    target="_blank"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Cetak Surat Persetujuan
                  </Link>
                  <Link
                    href={`/surat-organik/${r.id}`}
                    target="_blank"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Cetak Surat Peminjaman
                  </Link>
                  <Link
                    href={`/surat-pengembalian-organik/${r.id}`}
                    target="_blank"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Cetak Surat Pengembalian
                  </Link>
                </>
              )}
              <button
                type="button"
                onClick={() => handleDelete(r.id, r.alat_organik?.nama_alat ?? "-")}
                disabled={deletingId === r.id}
                className="text-sm text-red-600 hover:underline disabled:opacity-50"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
