"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";

export default function NomorSuratEditor({
  id,
  nomorSurat,
  canEdit,
}: {
  id: string;
  nomorSurat: string;
  canEdit: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(nomorSurat);
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    if (!value.trim()) return;
    setSubmitting(true);
    await supabase
      .from("peminjaman")
      .update({ nomor_surat: value.trim() })
      .eq("id", id);
    setSubmitting(false);
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
    <div className="flex items-center justify-center gap-2 print:hidden">
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
        }}
        className="text-xs text-slate-500 hover:underline"
      >
        Batal
      </button>
    </div>
  );
}
