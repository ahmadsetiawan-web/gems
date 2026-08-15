"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import ChecklistDisplay from "@/components/ChecklistDisplay";
import { labelJumlahUnit } from "@/lib/peminjamanKolektif";

export type Pengajuan = {
  id: string;
  tanggal_pinjam: string;
  tanggal_rencana_kembali: string;
  keperluan: string | null;
  alat: { nama_alat: string; tipe_alat: string | null } | null;
  profiles: { nama: string | null; email: string } | null;
};

type ChecklistRow = {
  peminjaman_id: string;
  jumlah_dibawa: number;
  kelengkapan_alat: { nama_bagian: string } | null;
};

const DEFAULT_CATATAN = "Pergunakan peralatan survei dengan baik dan semestinya.";

export default function PersetujuanList({
  data,
  checklistByPeminjaman,
  jumlahUnitMap,
}: {
  data: Pengajuan[];
  checklistByPeminjaman: Record<string, ChecklistRow[]>;
  jumlahUnitMap: Record<string, number>;
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

  async function handleApprove(id: string) {
    if (!confirm("Apakah Anda yakin ingin menyetujui pengajuan peminjaman ini?")) {
      return;
    }
    setLoadingId(id);
    await supabase
      .from("peminjaman")
      .update({
        status: "disetujui",
        catatan_pimpinan: getCatatan(id).trim() || null,
      })
      .eq("id", id);
    setLoadingId(null);
    router.refresh();
  }

  async function handleReject(id: string) {
    if (!confirm("Apakah Anda yakin ingin menolak pengajuan peminjaman ini?")) {
      return;
    }
    setLoadingId(id);
    await supabase
      .from("peminjaman")
      .update({
        status: "ditolak",
        catatan_pimpinan: getCatatan(id).trim() || null,
      })
      .eq("id", id);
    setLoadingId(null);
    router.refresh();
  }

  if (data.length === 0) {
    return (
      <p className="text-slate-400">Tidak ada pengajuan yang menunggu.</p>
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
              {labelJumlahUnit(p.alat?.nama_alat ?? "-", jumlahUnitMap[p.id])}{" "}
              {p.alat?.tipe_alat && `(${p.alat.tipe_alat})`}
            </p>
            <p className="text-sm text-slate-500">
              Diajukan oleh: {p.profiles?.nama || p.profiles?.email}
            </p>
            <p className="text-sm text-slate-500">
              Rencana kembali: {p.tanggal_rencana_kembali}
            </p>
            {p.keperluan && (
              <p className="mt-1 text-sm text-slate-600">
                Keperluan: {p.keperluan}
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
              Keterangan
            </label>
            <textarea
              value={getCatatan(p.id)}
              onChange={(e) =>
                setCatatan((prev) => ({ ...prev, [p.id]: e.target.value }))
              }
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#d1cb23] focus:outline-none focus:ring-2 focus:ring-[#F6EE29]/40"
            />
          </div>

          <div className="mt-3 flex gap-2">
            <Button
              onClick={() => handleApprove(p.id)}
              disabled={loadingId === p.id}
            >
              Setujui
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleReject(p.id)}
              disabled={loadingId === p.id}
            >
              Tolak
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
