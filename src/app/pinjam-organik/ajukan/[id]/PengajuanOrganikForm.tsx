"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

type AlatOrganik = {
  id: string;
  nama_alat: string;
  merek: string | null;
  kondisi_alat: string;
  jumlah_tersedia: number;
};

type Draft = {
  id: string;
  jumlah_diambil: number;
  tanggal_rencana_kembali: string;
  keperluan: string | null;
};

export default function PengajuanOrganikForm({
  alat,
  draft,
}: {
  alat: AlatOrganik;
  draft: Draft | null;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [jumlah, setJumlah] = useState(
    draft ? String(draft.jumlah_diambil) : "1"
  );
  const [tanggalKembali, setTanggalKembali] = useState(
    draft?.tanggal_rencana_kembali ?? ""
  );
  const [keperluan, setKeperluan] = useState(draft?.keperluan ?? "");
  const [draftId, setDraftId] = useState<string | null>(draft?.id ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const bisaPinjam = alat.jumlah_tersedia > 0 && alat.kondisi_alat === "Baik";

  async function simpan(finalize: boolean, e?: FormEvent) {
    e?.preventDefault();
    setError("");

    const jumlahInt = parseInt(jumlah, 10) || 0;
    if (jumlahInt < 1) {
      setError("Jumlah minimal 1.");
      return;
    }
    if (jumlahInt > alat.jumlah_tersedia) {
      setError(`Jumlah tersedia cuma ${alat.jumlah_tersedia}.`);
      return;
    }
    if (!tanggalKembali) {
      setError("Tanggal rencana kembali wajib diisi.");
      return;
    }

    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Sesi login habis, silakan login ulang.");
      setSubmitting(false);
      return;
    }

    const payload = {
      jumlah_diambil: jumlahInt,
      tanggal_rencana_kembali: tanggalKembali,
      keperluan: keperluan.trim() || null,
    };

    if (!draftId) {
      const { data: pengajuan, error: insertError } = await supabase
        .from("peminjaman_organik")
        .insert({
          id_alat_organik: alat.id,
          peminjam_id: user.id,
          status: "draft",
          ...payload,
        })
        .select("id")
        .single();

      setSubmitting(false);

      if (insertError || !pengajuan) {
        setError(insertError?.message ?? "Gagal menyimpan draft.");
        return;
      }

      setDraftId(pengajuan.id);
      return;
    }

    const { error: updateError } = await supabase
      .from("peminjaman_organik")
      .update(finalize ? { ...payload, status: "diajukan" } : payload)
      .eq("id", draftId);

    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    if (finalize) {
      router.push("/riwayat");
      router.refresh();
    } else {
      router.refresh();
    }
  }

  async function hapusDraft() {
    if (!draftId) return;
    if (!confirm("Hapus draft pengajuan ini?")) return;

    setSubmitting(true);
    const { error: deleteError } = await supabase
      .from("peminjaman_organik")
      .delete()
      .eq("id", draftId);

    if (deleteError) {
      setSubmitting(false);
      setError(deleteError.message);
      return;
    }

    router.push("/peralatan-organik");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">Alat</p>
      <p className="text-lg font-medium text-slate-900">
        {alat.nama_alat} {alat.merek && `- ${alat.merek}`}
      </p>
      <p className="mt-1 text-sm text-slate-500">
        Tersedia: {alat.jumlah_tersedia}
      </p>

      {!bisaPinjam && (
        <div className="mt-4">
          <Alert variant="error">
            Alat ini sedang tidak tersedia untuk dipinjam.
          </Alert>
        </div>
      )}

      {bisaPinjam && (
        <form onSubmit={(e) => simpan(false, e)} className="mt-6 space-y-4">
          {draftId && (
            <Alert variant="info">
              Draft tersimpan. Ubah isian di bawah kapan saja, lalu klik
              &quot;Ajukan Peminjaman&quot; kalau sudah siap.
            </Alert>
          )}
          <Input
            label="Jumlah"
            type="number"
            min={1}
            max={alat.jumlah_tersedia}
            value={jumlah}
            onChange={(e) => setJumlah(e.target.value)}
            required
          />
          <Input
            label="Tanggal Rencana Kembali"
            type="date"
            value={tanggalKembali}
            onChange={(e) => setTanggalKembali(e.target.value)}
            required
            min={new Date().toISOString().split("T")[0]}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Keperluan
            </label>
            <textarea
              value={keperluan}
              onChange={(e) => setKeperluan(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-[#d1cb23] focus:outline-none focus:ring-2 focus:ring-[#F6EE29]/40"
              placeholder="Untuk keperluan survei di ..."
            />
          </div>
          {error && <Alert variant="error">{error}</Alert>}

          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              variant={draftId ? "secondary" : "primary"}
              disabled={submitting}
              className="w-full"
            >
              {submitting
                ? "Menyimpan..."
                : draftId
                  ? "Simpan Perubahan"
                  : "Simpan Draft"}
            </Button>
            {draftId && (
              <>
                <Button
                  type="button"
                  onClick={() => simpan(true)}
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? "Mengajukan..." : "Ajukan Peminjaman"}
                </Button>
                <button
                  type="button"
                  onClick={hapusDraft}
                  disabled={submitting}
                  className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                >
                  Hapus Draft
                </button>
              </>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
