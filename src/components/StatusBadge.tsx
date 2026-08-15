export const statusLabel: Record<string, string> = {
  draft: "Draft",
  diajukan: "Menunggu Persetujuan",
  disetujui: "Disetujui, Menunggu Penugasan Teknisi",
  ditugaskan: "Menunggu Pemeriksaan Teknisi",
  diperiksa: "Diperiksa, Menunggu Persetujuan",
  dipinjam: "Dipinjam",
  pengembalian_ditugaskan: "Menunggu Pemeriksaan Pengembalian",
  pengembalian_diperiksa: "Diperiksa, Menunggu Persetujuan Pengembalian",
  pengembalian_disetujui: "Disetujui, Menunggu Konfirmasi Admin",
  dikembalikan: "Dikembalikan",
  ditolak: "Ditolak",
};

export const statusVariant: Record<
  string,
  "success" | "warning" | "error" | "info" | "neutral"
> = {
  draft: "neutral",
  diajukan: "warning",
  disetujui: "warning",
  ditugaskan: "warning",
  diperiksa: "warning",
  dipinjam: "info",
  pengembalian_ditugaskan: "warning",
  pengembalian_diperiksa: "warning",
  pengembalian_disetujui: "warning",
  dikembalikan: "success",
  ditolak: "error",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
        statusVariant[status] === "success"
          ? "bg-green-100 text-green-800"
          : statusVariant[status] === "warning"
            ? "bg-amber-100 text-amber-800"
            : statusVariant[status] === "error"
              ? "bg-red-100 text-red-700"
              : statusVariant[status] === "neutral"
                ? "bg-slate-100 text-slate-600"
                : "bg-blue-100 text-blue-800"
      }`}
    >
      {statusLabel[status] ?? status}
    </span>
  );
}
