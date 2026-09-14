"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";

export type PenugasanOrganik = {
  id: string;
  tanggal_pinjam: string;
  tanggal_rencana_kembali: string;
  jumlah_diambil: number;
  keperluan: string | null;
  catatan_pimpinan2: string | null;
  alat_organik: { nama_alat: string; merek: string | null } | null;
  profiles: { nama: string | null; email: string } | null;
};

const DEFAULT_CATATAN = "Alat sudah dicek, lengkap dan siap dipinjamkan.";

export default function PemeriksaanOrganikList({
  data,
}: {
  data: PenugasanOrganik[];
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
    const { data: updated, error: updateError } = await supabase
      .from("peminjaman_organik")
      .update({
        status: "diperiksa",
        catatan_pemeriksaan_teknisi: getCatatan(id).trim() || null,
      })
      .eq("id", id)
      .eq("status", "ditugaskan")
      .select("id");
    setLoadingId(null);

    if (updateError) {
      alert(updateError.message);
      return;
    }
    if (!updated || updated.length === 0) {
      alert(
        "Tugas ini sudah diproses duluan (mis. oleh sesi lain), halaman dimuat ulang."
      );
    }
    router.refresh();
  }

  if (data.length === 0) {
    return (
      <p className="text-slate-400">
        Tidak ada tugas pemeriksaan alat yang ditugaskan ke akunmu saat ini.
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
              Peminjam: {p.profiles?.nama || p.profiles?.email}
            </p>
            <p className="text-sm text-slate-500">
              Rencana kembali: {p.tanggal_rencana_kembali}
            </p>
            {p.keperluan && (
              <p className="mt-1 text-sm text-slate-600">
                Keperluan: {p.keperluan}
              </p>
            )}
            {p.catatan_pimpinan2 && (
              <p className="mt-1 text-sm text-amber-700">
                Diminta cek ulang oleh Pimpinan 2: {p.catatan_pimpinan2}
              </p>
            )}
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium text-slate-700">
              Catatan Hasil Pemeriksaan
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
