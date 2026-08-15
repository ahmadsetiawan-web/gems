"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { labelJumlahUnit } from "@/lib/peminjamanKolektif";

export type Penugasan = {
  id: string;
  id_alat: string;
  tanggal_pinjam: string;
  tanggal_rencana_kembali: string;
  keperluan: string | null;
  catatan_pimpinan2: string | null;
  alat: { nama_alat: string; tipe_alat: string | null } | null;
  profiles: { nama: string | null; email: string } | null;
};

type ChecklistRow = {
  peminjaman_id: string;
  kelengkapan_id: string;
  jumlah_dibawa: number;
  kelengkapan_alat: { nama_bagian: string } | null;
};

type KelengkapanItem = {
  id: string;
  id_alat: string;
  nama_bagian: string;
  no_inventaris: string | null;
  kategori: string | null;
  jumlah_standar: number;
};

type ChecklistState = Record<string, { checked: boolean; jumlah: string }>;

const DEFAULT_CATATAN = "Alat sudah dicek, lengkap dan siap dipinjamkan.";

export default function PemeriksaanList({
  data,
  checklistByPeminjaman,
  kelengkapanByAlat,
  jumlahUnitMap,
}: {
  data: Penugasan[];
  checklistByPeminjaman: Record<string, ChecklistRow[]>;
  kelengkapanByAlat: Record<string, KelengkapanItem[]>;
  jumlahUnitMap: Record<string, number>;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [catatan, setCatatan] = useState<Record<string, string>>(() =>
    Object.fromEntries(data.map((p) => [p.id, DEFAULT_CATATAN]))
  );
  const [checklists, setChecklists] = useState<Record<string, ChecklistState>>(
    () =>
      Object.fromEntries(
        data.map((p) => {
          const kelengkapan = kelengkapanByAlat[p.id_alat] ?? [];
          const dibawa = new Map(
            (checklistByPeminjaman[p.id] ?? []).map((c) => [
              c.kelengkapan_id,
              c.jumlah_dibawa,
            ])
          );
          const state: ChecklistState = Object.fromEntries(
            kelengkapan.map((k) => [
              k.id,
              dibawa.has(k.id)
                ? { checked: true, jumlah: String(dibawa.get(k.id)) }
                : { checked: false, jumlah: String(k.jumlah_standar) },
            ])
          );
          return [p.id, state];
        })
      )
  );

  function getCatatan(id: string) {
    return catatan[id] ?? DEFAULT_CATATAN;
  }

  function toggleChecked(peminjamanId: string, kelengkapanId: string) {
    setChecklists((prev) => ({
      ...prev,
      [peminjamanId]: {
        ...prev[peminjamanId],
        [kelengkapanId]: {
          ...prev[peminjamanId][kelengkapanId],
          checked: !prev[peminjamanId][kelengkapanId].checked,
        },
      },
    }));
  }

  function setJumlah(peminjamanId: string, kelengkapanId: string, jumlah: string) {
    setChecklists((prev) => ({
      ...prev,
      [peminjamanId]: {
        ...prev[peminjamanId],
        [kelengkapanId]: { ...prev[peminjamanId][kelengkapanId], jumlah },
      },
    }));
  }

  async function handleSelesai(id: string) {
    setLoadingId(id);

    const { error: deleteError } = await supabase
      .from("peminjaman_kelengkapan")
      .delete()
      .eq("peminjaman_id", id);

    if (deleteError) {
      setLoadingId(null);
      alert(deleteError.message);
      return;
    }

    const dipilih = Object.entries(checklists[id] ?? {})
      .filter(([, v]) => v.checked)
      .map(([kelengkapanId, v]) => ({
        peminjaman_id: id,
        kelengkapan_id: kelengkapanId,
        jumlah_dibawa: parseInt(v.jumlah, 10) || 0,
      }));

    if (dipilih.length > 0) {
      const { error: insertError } = await supabase
        .from("peminjaman_kelengkapan")
        .insert(dipilih);

      if (insertError) {
        setLoadingId(null);
        alert(insertError.message);
        return;
      }
    }

    await supabase
      .from("peminjaman")
      .update({
        status: "diperiksa",
        catatan_pemeriksaan_teknisi: getCatatan(id).trim() || null,
      })
      .eq("id", id);

    setLoadingId(null);
    router.refresh();
  }

  if (data.length === 0) {
    return (
      <p className="text-slate-400">
        Tidak ada tugas pemeriksaan alat untuk kamu saat ini.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((p) => {
        const kelengkapan = kelengkapanByAlat[p.id_alat] ?? [];
        const state = checklists[p.id] ?? {};

        return (
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

            {kelengkapan.length > 0 && (
              <div className="mt-3 border-t border-slate-200 pt-3">
                <p className="mb-1 text-sm font-medium text-slate-700">
                  Rincian Kelengkapan
                </p>
                <p className="mb-2 text-xs text-slate-400">
                  Sesuaikan centang & jumlah kalau ada yang perlu diperbaiki.
                </p>
                <div className="space-y-2">
                  {kelengkapan.map((k) => {
                    const item = state[k.id] ?? { checked: false, jumlah: "0" };
                    return (
                      <div
                        key={k.id}
                        className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2"
                      >
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => toggleChecked(p.id, k.id)}
                          className="h-4 w-4 shrink-0 rounded border-slate-300 accent-[#F6EE29]"
                        />
                        <div className="flex-1 text-sm">
                          <p className="text-slate-800">{k.nama_bagian}</p>
                          {k.kategori && (
                            <p className="text-xs text-slate-400">
                              {k.kategori}
                            </p>
                          )}
                        </div>
                        <input
                          type="number"
                          min={0}
                          value={item.jumlah}
                          disabled={!item.checked}
                          onChange={(e) =>
                            setJumlah(p.id, k.id, e.target.value)
                          }
                          className="w-20 shrink-0 rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-900 disabled:bg-slate-50 disabled:text-slate-400"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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

            <div className="mt-3 flex items-center gap-4">
              <Button
                onClick={() => handleSelesai(p.id)}
                disabled={loadingId === p.id}
              >
                Selesai Diperiksa
              </Button>
              <Link
                href={`/surat/${p.id}`}
                target="_blank"
                className="text-sm text-blue-600 hover:underline"
              >
                Cetak Surat
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
