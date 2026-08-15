"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

type Unit = {
  id_alat: string;
  nama_alat: string;
  tipe_alat: string | null;
  kode_alat: string | null;
  no_inventaris: string | null;
  status_ketersediaan: string;
  kondisi_alat: string;
};

type Draft = {
  id: string;
  tanggal_rencana_kembali: string;
  keperluan: string | null;
};

export default function BulkPengajuanForm({
  units: initialUnits,
  draft,
}: {
  units: Unit[];
  draft: Draft | null;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [units, setUnits] = useState(initialUnits);
  const [tanggalKembali, setTanggalKembali] = useState(
    draft?.tanggal_rencana_kembali ?? ""
  );
  const [keperluan, setKeperluan] = useState(draft?.keperluan ?? "");
  const [draftId, setDraftId] = useState<string | null>(draft?.id ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const namaAlat = units[0]?.nama_alat ?? "-";

  function hapusUnit(id: string) {
    setUnits((prev) => prev.filter((u) => u.id_alat !== id));
  }

  async function simpan(finalize: boolean, e?: FormEvent) {
    e?.preventDefault();
    setError("");

    if (units.length === 0) {
      setError("Minimal 1 unit harus ada dalam daftar.");
      return;
    }
    if (!tanggalKembali) {
      setError("Tanggal rencana kembali wajib diisi.");
      return;
    }
    if (finalize) {
      const tidakBisa = units.find(
        (u) =>
          u.status_ketersediaan !== "Tersedia" || u.kondisi_alat !== "Baik"
      );
      if (tidakBisa) {
        setError(
          `Unit ${tidakBisa.id_alat} sedang tidak bisa dipinjam, hapus dari daftar dulu.`
        );
        return;
      }
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
      id_alat: units[0].id_alat,
      tanggal_rencana_kembali: tanggalKembali,
      keperluan: keperluan.trim() || null,
    };

    let peminjamanId = draftId;

    if (!peminjamanId) {
      const { data: pengajuan, error: insertError } = await supabase
        .from("peminjaman")
        .insert({
          peminjam_id: user.id,
          status: "draft",
          ...payload,
        })
        .select("id")
        .single();

      if (insertError || !pengajuan) {
        setSubmitting(false);
        setError(insertError?.message ?? "Gagal menyimpan draft.");
        return;
      }
      peminjamanId = pengajuan.id;
      setDraftId(peminjamanId);
    } else {
      // Jangan ubah status di sini dulu -- kebijakan hapus
      // peminjaman_unit_tambahan cuma berlaku selama status masih
      // "draft". Kalau status keburu jadi "diajukan", baris lama gagal
      // terhapus (diam-diam, tanpa error) lalu insert baris baru bentrok
      // unique constraint dengan baris lama yang masih nyangkut itu.
      const { error: updateError } = await supabase
        .from("peminjaman")
        .update(payload)
        .eq("id", peminjamanId);

      if (updateError) {
        setSubmitting(false);
        setError(updateError.message);
        return;
      }
    }

    const { error: deleteError } = await supabase
      .from("peminjaman_unit_tambahan")
      .delete()
      .eq("peminjaman_id", peminjamanId);

    if (deleteError) {
      setSubmitting(false);
      setError(deleteError.message);
      return;
    }

    const tambahan = units.slice(1).map((u) => ({
      peminjaman_id: peminjamanId,
      id_alat: u.id_alat,
    }));

    if (tambahan.length > 0) {
      const { error: tambahanError } = await supabase
        .from("peminjaman_unit_tambahan")
        .insert(tambahan);

      if (tambahanError) {
        setSubmitting(false);
        setError(tambahanError.message);
        return;
      }
    }

    if (finalize) {
      const { error: finalizeError } = await supabase
        .from("peminjaman")
        .update({ status: "diajukan" })
        .eq("id", peminjamanId);

      if (finalizeError) {
        setSubmitting(false);
        setError(finalizeError.message);
        return;
      }
    }

    setSubmitting(false);

    if (finalize) {
      router.push("/riwayat");
      router.refresh();
    } else {
      router.refresh();
    }
  }

  async function hapusDraft() {
    if (!draftId) return;
    if (!confirm("Hapus draft pengajuan kolektif ini?")) return;

    setSubmitting(true);
    const { error: deleteError } = await supabase
      .from("peminjaman")
      .delete()
      .eq("id", draftId);

    if (deleteError) {
      setSubmitting(false);
      setError(deleteError.message);
      return;
    }

    router.push("/peralatan");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">Alat</p>
      <p className="text-lg font-medium text-slate-900">
        {namaAlat} &middot; {units.length} unit
      </p>

      <div className="mt-4 max-h-64 space-y-1 overflow-y-auto rounded-lg border border-slate-100 p-2">
        {units.map((u) => (
          <div
            key={u.id_alat}
            className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-sm"
          >
            <div>
              <span className="text-slate-800">{u.id_alat}</span>
              {u.kode_alat && (
                <span className="text-slate-400"> &middot; {u.kode_alat}</span>
              )}
              {(u.status_ketersediaan !== "Tersedia" ||
                u.kondisi_alat !== "Baik") && (
                <span className="ml-2 text-xs text-red-600">
                  ({u.status_ketersediaan}, {u.kondisi_alat})
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => hapusUnit(u.id_alat)}
              className="px-1 text-slate-400 hover:text-red-600"
              title="Hapus unit ini dari pengajuan"
            >
              &times;
            </button>
          </div>
        ))}
        {units.length === 0 && (
          <p className="py-2 text-center text-sm text-slate-400">
            Semua unit dihapus dari daftar.
          </p>
        )}
      </div>

      <form onSubmit={(e) => simpan(false, e)} className="mt-6 space-y-4">
        {draftId && (
          <Alert variant="info">
            Draft tersimpan. Ubah isian di bawah kapan saja, lalu klik
            &quot;Ajukan Peminjaman&quot; kalau sudah siap.
          </Alert>
        )}
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
            disabled={submitting || units.length === 0}
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
                disabled={submitting || units.length === 0}
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
    </div>
  );
}
