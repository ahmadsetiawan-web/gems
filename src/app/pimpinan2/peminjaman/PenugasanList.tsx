"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
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

type Teknisi = { id: string; nama: string | null; email: string };

type ChecklistRow = {
  peminjaman_id: string;
  jumlah_dibawa: number;
  kelengkapan_alat: { nama_bagian: string } | null;
};

export default function PenugasanList({
  data,
  teknisiList,
  checklistByPeminjaman,
  jumlahUnitMap,
}: {
  data: Pengajuan[];
  teknisiList: Teknisi[];
  checklistByPeminjaman: Record<string, ChecklistRow[]>;
  jumlahUnitMap: Record<string, number>;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [pilihan, setPilihan] = useState<Record<string, string>>(() =>
    Object.fromEntries(data.map((p) => [p.id, teknisiList[0]?.id ?? ""]))
  );

  async function handleTugaskan(id: string) {
    const teknisiId = pilihan[id];
    if (!teknisiId) return;
    setLoadingId(id);
    await supabase
      .from("peminjaman")
      .update({ status: "ditugaskan", ditugaskan_ke: teknisiId })
      .eq("id", id);
    setLoadingId(null);
    router.refresh();
  }

  if (data.length === 0) {
    return (
      <p className="text-slate-400">
        Tidak ada pengajuan yang menunggu penugasan.
      </p>
    );
  }

  if (teknisiList.length === 0) {
    return (
      <p className="text-amber-600">
        Belum ada akun Teknisi terdaftar. Tambahkan lewat Kelola Pengguna
        dulu.
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
            <ChecklistDisplay
              items={(checklistByPeminjaman[p.id] ?? []).map((c) => ({
                label: c.kelengkapan_alat?.nama_bagian ?? "-",
                jumlah: c.jumlah_dibawa,
              }))}
            />
            <Link
              href={`/surat-persetujuan/${p.id}`}
              target="_blank"
              className="mt-1 inline-block text-sm text-blue-600 hover:underline"
            >
              Cetak Surat Persetujuan
            </Link>
          </div>

          <div className="mt-3 flex items-end gap-3">
            <div className="flex-1">
              <Select
                label="Tunjuk Teknisi"
                value={pilihan[p.id] ?? ""}
                onChange={(e) =>
                  setPilihan((prev) => ({ ...prev, [p.id]: e.target.value }))
                }
              >
                {teknisiList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nama || t.email}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              onClick={() => handleTugaskan(p.id)}
              disabled={loadingId === p.id}
            >
              Tugaskan
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
