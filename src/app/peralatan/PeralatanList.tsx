"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

type AlatRow = {
  id_alat: string;
  nama_alat: string;
  tipe_alat: string | null;
  kode_alat: string | null;
  no_inventaris: string | null;
  tahun_alat: number | null;
  kondisi_alat: string;
  status_ketersediaan: string;
  lokasi_penyimpanan: string | null;
};

type JenisInfo = {
  foto_url: string | null;
  manual_url: string | null;
  dokumen_url: string | null;
};

type JenisMap = Record<string, JenisInfo | undefined>;

export default function PeralatanList({
  data,
  jenisMap,
}: {
  data: AlatRow[];
  jenisMap: JenisMap;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const groups = new Map<string, AlatRow[]>();
  for (const a of data) {
    if (!groups.has(a.nama_alat)) groups.set(a.nama_alat, []);
    groups.get(a.nama_alat)!.push(a);
  }

  const groupList = Array.from(groups.entries())
    .filter(([nama]) => nama.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div>
      <input
        type="text"
        placeholder="Cari jenis alat..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#d1cb23] focus:outline-none focus:ring-2 focus:ring-[#F6EE29]/40"
      />
      <div className="space-y-2">
        {groupList.map(([nama, units]) => {
          const jenis = jenisMap[nama];
          const isOpen = expanded === nama;

          return (
            <div
              key={nama}
              className="rounded-lg border border-slate-200 bg-white"
            >
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : nama)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {jenis?.foto_url && (
                    <Image
                      src={jenis.foto_url}
                      alt={nama}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{nama}</p>
                  <p className="text-sm text-slate-500">{units.length} unit</p>
                  <div className="mt-1 flex flex-wrap gap-3 text-sm">
                    {jenis?.manual_url && (
                      <a
                        href={jenis.manual_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-600 hover:underline"
                      >
                        Buku Manual
                      </a>
                    )}
                    {jenis?.dokumen_url && (
                      <a
                        href={jenis.dokumen_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-600 hover:underline"
                      >
                        Dokumen Alat
                      </a>
                    )}
                  </div>
                </div>
                <span className="text-slate-400">{isOpen ? "−" : "+"}</span>
              </button>

              {isOpen && (
                <div className="divide-y divide-slate-100 border-t border-slate-100">
                  {units.map((u) => {
                    const bisaPinjam =
                      u.status_ketersediaan === "Tersedia" &&
                      u.kondisi_alat === "Baik";
                    return (
                      <div key={u.id_alat} className="px-4 py-3">
                        <div className="text-sm">
                          <p className="font-medium text-slate-800">
                            {u.id_alat} {u.tipe_alat && `- ${u.tipe_alat}`}
                          </p>
                          <p className="text-slate-500">
                            {u.tahun_alat ?? "-"}
                            {u.kode_alat && ` · Kode: ${u.kode_alat}`}
                            {u.no_inventaris && ` · No. Inv: ${u.no_inventaris}`}
                          </p>
                          <p className="text-slate-500">
                            Lokasi: {u.lokasi_penyimpanan ?? "-"}
                          </p>
                          <p>
                            <span
                              className={
                                u.kondisi_alat === "Baik"
                                  ? "text-green-700"
                                  : "text-red-700"
                              }
                            >
                              {u.kondisi_alat}
                            </span>{" "}
                            &middot; {u.status_ketersediaan}
                          </p>
                          {bisaPinjam && (
                            <Link
                              href={`/pinjam/ajukan/${encodeURIComponent(u.id_alat)}`}
                              className="mt-1 inline-block font-medium text-[#8a8300] hover:underline"
                            >
                              Ajukan Pinjam
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {groupList.length === 0 && (
          <p className="py-6 text-center text-slate-400">
            Tidak ada alat ditemukan.
          </p>
        )}
      </div>
    </div>
  );
}
