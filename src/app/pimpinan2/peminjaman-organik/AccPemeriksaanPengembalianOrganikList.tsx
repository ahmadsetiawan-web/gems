"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";

export type PemeriksaanPengembalianOrganik = {
  id: string;
  tanggal_pinjam: string;
  tanggal_rencana_kembali: string;
  jumlah_diambil: number;
  catatan_pengembalian: string | null;
  diperiksa_kembali_oleh: string | null;
  alat_organik: { nama_alat: string; merek: string | null } | null;
  profiles: { nama: string | null; email: string } | null;
};

export default function AccPemeriksaanPengembalianOrganikList({
  data,
}: {
  data: PemeriksaanPengembalianOrganik[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [catatan, setCatatan] = useState<Record<string, string>>({});

  async function handleAcc(id: string) {
    setLoadingId(id);
    await supabase
      .from("peminjaman_organik")
      .update({ status: "pengembalian_disetujui", catatan_pimpinan2: null })
      .eq("id", id);
    setLoadingId(null);
    router.refresh();
  }

  async function handleTolak(id: string) {
    const note = (catatan[id] ?? "").trim();
    if (!note) {
      alert("Isi dulu alasan/catatan minta cek ulang.");
      return;
    }
    setLoadingId(id);
    await supabase
      .from("peminjaman_organik")
      .update({ status: "pengembalian_ditugaskan", catatan_pimpinan2: note })
      .eq("id", id);
    setLoadingId(null);
    router.refresh();
  }

  if (data.length === 0) {
    return (
      <p className="text-slate-400">
        Tidak ada hasil pemeriksaan pengembalian yang menunggu persetujuan.
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
              {p.alat_organik?.nama_alat ?? "-"}{" "}
              {p.alat_organik?.merek && `(${p.alat_organik.merek})`}
              {" "}&middot; Jumlah: {p.jumlah_diambil}
            </p>
            <p className="text-sm text-slate-500">
              Dipinjam oleh: {p.profiles?.nama || p.profiles?.email}
            </p>
            {p.diperiksa_kembali_oleh && (
              <p className="text-sm text-slate-500">
                Diperiksa oleh: {p.diperiksa_kembali_oleh}
              </p>
            )}
            {p.catatan_pengembalian && (
              <p className="mt-1 text-sm text-slate-600">
                Hasil pemeriksaan: {p.catatan_pengembalian}
              </p>
            )}
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium text-slate-700">
              Catatan (wajib diisi kalau minta cek ulang)
            </label>
            <textarea
              value={catatan[p.id] ?? ""}
              onChange={(e) =>
                setCatatan((prev) => ({ ...prev, [p.id]: e.target.value }))
              }
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#d1cb23] focus:outline-none focus:ring-2 focus:ring-[#F6EE29]/40"
            />
          </div>

          <div className="mt-3 flex gap-2">
            <Button onClick={() => handleAcc(p.id)} disabled={loadingId === p.id}>
              Setujui
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleTolak(p.id)}
              disabled={loadingId === p.id}
            >
              Minta Cek Ulang
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
