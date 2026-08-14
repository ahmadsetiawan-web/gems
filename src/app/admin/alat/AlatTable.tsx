"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

type AlatRow = {
  id_alat: string;
  nama_alat: string;
  tipe_alat: string | null;
  tahun_alat: number | null;
  kondisi_alat: string;
  status_ketersediaan: string;
  lokasi_penyimpanan: string | null;
};

type JenisMap = Record<
  string,
  { foto_url: string | null } | undefined
>;

export default function AlatTable({
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
        placeholder="Cari nama alat, tipe, atau ID..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#d1cb23] focus:outline-none focus:ring-2 focus:ring-[#F6EE29]/40"
      />
      <div className="space-y-2">
        {groupList.map(([nama, units]) => {
          const fotoJenis = jenisMap[nama]?.foto_url ?? null;
          const isOpen = expanded === nama;

          return (
            <div
              key={nama}
              className="rounded-lg border border-slate-200 bg-white"
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : nama)}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {fotoJenis && (
                      <Image
                        src={fotoJenis}
                        alt={nama}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{nama}</p>
                    <p className="text-sm text-slate-500">
                      {units.length} unit
                    </p>
                  </div>
                </button>
                <Link
                  href={`/admin/jenis-alat/${encodeURIComponent(nama)}/edit`}
                  className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Foto/Manual/Dokumen
                </Link>
              </div>

              {isOpen && (
                <div className="divide-y divide-slate-100 border-t border-slate-100">
                  {units.map((a) => (
                    <div
                      key={a.id_alat}
                      className="flex items-center justify-between px-4 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium text-slate-800">
                          {a.id_alat} {a.tipe_alat && `- ${a.tipe_alat}`}
                        </p>
                        <p className="text-slate-500">
                          {a.tahun_alat ?? "-"} &middot;{" "}
                          <span
                            className={
                              a.kondisi_alat === "Baik"
                                ? "text-green-700"
                                : "text-red-700"
                            }
                          >
                            {a.kondisi_alat}
                          </span>{" "}
                          &middot; {a.status_ketersediaan}
                        </p>
                        <p className="text-slate-500">
                          Lokasi: {a.lokasi_penyimpanan ?? "-"}
                        </p>
                      </div>
                      <Link
                        href={`/admin/alat/${encodeURIComponent(a.id_alat)}/edit`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>
                    </div>
                  ))}
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
