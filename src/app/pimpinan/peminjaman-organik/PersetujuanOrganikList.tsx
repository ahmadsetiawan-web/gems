"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
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

const DEFAULT_CATATAN = "Pergunakan peralatan dengan baik dan semestinya.";

export default function PersetujuanOrganikList({
  data,
}: {
  data: PengajuanOrganik[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [catatan, setCatatan] = useState<Record<string, string>>(() =>
    Object.fromEntries(data.map((p) => [p.id, DEFAULT_CATATAN]))
  );

  function getCatatan(id: string) {
    return catatan[id] ?? DEFAULT_CATATAN;
  }

  async function ubahStatus(
    id: string,
    payload: { status: string; catatan_pimpinan: string | null }
  ) {
    setError("");
    setLoadingId(id);
    const { data: updated, error: updateError } = await supabase
      .from("peminjaman_organik")
      .update(payload)
      .eq("id", id)
      .eq("status", "diajukan")
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

  async function handleApprove(id: string) {
    if (!confirm("Apakah Anda yakin ingin menyetujui pengajuan peminjaman ini?")) {
      return;
    }
    await ubahStatus(id, {
      status: "disetujui",
      catatan_pimpinan: getCatatan(id).trim() || null,
    });
  }

  async function handleReject(id: string) {
    if (!confirm("Apakah Anda yakin ingin menolak pengajuan peminjaman ini?")) {
      return;
    }
    await ubahStatus(id, {
      status: "ditolak",
      catatan_pimpinan: getCatatan(id).trim() || null,
    });
  }

  if (data.length === 0) {
    return (
      <p className="text-slate-400">Tidak ada pengajuan yang menunggu.</p>
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
