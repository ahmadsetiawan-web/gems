"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import FileField from "@/components/ui/FileField";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function FotoForm({
  nip,
  fotoUrl,
}: {
  nip: string;
  fotoUrl: string | null;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload() {
    if (!file) return;
    setError("");
    setSubmitting(true);

    const ext = file.name.split(".").pop();
    const path = `foto/${nip}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("pegawai")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setSubmitting(false);
      setError(uploadError.message);
      return;
    }

    const { data } = supabase.storage.from("pegawai").getPublicUrl(path);
    // Path-nya tetap sama tiap upload (upsert), jadi browser/CDN bisa
    // nyangkut cache versi lama -- tambahkan penanda versi supaya foto
    // baru langsung kepakai, bukan foto lama yang ke-cache.
    const fotoUrlBaru = `${data.publicUrl}?v=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("pegawai")
      .update({ foto_url: fotoUrlBaru })
      .eq("nip", nip);

    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setFile(null);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-slate-100">
          {fotoUrl && (
            <Image src={fotoUrl} alt="Foto profil" fill className="object-cover" />
          )}
        </div>
        <div className="flex-1">
          <FileField
            label="Foto Profil"
            currentUrl={null}
            onChange={setFile}
            accept="image/*"
          />
        </div>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <Button onClick={handleUpload} disabled={!file || submitting}>
        {submitting ? "Mengunggah..." : "Unggah Foto"}
      </Button>
    </div>
  );
}
