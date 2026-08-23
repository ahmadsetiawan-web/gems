"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import FileField from "@/components/ui/FileField";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

type JenisAlat = {
  nama_alat: string;
  foto_url: string | null;
  manual_url: string | null;
  dokumen_url: string | null;
};

type SupabaseBrowserClient = ReturnType<typeof createClient>;

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uploadFile(
  supabase: SupabaseBrowserClient,
  folder: string,
  namaAlat: string,
  file: File
) {
  const ext = file.name.split(".").pop();
  const path = `${folder}/${slugify(namaAlat)}.${ext}`;

  const { error } = await supabase.storage
    .from("alat")
    .upload(path, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from("alat").getPublicUrl(path);
  return data.publicUrl;
}

export default function JenisAlatForm({ jenis }: { jenis: JenisAlat }) {
  const supabase = createClient();
  const router = useRouter();

  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [dokumenFile, setDokumenFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const urlUpdates: Record<string, string> = {};

      if (fotoFile) {
        urlUpdates.foto_url = await uploadFile(
          supabase,
          "foto",
          jenis.nama_alat,
          fotoFile
        );
      }
      if (manualFile) {
        urlUpdates.manual_url = await uploadFile(
          supabase,
          "manual",
          jenis.nama_alat,
          manualFile
        );
      }
      if (dokumenFile) {
        urlUpdates.dokumen_url = await uploadFile(
          supabase,
          "dokumen",
          jenis.nama_alat,
          dokumenFile
        );
      }

      if (Object.keys(urlUpdates).length > 0) {
        const { error: updateError } = await supabase
          .from("jenis_alat")
          .update(urlUpdates)
          .eq("nama_alat", jenis.nama_alat);

        if (updateError) throw updateError;
      }

      router.push("/admin/alat");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <p className="text-sm text-slate-500">Jenis Alat</p>
        <p className="text-lg font-medium text-slate-900">
          {jenis.nama_alat}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Berlaku untuk semua unit dengan jenis alat ini.
        </p>
      </div>

      <div className="space-y-3 border-t border-slate-200 pt-4">
        <FileField
          label="Foto Alat"
          currentUrl={jenis.foto_url}
          onChange={setFotoFile}
          accept="image/*"
        />
        <FileField
          label="Buku Manual (PDF)"
          currentUrl={jenis.manual_url}
          onChange={setManualFile}
          accept="application/pdf"
          hint="Opsional. Panduan cara mengoperasikan alat ini, untuk dibaca peminjam di halaman Peralatan. Kalau file masih .docx, simpan/export dulu sebagai PDF sebelum diunggah."
        />
        <FileField
          label="Dokumen Alat (PDF)"
          currentUrl={jenis.dokumen_url}
          onChange={setDokumenFile}
          accept="application/pdf"
          hint="Opsional. Dokumen pendukung lain di luar cara pakai, misalnya spesifikasi teknis (datasheet), sertifikat kalibrasi, atau brosur alat."
        />
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Menyimpan..." : "Simpan"}
      </Button>
    </form>
  );
}
