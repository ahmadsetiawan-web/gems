"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

type AlatOrganikRow = {
  id: string;
  nama_alat: string;
  merek: string | null;
  nup: string | null;
  tahun_pembelian: number | null;
  kondisi_alat: string;
  jumlah_total: number;
  jumlah_tersedia: number;
  foto_url: string | null;
};

export default function PeralatanOrganikList({
  data,
}: {
  data: AlatOrganikRow[];
}) {
  const [query, setQuery] = useState("");

  const filtered = data.filter((a) =>
    a.nama_alat.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <input
        type="text"
        placeholder="Cari alat organik..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#d1cb23] focus:outline-none focus:ring-2 focus:ring-[#F6EE29]/40"
      />
      <div className="space-y-2">
        {filtered.map((a) => {
          const bisaPinjam = a.jumlah_tersedia > 0 && a.kondisi_alat === "Baik";
          return (
            <div
              key={a.id}
              className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {a.foto_url && (
                  <Image
                    src={a.foto_url}
                    alt={a.nama_alat}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex-1 text-sm">
                <p className="font-medium text-slate-900">
                  {a.nama_alat} {a.merek && `- ${a.merek}`}
                </p>
                <p className="text-slate-500">
                  {a.tahun_pembelian ?? "-"}
                  {a.nup && ` · NUP: ${a.nup}`}
                </p>
                <p>
                  <span
                    className={
                      a.kondisi_alat === "Baik"
                        ? "text-green-700"
                        : "text-red-700"
                    }
                  >
                    {a.kondisi_alat}
                  </span>{" "}
                  &middot; {a.jumlah_tersedia} dari {a.jumlah_total} tersedia
                </p>
                {bisaPinjam && (
                  <Link
                    href={`/pinjam-organik/ajukan/${a.id}`}
                    className="mt-1 inline-block font-medium text-[#8a8300] hover:underline"
                  >
                    Ajukan Pinjam
                  </Link>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-6 text-center text-slate-400">
            Tidak ada alat ditemukan.
          </p>
        )}
      </div>
    </div>
  );
}
