"use client";

import Link from "next/link";
import ChecklistDisplay from "@/components/ChecklistDisplay";
import { labelJumlahUnit } from "@/lib/peminjamanKolektif";

export type Pinjaman = {
  id: string;
  tanggal_pinjam: string;
  tanggal_rencana_kembali: string;
  keperluan: string | null;
  disetujui_oleh: string | null;
  alat: { nama_alat: string; tipe_alat: string | null } | null;
  profiles: { nama: string | null; email: string } | null;
};

type ChecklistRow = {
  peminjaman_id: string;
  jumlah_dibawa: number;
  kelengkapan_alat: { nama_bagian: string } | null;
};

export default function KembalikanList({
  data,
  checklistByPeminjaman,
  jumlahUnitMap,
}: {
  data: Pinjaman[];
  checklistByPeminjaman: Record<string, ChecklistRow[]>;
  jumlahUnitMap: Record<string, number>;
}) {
  if (data.length === 0) {
    return <p className="text-slate-400">Tidak ada alat yang sedang dipinjam.</p>;
  }

  return (
    <div className="space-y-3">
      {data.map((p) => (
        <div
          key={p.id}
          className="rounded-lg border border-slate-200 bg-white p-4"
        >
          <div>
            <p className="font-medium text-slate-900">
              {labelJumlahUnit(p.alat?.nama_alat ?? "-", jumlahUnitMap[p.id])}{" "}
              {p.alat?.tipe_alat && `(${p.alat.tipe_alat})`}
            </p>
            <p className="text-sm text-slate-500">
              Dipinjam oleh: {p.profiles?.nama || p.profiles?.email}
            </p>
            <p className="text-sm text-slate-500">
              Sejak: {p.tanggal_pinjam} &middot; Rencana kembali:{" "}
              {p.tanggal_rencana_kembali}
            </p>
            {p.disetujui_oleh && (
              <p className="text-sm text-slate-500">
                Disetujui oleh: {p.disetujui_oleh}
              </p>
            )}
            <ChecklistDisplay
              items={(checklistByPeminjaman[p.id] ?? []).map((c) => ({
                label: c.kelengkapan_alat?.nama_bagian ?? "-",
                jumlah: c.jumlah_dibawa,
              }))}
            />
          </div>

          <div className="mt-3 flex flex-col items-start gap-1">
            <Link
              href={`/surat/${p.id}`}
              target="_blank"
              className="text-sm text-blue-600 hover:underline"
            >
              Cetak Surat
            </Link>
            <Link
              href={`/surat-pengantar/${p.id}`}
              target="_blank"
              className="text-sm text-blue-600 hover:underline"
            >
              Cetak Surat Pengantar Barang
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
