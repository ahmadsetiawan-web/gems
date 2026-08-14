"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

type Alat = {
  id_alat: string;
  nama_alat: string;
  tipe_alat: string | null;
  kondisi_alat: string;
  status_ketersediaan: string;
};

type Kelengkapan = {
  id: string;
  nama_bagian: string;
  no_inventaris: string | null;
  kategori: string | null;
  jumlah_standar: number;
};

type Draft = {
  id: string;
  tanggal_rencana_kembali: string;
  keperluan: string | null;
  catatan_tambahan: string | null;
  checklist: { kelengkapan_id: string; jumlah_dibawa: number }[];
};

type ChecklistState = Record<string, { checked: boolean; jumlah: string }>;

export default function PengajuanForm({
  alat,
  kelengkapan,
  draft,
}: {
  alat: Alat;
  kelengkapan: Kelengkapan[];
  draft: Draft | null;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [tanggalKembali, setTanggalKembali] = useState(
    draft?.tanggal_rencana_kembali ?? ""
  );
  const [keperluan, setKeperluan] = useState(draft?.keperluan ?? "");
  const [catatanTambahan, setCatatanTambahan] = useState(
    draft?.catatan_tambahan ?? ""
  );
  const [checklist, setChecklist] = useState<ChecklistState>(() => {
    const dibawa = new Map(
      (draft?.checklist ?? []).map((c) => [c.kelengkapan_id, c.jumlah_dibawa])
    );
    return Object.fromEntries(
      kelengkapan.map((k) => [
        k.id,
        dibawa.has(k.id)
          ? { checked: true, jumlah: String(dibawa.get(k.id)) }
          : { checked: false, jumlah: String(k.jumlah_standar) },
      ])
    );
  });
  const [draftId, setDraftId] = useState<string | null>(draft?.id ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const bisaPinjam =
    alat.status_ketersediaan === "Tersedia" && alat.kondisi_alat === "Baik";

  function toggleChecked(id: string) {
    setChecklist((prev) => ({
      ...prev,
      [id]: { ...prev[id], checked: !prev[id].checked },
    }));
  }

  function setJumlah(id: string, jumlah: string) {
    setChecklist((prev) => ({
      ...prev,
      [id]: { ...prev[id], jumlah },
    }));
  }

  async function simpan(finalize: boolean, e?: FormEvent) {
    e?.preventDefault();
    setError("");

    if (!bisaPinjam) {
      setError("Alat ini sedang tidak bisa dipinjam.");
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
      tanggal_rencana_kembali: tanggalKembali,
      keperluan: keperluan.trim() || null,
      catatan_tambahan: catatanTambahan.trim() || null,
    };

    let peminjamanId = draftId;

    if (!peminjamanId) {
      const { data: pengajuan, error: insertError } = await supabase
        .from("peminjaman")
        .insert({
          id_alat: alat.id_alat,
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
      const { error: updateError } = await supabase
        .from("peminjaman")
        .update(finalize ? { ...payload, status: "diajukan" } : payload)
        .eq("id", peminjamanId);

      if (updateError) {
        setSubmitting(false);
        setError(updateError.message);
        return;
      }
    }

    const { error: deleteChecklistError } = await supabase
      .from("peminjaman_kelengkapan")
      .delete()
      .eq("peminjaman_id", peminjamanId);

    if (deleteChecklistError) {
      setSubmitting(false);
      setError(deleteChecklistError.message);
      return;
    }

    const dipilih = Object.entries(checklist)
      .filter(([, v]) => v.checked)
      .map(([kelengkapanId, v]) => ({
        peminjaman_id: peminjamanId,
        kelengkapan_id: kelengkapanId,
        jumlah_dibawa: parseInt(v.jumlah, 10) || 0,
      }));

    if (dipilih.length > 0) {
      const { error: checklistError } = await supabase
        .from("peminjaman_kelengkapan")
        .insert(dipilih);

      if (checklistError) {
        setSubmitting(false);
        setError(checklistError.message);
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
    if (!confirm("Hapus draft pengajuan ini?")) return;

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
      <p className="text-lg font-medium text-slate-900">{alat.nama_alat}</p>
      {alat.tipe_alat && (
        <p className="text-sm text-slate-500">{alat.tipe_alat}</p>
      )}
      <p className="mt-1 text-sm text-slate-500">ID: {alat.id_alat}</p>

      {!bisaPinjam && (
        <div className="mt-4">
          <Alert variant="error">
            Alat ini sedang tidak tersedia untuk dipinjam (status:{" "}
            {alat.status_ketersediaan}, kondisi: {alat.kondisi_alat}).
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

          {kelengkapan.length > 0 && (
            <div className="border-t border-slate-200 pt-4">
              <p className="mb-1 text-sm font-medium text-slate-700">
                Kelengkapan yang Dibawa
              </p>
              <p className="mb-3 text-xs text-slate-400">
                Centang kelengkapan yang kamu bawa, sesuaikan jumlahnya.
              </p>
              <div className="space-y-2">
                {kelengkapan.map((k) => {
                  const state = checklist[k.id];
                  return (
                    <div
                      key={k.id}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2"
                    >
                      <input
                        type="checkbox"
                        checked={state.checked}
                        onChange={() => toggleChecked(k.id)}
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
                        value={state.jumlah}
                        disabled={!state.checked}
                        onChange={(e) => setJumlah(k.id, e.target.value)}
                        className="w-20 shrink-0 rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-900 disabled:bg-slate-50 disabled:text-slate-400"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="border-t border-slate-200 pt-4">
            <label className="block text-sm font-medium text-slate-700">
              Catatan Tambahan
            </label>
            <p className="mb-1 text-xs text-slate-400">
              Isi kalau ada kelengkapan yang dibawa tapi tidak ada di daftar
              di atas. Kosongkan kalau tidak ada.
            </p>
            <textarea
              value={catatanTambahan}
              onChange={(e) => setCatatanTambahan(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-[#d1cb23] focus:outline-none focus:ring-2 focus:ring-[#F6EE29]/40"
              placeholder="Misal: membawa juga tripod tambahan milik pribadi"
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
