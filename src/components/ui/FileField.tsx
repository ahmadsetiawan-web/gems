"use client";

import { useState } from "react";

type FileFieldProps = {
  label: string;
  currentUrl?: string | null;
  onChange: (file: File | null) => void;
  accept: string;
  hint?: string;
};

export default function FileField({
  label,
  currentUrl,
  onChange,
  accept,
  hint,
}: FileFieldProps) {
  const [showHint, setShowHint] = useState(false);

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
        {hint && (
          <button
            type="button"
            onClick={() => setShowHint((v) => !v)}
            aria-label={showHint ? "Sembunyikan info" : "Tampilkan info"}
            className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 hover:bg-slate-300"
          >
            i
          </button>
        )}
      </div>
      {hint && showHint && (
        <p className="mb-1.5 rounded-md bg-slate-50 px-2 py-1.5 text-xs text-slate-500">
          {hint}
        </p>
      )}
      {currentUrl && (
        <a
          href={currentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-1 block text-xs text-blue-600 hover:underline"
        >
          Lihat file saat ini
        </a>
      )}
      <input
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
      />
    </div>
  );
}
