"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

type Alat = {
  id_alat: string;
  nama_alat: string;
  tipe_alat: string | null;
  kode_alat: string | null;
  no_inventaris: string | null;
  tahun_alat: number | null;
  kondisi_alat: string;
  status_ketersediaan: string;
  lokasi_penyimpanan: string | null;
};

type AlatFormProps =
  | { mode: "create"; initialData?: undefined }
  | { mode: "edit"; initialData: Alat };

export default function AlatForm({ mode, initialData }: AlatFormProps) {
  const supabase = createClient();
  const router = useRouter();

  const [idAlat, setIdAlat] = useState(initialData?.id_alat ?? "");
  const [namaAlat, setNamaAlat] = useState(initialData?.nama_alat ?? "");
  const [tipeAlat, setTipeAlat] = useState(initialData?.tipe_alat ?? "");
  const [kodeAlat, setKodeAlat] = useState(initialData?.kode_alat ?? "");
  const [noInventaris, setNoInventaris] = useState(
    initialData?.no_inventaris ?? ""
  );
  const [tahunAlat, setTahunAlat] = useState(
    initialData?.tahun_alat?.toString() ?? ""
  );
  const [kondisiAlat, setKondisiAlat] = useState(
    initialData?.kondisi_alat ?? "Baik"
  );
  const [statusKetersediaan, setStatusKetersediaan] = useState(
    initialData?.status_ketersediaan ?? "Tersedia"
  );
  const [lokasi, setLokasi] = useState(
    initialData?.lokasi_penyimpanan ?? ""
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const payload = {
        nama_alat: namaAlat.trim(),
        tipe_alat: tipeAlat.trim() || null,
        kode_alat: kodeAlat.trim() || null,
        no_inventaris: noInventaris.trim() || null,
        tahun_alat: tahunAlat ? parseInt(tahunAlat, 10) : null,
        kondisi_alat: kondisiAlat,
        status_ketersediaan: statusKetersediaan,
        lokasi_penyimpanan: lokasi.trim() || null,
      };

      if (mode === "create") {
        // Jenis alat baru? Pastikan baris jenis_alat ada dulu supaya
        // relasi (foreign key) ke jenis_alat terpenuhi.
        const { error: jenisError } = await supabase
          .from("jenis_alat")
          .upsert({ nama_alat: payload.nama_alat }, { onConflict: "nama_alat", ignoreDuplicates: true });

        if (jenisError) throw jenisError;

        const { error: insertError } = await supabase
          .from("alat")
          .insert({ id_alat: idAlat.trim(), ...payload });

        if (insertError) {
          if (insertError.code === "23505") {
            throw new Error("ID Alat sudah dipakai, gunakan ID lain.");
          }
          throw insertError;
        }
      } else {
        const { data: updateData, error: updateError } = await supabase
          .from("alat")
          .update(payload)
          .eq("id_alat", idAlat)
          .select();

        if (updateError) throw updateError;

        if (!updateData || updateData.length === 0) {
          throw new Error(
            "Perubahan tidak tersimpan. Coba muat ulang halaman lalu ulangi."
          );
        }
      }

      router.push("/admin/alat");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (mode !== "edit") return;
    if (
      !confirm(
        `Hapus alat "${initialData.nama_alat}"? Tindakan ini tidak bisa dibatalkan.`
      )
    ) {
      return;
    }

    setSubmitting(true);
    const { error: deleteError } = await supabase
      .from("alat")
      .delete()
      .eq("id_alat", initialData.id_alat);

    if (deleteError) {
      setError(deleteError.message);
      setSubmitting(false);
      return;
    }

    router.push("/admin/alat");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <Input
        label="ID Alat"
        value={idAlat}
        onChange={(e) => setIdAlat(e.target.value)}
        required
        disabled={mode === "edit"}
        placeholder="Misal: L&R_900"
      />
      <Input
        label="Nama Alat"
        value={namaAlat}
        onChange={(e) => setNamaAlat(e.target.value)}
        required
        placeholder="Harus sama persis dengan jenis yang sudah ada kalau unit tambahan"
      />
      <Input
        label="Tipe Alat"
        value={tipeAlat}
        onChange={(e) => setTipeAlat(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Kode Alat"
          value={kodeAlat}
          onChange={(e) => setKodeAlat(e.target.value)}
        />
        <Input
          label="No. Inventaris"
          value={noInventaris}
          onChange={(e) => setNoInventaris(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Tahun Alat"
          type="number"
          value={tahunAlat}
          onChange={(e) => setTahunAlat(e.target.value)}
        />
        <Input
          label="Lokasi Penyimpanan"
          value={lokasi}
          onChange={(e) => setLokasi(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Kondisi Alat"
          value={kondisiAlat}
          onChange={(e) => setKondisiAlat(e.target.value)}
        >
          <option value="Baik">Baik</option>
          <option value="Rusak">Rusak</option>
        </Select>
        <Select
          label="Status Ketersediaan"
          value={statusKetersediaan}
          onChange={(e) => setStatusKetersediaan(e.target.value)}
        >
          <option value="Tersedia">Tersedia</option>
          <option value="Diajukan">Diajukan</option>
          <option value="Dipinjam">Dipinjam</option>
        </Select>
      </div>

      <p className="text-xs text-slate-400">
        Foto, buku manual, dan dokumen alat dikelola di tingkat jenis alat
        (lihat halaman Kelola Alat Survei), bukan per unit.
      </p>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex items-center justify-between border-t border-slate-200 pt-4">
        <Button type="submit" disabled={submitting}>
          {submitting
            ? "Menyimpan..."
            : mode === "create"
              ? "Tambah Alat"
              : "Simpan Perubahan"}
        </Button>

        {mode === "edit" && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting}
            className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
          >
            Hapus Alat
          </button>
        )}
      </div>
    </form>
  );
}
