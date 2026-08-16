"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function NomorSuratEditor({
  id,
  nomorSurat,
  table,
  column,
  canEdit,
}: {
  id: string;
  nomorSurat: string;
  table: "peminjaman" | "peminjaman_organik";
  column: "nomor_surat" | "nomor_surat_persetujuan";
  canEdit: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(nomorSurat);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!value.trim()) return;
    setSubmitting(true);
    setError("");
    const { error: updateError } = await supabase
      .from(table)
      .update({ [column]: value.trim() })
      .eq("id", id);
    setSubmitting(false);

    if (updateError) {
      setError(
        updateError.code === "23505"
          ? "Nomor ini sudah dipakai surat lain, coba nomor yang lain."
          : updateError.message
      );
      return;
    }

    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-center gap-2">
        <span>NO : {nomorSurat}</span>
        {canEdit && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-blue-600 hover:underline print:hidden"
          >
            Edit
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="print:hidden">
      <div className="flex items-center justify-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-900"
        />
        <Button onClick={handleSave} disabled={submitting}>
          {submitting ? "Menyimpan..." : "Simpan"}
        </Button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setValue(nomorSurat);
            setError("");
          }}
          className="text-xs text-slate-500 hover:underline"
        >
          Batal
        </button>
      </div>
      {error && (
        <div className="mt-2 inline-block">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
    </div>
  );
}
