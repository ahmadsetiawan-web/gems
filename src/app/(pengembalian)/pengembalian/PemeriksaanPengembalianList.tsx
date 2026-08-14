"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import ChecklistDisplay from "@/components/ChecklistDisplay";

export type TugasPengembalian = {
  id: string;
  tanggal_pinjam: string;
  tanggal_rencana_kembali: string;
  catatan_pimpinan2: string | null;
  alat: { nama_alat: string; tipe_alat: string | null } | null;
  profiles: { nama: string | null; email: string } | null;
};

type ChecklistRow = {
  peminjaman_id: string;
  jumlah_dibawa: number;
  kelengkapan_alat: { nama_bagian: string } | null;
};

const DEFAULT_CATATAN = "Alat diperiksa dan dalam kondisi baik.";

export default function PemeriksaanPengembalianList({
  data,
  checklistByPeminjaman,
}: {
  data: TugasPengembalian[];
  checklistByPeminjaman: Record<string, ChecklistRow[]>;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [catatan, setCatatan] = useState<Record<string, string>>(() =>
    Object.fromEntries(data.map((p) => [p.id, DEFAULT_CATATAN]))
  );

  function getCatatan(id: string) {
    return catatan[id] ?? DEFAULT_CATATAN;
  }

  async function handleSelesai(id: string) {
    setLoadingId(id);
    await supabase
      .from("peminjaman")
      .update({
        status: "pengembalian_diperiksa",
        catatan_pengembalian: getCatatan(id).trim() || null,
      })
      .eq("id", id);
    setLoadingId(null);
    router.refresh();
  }

  if (data.length === 0) {
    return (
      <p className="text-slate-400">
        Tidak ada tugas pemeriksaan pengembalian untuk kamu saat ini.
      </p>
    );
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
              {p.alat?.nama_alat ?? "-"}{" "}
              {p.alat?.tipe_alat && `(${p.alat.tipe_alat})`}
            </p>
            <p className="text-sm text-slate-500">
              Dipinjam oleh: {p.profiles?.nama || p.profiles?.email}
            </p>
            <p className="text-sm text-slate-500">
              Sejak: {p.tanggal_pinjam} &middot; Rencana kembali:{" "}
              {p.tanggal_rencana_kembali}
            </p>
            {p.catatan_pimpinan2 && (
              <p className="mt-1 text-sm text-amber-700">
                Diminta cek ulang oleh Pimpinan 2: {p.catatan_pimpinan2}
              </p>
            )}
            <ChecklistDisplay
              items={(checklistByPeminjaman[p.id] ?? []).map((c) => ({
                label: c.kelengkapan_alat?.nama_bagian ?? "-",
                jumlah: c.jumlah_dibawa,
              }))}
            />
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium text-slate-700">
              Catatan Pemeriksaan (kondisi alat saat dikembalikan)
            </label>
            <p className="mb-1 text-xs text-slate-400">
              Catat kalau ada kerusakan atau kelengkapan yang tidak sesuai —
              ini jadi catatan penting untuk kantor.
            </p>
            <textarea
              value={getCatatan(p.id)}
              onChange={(e) =>
                setCatatan((prev) => ({ ...prev, [p.id]: e.target.value }))
              }
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#d1cb23] focus:outline-none focus:ring-2 focus:ring-[#F6EE29]/40"
            />
          </div>

          <div className="mt-3">
            <Button
              onClick={() => handleSelesai(p.id)}
              disabled={loadingId === p.id}
            >
              Selesai Diperiksa
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
