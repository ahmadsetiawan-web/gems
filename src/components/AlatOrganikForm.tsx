"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import FileField from "@/components/ui/FileField";

type AlatOrganik = {
  id: string;
  nama_alat: string;
  merek: string | null;
  nup: string | null;
  tahun_pembelian: number | null;
  kondisi_alat: string;
  jumlah_total: number;
  jumlah_tersedia: number;
  foto_url: string | null;
};

type AlatOrganikFormProps =
  | { mode: "create"; initialData?: undefined }
  | { mode: "edit"; initialData: AlatOrganik };

type SupabaseBrowserClient = ReturnType<typeof createClient>;

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uploadFoto(
  supabase: SupabaseBrowserClient,
  namaAlat: string,
  file: File
) {
  const ext = file.name.split(".").pop();
  const path = `organik/${slugify(namaAlat)}.${ext}`;

  const { error } = await supabase.storage
    .from("alat")
    .upload(path, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from("alat").getPublicUrl(path);
  return data.publicUrl;
}

export default function AlatOrganikForm({
  mode,
  initialData,
}: AlatOrganikFormProps) {
  const supabase = createClient();
  const router = useRouter();

  const [namaAlat, setNamaAlat] = useState(initialData?.nama_alat ?? "");
  const [merek, setMerek] = useState(initialData?.merek ?? "");
  const [nup, setNup] = useState(initialData?.nup ?? "");
  const [tahunPembelian, setTahunPembelian] = useState(
    initialData?.tahun_pembelian?.toString() ?? ""
  );
  const [kondisiAlat, setKondisiAlat] = useState(
    initialData?.kondisi_alat ?? "Baik"
  );
  const [jumlahTotal, setJumlahTotal] = useState(
    initialData?.jumlah_total?.toString() ?? "1"
  );
  const [fotoFile, setFotoFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const jumlah = parseInt(jumlahTotal, 10) || 0;

      if (mode === "create") {
        const { data: created, error: insertError } = await supabase
          .from("alat_organik")
          .insert({
            nama_alat: namaAlat.trim(),
            merek: merek.trim() || null,
            nup: nup.trim() || null,
            tahun_pembelian: tahunPembelian ? parseInt(tahunPembelian, 10) : null,
            kondisi_alat: kondisiAlat,
            jumlah_total: jumlah,
            jumlah_tersedia: jumlah,
          })
          .select("id")
          .single();

        if (insertError) {
          if (insertError.code === "23505") {
            throw new Error("Nama alat ini sudah ada, gunakan nama lain.");
          }
          throw insertError;
        }

        if (fotoFile && created) {
          const fotoUrl = await uploadFoto(supabase, namaAlat.trim(), fotoFile);
          await supabase
            .from("alat_organik")
            .update({ foto_url: fotoUrl })
            .eq("id", created.id);
        }
      } else {
        const selisih = jumlah - initialData.jumlah_total;

        const { error: updateError } = await supabase
          .from("alat_organik")
          .update({
            nama_alat: namaAlat.trim(),
            merek: merek.trim() || null,
            nup: nup.trim() || null,
            tahun_pembelian: tahunPembelian ? parseInt(tahunPembelian, 10) : null,
            kondisi_alat: kondisiAlat,
            jumlah_total: jumlah,
            jumlah_tersedia: initialData.jumlah_tersedia + selisih,
          })
          .eq("id", initialData.id);

        if (updateError) throw updateError;

        if (fotoFile) {
          const fotoUrl = await uploadFoto(supabase, namaAlat.trim(), fotoFile);
          await supabase
            .from("alat_organik")
            .update({ foto_url: fotoUrl })
            .eq("id", initialData.id);
        }
      }

      router.push("/admin/alat-organik");
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
        `Hapus alat organik "${initialData.nama_alat}"? Tindakan ini tidak bisa dibatalkan.`
      )
    ) {
      return;
    }

    setSubmitting(true);
    const { error: deleteError } = await supabase
      .from("alat_organik")
      .delete()
      .eq("id", initialData.id);

    if (deleteError) {
      setError(deleteError.message);
      setSubmitting(false);
      return;
    }

    router.push("/admin/alat-organik");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <Input
        label="Nama Alat"
        value={namaAlat}
        onChange={(e) => setNamaAlat(e.target.value)}
        required
        placeholder="Misal: Palu Geologi (Beku)"
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Merek"
          value={merek}
          onChange={(e) => setMerek(e.target.value)}
        />
        <Input
          label="NUP (Nomor Urut Pendaftaran)"
          value={nup}
          onChange={(e) => setNup(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Tahun Pembelian"
          type="number"
          value={tahunPembelian}
          onChange={(e) => setTahunPembelian(e.target.value)}
        />
        <Select
          label="Kondisi Alat"
          value={kondisiAlat}
          onChange={(e) => setKondisiAlat(e.target.value)}
        >
          <option value="Baik">Baik</option>
          <option value="Rusak">Rusak</option>
        </Select>
      </div>
      <Input
        label="Jumlah Total"
        type="number"
        min={0}
        value={jumlahTotal}
        onChange={(e) => setJumlahTotal(e.target.value)}
        required
      />
      {mode === "edit" && (
        <p className="text-xs text-slate-400">
          Jumlah tersedia saat ini: {initialData.jumlah_tersedia}. Mengubah
          jumlah total akan menyesuaikan jumlah tersedia secara proporsional.
        </p>
      )}

      <FileField
        label="Foto Alat"
        currentUrl={initialData?.foto_url}
        onChange={setFotoFile}
        accept="image/*"
      />

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
