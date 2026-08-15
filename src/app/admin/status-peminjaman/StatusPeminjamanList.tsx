"use client";

import { useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";

export type StatusRow = {
  id: string;
  jenis: "Survei" | "Organik";
  namaAlat: string;
  peminjam: string;
  tanggalPinjam: string;
  tanggalRencanaKembali: string;
  status: string;
  ditugaskanKe: string | null;
};

const BELUM_DISETUJUI = ["draft", "diajukan", "ditolak"];

export default function StatusPeminjamanList({ data }: { data: StatusRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = data.filter((r) => {
    const q = query.toLowerCase();
    return (
      r.namaAlat.toLowerCase().includes(q) ||
      r.peminjam.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <input
        type="text"
        placeholder="Cari nama alat atau peminjam..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#d1cb23] focus:outline-none focus:ring-2 focus:ring-[#F6EE29]/40"
      />
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
              <th className="px-3 py-2">Jenis</th>
              <th className="px-3 py-2">Alat</th>
              <th className="px-3 py-2">Peminjam</th>
              <th className="px-3 py-2">Pinjam / Rencana Kembali</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Dokumen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const sudahDisetujui = !BELUM_DISETUJUI.includes(r.status);
              return (
                <tr
                  key={`${r.jenis}-${r.id}`}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-3 py-2 text-slate-500">{r.jenis}</td>
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {r.namaAlat}
                  </td>
                  <td className="px-3 py-2 text-slate-700">{r.peminjam}</td>
                  <td className="px-3 py-2 text-slate-500">
                    {r.tanggalPinjam} &middot; {r.tanggalRencanaKembali}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col items-start gap-1">
                      <StatusBadge status={r.status} />
                      {r.ditugaskanKe && (
                        <span className="text-xs text-slate-400">
                          Teknisi: {r.ditugaskanKe}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {r.jenis === "Survei" && sudahDisetujui ? (
                      <div className="flex flex-col items-start gap-1">
                        <Link
                          href={`/surat-persetujuan/${r.id}`}
                          target="_blank"
                          className="text-blue-600 hover:underline"
                        >
                          Surat Persetujuan
                        </Link>
                        <Link
                          href={`/surat/${r.id}`}
                          target="_blank"
                          className="text-blue-600 hover:underline"
                        >
                          Surat Peminjaman
                        </Link>
                        <Link
                          href={`/surat-pengantar/${r.id}`}
                          target="_blank"
                          className="text-blue-600 hover:underline"
                        >
                          Surat Pengantar Barang
                        </Link>
                        {r.status === "dikembalikan" && (
                          <Link
                            href={`/surat-pengembalian/${r.id}`}
                            target="_blank"
                            className="text-blue-600 hover:underline"
                          >
                            Surat Pengembalian
                          </Link>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                  Tidak ada peminjaman ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
