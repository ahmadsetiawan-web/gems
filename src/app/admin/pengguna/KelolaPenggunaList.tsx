"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  email: string;
  is_admin: boolean;
  is_pimpinan: boolean;
  is_pimpinan2: boolean;
  is_teknisi: boolean;
  is_developer: boolean;
};

export type PenggunaRow = {
  nip: string | null;
  nama: string;
  jabatan: string | null;
  profile: Profile | null;
};

type RoleKey = "is_admin" | "is_pimpinan" | "is_pimpinan2" | "is_teknisi";

const roleColumns: { key: RoleKey; label: string }[] = [
  { key: "is_admin", label: "Admin" },
  { key: "is_pimpinan", label: "Pimpinan 1" },
  { key: "is_pimpinan2", label: "Pimpinan 2" },
  { key: "is_teknisi", label: "Teknisi" },
];

export default function KelolaPenggunaList({ data }: { data: PenggunaRow[] }) {
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState(data);
  const [savingId, setSavingId] = useState<string | null>(null);

  const filtered = rows.filter((r) => {
    const q = query.toLowerCase();
    return (
      r.nama.toLowerCase().includes(q) ||
      (r.nip ?? "").toLowerCase().includes(q) ||
      (r.profile?.email ?? "").toLowerCase().includes(q)
    );
  });

  async function toggleRole(profileId: string, key: RoleKey, current: boolean) {
    setSavingId(profileId);
    const { error } = await supabase
      .from("profiles")
      .update({ [key]: !current })
      .eq("id", profileId);
    setSavingId(null);

    if (!error) {
      setRows((prev) =>
        prev.map((r) =>
          r.profile?.id === profileId
            ? { ...r, profile: { ...r.profile!, [key]: !current } }
            : r
        )
      );
    }
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Cari nama atau NIP..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#d1cb23] focus:outline-none focus:ring-2 focus:ring-[#F6EE29]/40"
      />
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
              <th className="px-3 py-2">Nama</th>
              <th className="px-3 py-2">NIP</th>
              {roleColumns.map((r) => (
                <th key={r.key} className="px-3 py-2 text-center">
                  {r.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.nip ?? r.profile?.id}
                className="border-b border-slate-100 last:border-0"
              >
                <td className="px-3 py-2">
                  <p className="font-medium text-slate-900">{r.nama}</p>
                  {r.profile ? (
                    <p className="text-xs text-slate-400">{r.profile.email}</p>
                  ) : (
                    <p className="text-xs text-amber-600">Belum daftar akun</p>
                  )}
                  {r.profile?.is_developer && (
                    <span className="text-xs font-medium text-purple-600">
                      Developer
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-slate-600">{r.nip ?? "-"}</td>
                {roleColumns.map(({ key }) => (
                  <td key={key} className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={r.profile?.[key] ?? false}
                      disabled={!r.profile || savingId === r.profile.id}
                      onChange={() =>
                        r.profile &&
                        toggleRole(r.profile.id, key, r.profile![key])
                      }
                      className="h-4 w-4 rounded border-slate-300 accent-[#F6EE29] disabled:opacity-30"
                    />
                  </td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={2 + roleColumns.length}
                  className="px-3 py-6 text-center text-slate-400"
                >
                  Tidak ada pengguna ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
