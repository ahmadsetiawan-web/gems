type FileFieldProps = {
  label: string;
  currentUrl?: string | null;
  onChange: (file: File | null) => void;
  accept: string;
};

export default function FileField({
  label,
  currentUrl,
  onChange,
  accept,
}: FileFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">
        {label}
      </label>
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
