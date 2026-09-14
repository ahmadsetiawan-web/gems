"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Alert from "@/components/ui/Alert";

export type PengajuanOrganik = {
  id: string;
  tanggal_pinjam: string;
  tanggal_rencana_kembali: string;
  jumlah_diambil: number;
  keperluan: string | null;
  alat_organik: { nama_alat: string; merek: string | null } | null;
  profiles: { nama: string | null; email: string } | null;
};

type Teknisi = { id: string; nama: string | null; email: string };

export default function PenugasanOrganikList({
  data,
  teknisiList,
}: {
  data: PengajuanOrganik[];
  teknisiList: Teknisi[];
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
      .from("peminjaman_organik")
      .update({ status: "ditugaskan", ditugaskan_ke: teknisiId })
      .eq("id", id)
      .eq("status", "disetujui")
      .select("id");
    setLoadingId(null);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    if (!updated || updated.length === 0) {
      setError(
        "Pengajuan ini sudah diproses duluan (mis. oleh sesi lain), halaman dimuat ulang."
      );
    }
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
      {error && <Alert variant="error">{error}</Alert>}
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
