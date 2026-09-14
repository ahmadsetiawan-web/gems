"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Alert from "@/components/ui/Alert";
import { labelJumlahUnit } from "@/lib/peminjamanKolektif";

export type Pinjaman = {
  id: string;
  tanggal_pinjam: string;
  tanggal_rencana_kembali: string;
  alat: { nama_alat: string; tipe_alat: string | null } | null;
  profiles: { nama: string | null; email: string } | null;
};

type Teknisi = { id: string; nama: string | null; email: string };

export default function PenugasanPengembalianList({
  data,
  teknisiList,
  jumlahUnitMap,
}: {
  data: Pinjaman[];
  teknisiList: Teknisi[];
  jumlahUnitMap: Record<string, number>;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pilihan, setPilihan] = useState<Record<string, string>>(() =>
    Object.fromEntries(data.map((p) => [p.id, teknisiList[0]?.id ?? ""]))
  );

  async function handleTugaskan(id: string) {
    const teknisiId = pilihan[id];
    if (!teknisiId) return;
    setError("");
    setLoadingId(id);
    const { data: updated, error: updateError } = await supabase
      .from("peminjaman")
      .update({ status: "pengembalian_ditugaskan", ditugaskan_ke: teknisiId })
      .eq("id", id)
      .eq("status", "dipinjam")
      .select("id");
    setLoadingId(null);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    if (!updated || updated.length === 0) {
      setError(
        "Peminjaman ini sudah diproses duluan (mis. oleh sesi lain), halaman dimuat ulang."
      );
    }
    router.refresh();
  }

  if (data.length === 0) {
    return (
      <p className="text-slate-400">Tidak ada alat yang sedang dipinjam.</p>
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
      {error && <Alert variant="error">{error}</Alert>}
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
              Tugaskan Cek Pengembalian
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
