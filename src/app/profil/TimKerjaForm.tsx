"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function TimKerjaForm({
  nip,
  timKerja,
}: {
  nip: string;
  timKerja: string | null;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [editing, setEditing] = useState(!timKerja);
  const [value, setValue] = useState(timKerja ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const { error: updateError } = await supabase
      .from("pegawai")
      .update({ tim_kerja: value.trim() || null })
      .eq("nip", nip);

    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div>
        <p className="text-sm text-slate-500">Tim Kerja / Bidang</p>
        <div className="mt-1 flex items-center gap-3">
          <p className="font-medium text-slate-900">{timKerja}</p>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm text-blue-600 hover:underline"
          >
            Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        label="Tim Kerja / Bidang"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Misal: Kelompok Kerja Gravitasi"
      />
      {error && <Alert variant="error">{error}</Alert>}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Menyimpan..." : "Simpan"}
        </Button>
        {timKerja && (
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setValue(timKerja ?? "");
              setError("");
            }}
            className="text-sm text-slate-500 hover:underline"
          >
            Batal
          </button>
        )}
      </div>
    </form>
  );
}
