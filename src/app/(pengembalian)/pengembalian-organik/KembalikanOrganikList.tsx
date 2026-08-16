import Link from "next/link";

export type PinjamanOrganik = {
  id: string;
  tanggal_pinjam: string;
  tanggal_rencana_kembali: string;
  jumlah_diambil: number;
  disetujui_oleh: string | null;
  alat_organik: { nama_alat: string; merek: string | null } | null;
  profiles: { nama: string | null; email: string } | null;
};

export default function KembalikanOrganikList({
  data,
}: {
  data: PinjamanOrganik[];
}) {
  if (data.length === 0) {
    return (
      <p className="text-slate-400">Tidak ada alat organik yang sedang dipinjam.</p>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((p) => (
        <div
          key={p.id}
          className="rounded-lg border border-slate-200 bg-white p-4"
        >
          <div>
            <p className="font-medium text-slate-900">
              {p.alat_organik?.nama_alat ?? "-"}{" "}
              {p.alat_organik?.merek && `(${p.alat_organik.merek})`}
              {" "}&middot; Jumlah: {p.jumlah_diambil}
            </p>
            <p className="text-sm text-slate-500">
              Dipinjam oleh: {p.profiles?.nama || p.profiles?.email}
            </p>
            <p className="text-sm text-slate-500">
              Sejak: {p.tanggal_pinjam} &middot; Rencana kembali:{" "}
              {p.tanggal_rencana_kembali}
            </p>
            {p.disetujui_oleh && (
              <p className="text-sm text-slate-500">
                Disetujui oleh: {p.disetujui_oleh}
              </p>
            )}
          </div>

          <div className="mt-3">
            <Link
              href={`/surat-organik/${p.id}`}
              target="_blank"
              className="text-sm text-blue-600 hover:underline"
            >
              Cetak Surat
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
