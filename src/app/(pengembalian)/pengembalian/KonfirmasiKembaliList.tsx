"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { labelJumlahUnit } from "@/lib/peminjamanKolektif";

export type SiapDikembalikan = {
  id: string;
  tanggal_pinjam: string;
  tanggal_rencana_kembali: string;
  catatan_pengembalian: string | null;
  diperiksa_kembali_oleh: string | null;
  disetujui_pengembalian_oleh: string | null;
  alat: { nama_alat: string; tipe_alat: string | null } | null;
  profiles: { nama: string | null; email: string } | null;
};

export default function KonfirmasiKembaliList({
  data,
  jumlahUnitMap,
}: {
  data: SiapDikembalikan[];
  jumlahUnitMap: Record<string, number>;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleKembalikan(id: string) {
    if (
      !confirm(
        "Apakah Anda yakin peralatan ini sudah dikembalikan dengan lengkap dan sesuai?"
      )
    ) {
      return;
    }
    setError("");
    setLoadingId(id);
    const { data: updated, error: updateError } = await supabase
      .from("peminjaman")
      .update({
        status: "dikembalikan",
        tanggal_kembali_aktual: new Date().toISOString().split("T")[0],
      })
      .eq("id", id)
      .eq("status", "pengembalian_disetujui")
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
      <p className="text-slate-400">
        Tidak ada alat yang siap dikonfirmasi kembali.
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
            {p.diperiksa_kembali_oleh && (
              <p className="text-sm text-slate-500">
                Diperiksa oleh: {p.diperiksa_kembali_oleh}
              </p>
            )}
            {p.disetujui_pengembalian_oleh && (
              <p className="text-sm text-slate-500">
                Disetujui Pimpinan 2: {p.disetujui_pengembalian_oleh}
              </p>
            )}
            {p.catatan_pengembalian && (
              <p className="mt-1 text-sm text-slate-600">
                Hasil pemeriksaan: {p.catatan_pengembalian}
              </p>
            )}
          </div>

          <div className="mt-3">
            <Button
              onClick={() => handleKembalikan(p.id)}
              disabled={loadingId === p.id}
            >
              Konfirmasi Kembali
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
