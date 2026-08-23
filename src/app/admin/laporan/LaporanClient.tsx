"use client";

import { useMemo, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { downloadCsv } from "@/lib/csv";

function tahunDari(tanggal: string): number {
  return Number(tanggal.slice(0, 4));
}

export type PeringkatAlat = {
  namaAlat: string;
  jumlah: number;
};

export type RiwayatItem = {
  id: string;
  jenis: "Survei" | "Organik";
  namaAlat: string;
  peminjam: string;
  tanggalPinjam: string;
  tanggalKembali: string | null;
  status: string;
};

function Histogram({
  title,
  data,
  dipilih,
  onPilih,
  filenameCsv,
}: {
  title: string;
  data: PeringkatAlat[];
  dipilih: string | null;
  onPilih: (namaAlat: string | null) => void;
  filenameCsv: string;
}) {
  if (data.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-400">Belum ada data.</p>
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.jumlah));

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <button
          type="button"
          onClick={() =>
            downloadCsv(
              filenameCsv,
              ["Nama Alat", "Jumlah Dipinjam"],
              data.map((d) => [d.namaAlat, d.jumlah])
            )
          }
          className="shrink-0 text-sm text-blue-600 hover:underline"
        >
          Unduh CSV
        </button>
      </div>
      <div className="mt-3 space-y-2">
        {data.map((d) => {
          const aktif = dipilih === d.namaAlat;
          return (
            <button
              key={d.namaAlat}
              type="button"
              onClick={() => onPilih(aktif ? null : d.namaAlat)}
              className={`block w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                aktif
                  ? "border-[#d1cb23] bg-[#F6EE29]/10"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-800">
                  {d.namaAlat}
                </span>
                <span className="text-slate-500">{d.jumlah}x dipinjam</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#F6EE29]"
                  style={{ width: `${(d.jumlah / max) * 100}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
      {dipilih && (
        <p className="mt-2 text-xs text-slate-400">
          Menampilkan siapa saja yang meminjam &quot;{dipilih}&quot; di
          bagian Riwayat di bawah.
        </p>
      )}
    </div>
  );
}

export default function LaporanClient({
  riwayatPerUnitSurvei,
  riwayat,
}: {
  riwayatPerUnitSurvei: Record<string, RiwayatItem[]>;
  riwayat: RiwayatItem[];
}) {
  const [alatSurveiDipilih, setAlatSurveiDipilih] = useState<string | null>(
    null
  );
  const [queryPegawai, setQueryPegawai] = useState("");
  const [tahunDipilih, setTahunDipilih] = useState<number | "semua">("semua");

  const tahunTersedia = useMemo(() => {
    const set = new Set(riwayat.map((r) => tahunDari(r.tanggalPinjam)));
    return Array.from(set).sort((a, b) => b - a);
  }, [riwayat]);

  const riwayatPerUnitSurveiTerfilter = useMemo(() => {
    if (tahunDipilih === "semua") return riwayatPerUnitSurvei;
    const hasil: Record<string, RiwayatItem[]> = {};
    for (const [label, items] of Object.entries(riwayatPerUnitSurvei)) {
      const cocok = items.filter(
        (item) => tahunDari(item.tanggalPinjam) === tahunDipilih
      );
      if (cocok.length > 0) hasil[label] = cocok;
    }
    return hasil;
  }, [riwayatPerUnitSurvei, tahunDipilih]);

  const peringkatSurvei: PeringkatAlat[] = useMemo(
    () =>
      Object.entries(riwayatPerUnitSurveiTerfilter)
        .map(([namaAlat, items]) => ({ namaAlat, jumlah: items.length }))
        .sort((a, b) => b.jumlah - a.jumlah),
    [riwayatPerUnitSurveiTerfilter]
  );

  const riwayatTerfilterTahun = useMemo(
    () =>
      tahunDipilih === "semua"
        ? riwayat
        : riwayat.filter((r) => tahunDari(r.tanggalPinjam) === tahunDipilih),
    [riwayat, tahunDipilih]
  );

  const filtered = alatSurveiDipilih
    ? (riwayatPerUnitSurveiTerfilter[alatSurveiDipilih] ?? [])
    : queryPegawai
      ? riwayatTerfilterTahun.filter((r) =>
          r.peminjam.toLowerCase().includes(queryPegawai.toLowerCase())
        )
      : [];

  const modeAktif = alatSurveiDipilih
    ? `Peminjam alat "${alatSurveiDipilih}"`
    : queryPegawai
      ? `Riwayat peminjaman ${queryPegawai}`
      : null;

  const labelTahun = tahunDipilih === "semua" ? "semua-tahun" : String(tahunDipilih);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <label htmlFor="tahun" className="text-sm font-medium text-slate-700">
          Tahun
        </label>
        <select
          id="tahun"
          value={tahunDipilih}
          onChange={(e) => {
            const v = e.target.value;
            setTahunDipilih(v === "semua" ? "semua" : Number(v));
            setAlatSurveiDipilih(null);
          }}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-[#d1cb23] focus:outline-none focus:ring-2 focus:ring-[#F6EE29]/40"
        >
          <option value="semua">Semua Tahun</option>
          {tahunTersedia.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <Histogram
        title="Alat Survei Paling Sering Dipinjam"
        data={peringkatSurvei}
        dipilih={alatSurveiDipilih}
        onPilih={(v) => {
          setAlatSurveiDipilih(v);
          setQueryPegawai("");
        }}
        filenameCsv={`peringkat-alat-survei-${labelTahun}.csv`}
      />

      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Riwayat Peminjaman per Pegawai
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Cari nama pegawai untuk lihat alat apa saja yang pernah dia
          pinjam.
        </p>
        <input
          type="text"
          placeholder="Cari nama pegawai..."
          value={queryPegawai}
          onChange={(e) => {
            setQueryPegawai(e.target.value);
            setAlatSurveiDipilih(null);
          }}
          className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#d1cb23] focus:outline-none focus:ring-2 focus:ring-[#F6EE29]/40"
        />

        {modeAktif && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-700">
                {modeAktif} ({filtered.length})
              </p>
              <button
                type="button"
                onClick={() =>
                  downloadCsv(
                    `riwayat-peminjaman-${labelTahun}.csv`,
                    [
                      "Jenis",
                      "Alat",
                      "Peminjam",
                      "Tanggal Pinjam",
                      "Tanggal Kembali",
                      "Status",
                    ],
                    filtered.map((r) => [
                      r.jenis,
                      r.namaAlat,
                      r.peminjam,
                      r.tanggalPinjam,
                      r.tanggalKembali ?? "-",
                      r.status,
                    ])
                  )
                }
                className="shrink-0 text-sm text-blue-600 hover:underline"
              >
                Unduh CSV
              </button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                    <th className="px-3 py-2">Jenis</th>
                    <th className="px-3 py-2">Alat</th>
                    <th className="px-3 py-2">Peminjam</th>
                    <th className="px-3 py-2">Pinjam / Kembali</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={`${r.jenis}-${r.id}`}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-3 py-2 text-slate-500">{r.jenis}</td>
                      <td className="px-3 py-2 font-medium text-slate-900">
                        {r.namaAlat}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {r.peminjam}
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {r.tanggalPinjam}
                        {r.tanggalKembali && ` · ${r.tanggalKembali}`}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-6 text-center text-slate-400"
                      >
                        Tidak ada data ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
