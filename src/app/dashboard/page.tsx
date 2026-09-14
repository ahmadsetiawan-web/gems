import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Alert from "@/components/ui/Alert";

type Card = {
  label: string;
  count: number;
  href: string;
};

async function countBoth(
  supabase: Awaited<ReturnType<typeof createClient>>,
  build: (table: "peminjaman" | "peminjaman_organik") => {
    eq: [string, string][];
    in?: [string, string[]];
  }
) {
  async function countOne(table: "peminjaman" | "peminjaman_organik") {
    const spec = build(table);
    let query = supabase
      .from(table)
      .select("id", { count: "exact", head: true });
    for (const [col, val] of spec.eq) {
      query = query.eq(col, val);
    }
    if (spec.in) {
      query = query.in(spec.in[0], spec.in[1]);
    }
    const { count } = await query;
    return count ?? 0;
  }

  const [survei, organik] = await Promise.all([
    countOne("peminjaman"),
    countOne("peminjaman_organik"),
  ]);
  return survei + organik;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const roleLabel: Record<string, string> = {
    pegawai: "Pegawai",
    non_pegawai: "Non-Pegawai",
  };

  const otorisasi = [
    profile?.is_admin && "Admin",
    profile?.is_pimpinan && "Pimpinan",
    profile?.is_pimpinan2 && "Pimpinan 2",
    profile?.is_teknisi && "Teknisi",
    profile?.is_developer && "Developer",
  ].filter(Boolean) as string[];

  const isAdmin = (profile?.is_admin || profile?.is_developer) ?? false;
  const isPimpinan = (profile?.is_pimpinan || profile?.is_developer) ?? false;
  const isPimpinan2 = (profile?.is_pimpinan2 || profile?.is_developer) ?? false;
  const isTeknisi = (profile?.is_teknisi || profile?.is_developer) ?? false;

  const cards: Card[] = [];

  if (profile && profile.status_approval === "approved") {
    const [draftCount, prosesCount, aktifCount] = await Promise.all([
      countBoth(supabase, () => ({
        eq: [
          ["peminjam_id", user.id],
          ["status", "draft"],
        ],
      })),
      countBoth(supabase, () => ({
        eq: [["peminjam_id", user.id]],
        in: [
          "status",
          [
            "diajukan",
            "disetujui",
            "ditugaskan",
            "diperiksa",
            "pengembalian_ditugaskan",
            "pengembalian_diperiksa",
            "pengembalian_disetujui",
          ],
        ],
      })),
      countBoth(supabase, () => ({
        eq: [
          ["peminjam_id", user.id],
          ["status", "dipinjam"],
        ],
      })),
    ]);

    if (draftCount > 0) {
      cards.push({
        label: "Draft pengajuan tersimpan",
        count: draftCount,
        href: "/riwayat",
      });
    }
    cards.push({
      label: "Pengajuan sedang diproses",
      count: prosesCount,
      href: "/riwayat",
    });
    cards.push({
      label: "Alat sedang kamu pinjam",
      count: aktifCount,
      href: "/riwayat",
    });
  }

  if (isPimpinan) {
    const count = await countBoth(supabase, () => ({
      eq: [["status", "diajukan"]],
    }));
    cards.push({
      label: "Pengajuan menunggu persetujuan kamu",
      count,
      href: "/pimpinan/peminjaman",
    });
  }

  if (isPimpinan2) {
    const [penugasanCount, penugasanKembaliCount, accCount] =
      await Promise.all([
        countBoth(supabase, () => ({
          eq: [["status", "disetujui"]],
        })),
        countBoth(supabase, () => ({
          eq: [["status", "dipinjam"]],
        })),
        countBoth(supabase, () => ({
          eq: [],
          in: ["status", ["diperiksa", "pengembalian_diperiksa"]],
        })),
      ]);
    cards.push({
      label: "Menunggu kamu tugaskan ke Teknisi",
      count: penugasanCount + penugasanKembaliCount,
      href: "/pimpinan2/peminjaman",
    });
    cards.push({
      label: "Hasil pemeriksaan menunggu persetujuan kamu",
      count: accCount,
      href: "/pimpinan2/peminjaman",
    });
  }

  if (isTeknisi) {
    const [surveiCount, organikCount] = await Promise.all([
      supabase
        .from("peminjaman")
        .select("id", { count: "exact", head: true })
        .eq("ditugaskan_ke", user.id)
        .in("status", ["ditugaskan", "pengembalian_ditugaskan"]),
      supabase
        .from("peminjaman_organik")
        .select("id", { count: "exact", head: true })
        .eq("ditugaskan_ke", user.id)
        .in("status", ["ditugaskan", "pengembalian_ditugaskan"]),
    ]);
    cards.push({
      label: "Tugas pemeriksaan untuk kamu",
      count: (surveiCount.count ?? 0) + (organikCount.count ?? 0),
      href: "/pengembalian",
    });
  }

  if (isAdmin) {
    const count = await countBoth(supabase, () => ({
      eq: [["status", "pengembalian_disetujui"]],
    }));
    cards.push({
      label: "Siap dikonfirmasi kembali",
      count,
      href: "/pengembalian",
    });
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>

        <div className="mt-4">
          {!profile && (
            <Alert variant="error">
              Profil tidak ditemukan. Hubungi admin.
            </Alert>
          )}

          {profile && profile.status_approval === "pending" && (
            <Alert variant="warning">
              Akun kamu (<strong>{profile.email}</strong>) masih menunggu
              persetujuan admin. Sebagian fitur belum bisa diakses.
            </Alert>
          )}

          {profile && profile.status_approval === "rejected" && (
            <Alert variant="error">
              Pendaftaran akun kamu ditolak. Hubungi admin untuk info lebih
              lanjut.
            </Alert>
          )}

          {profile && profile.status_approval === "approved" && (
            <Alert variant="success">
              <p>
                Selamat datang,{" "}
                <strong>{profile.nama || profile.email}</strong>
              </p>
              <p className="text-green-700">
                Role: {roleLabel[profile.role] ?? profile.role}
                {otorisasi.length > 0 && ` (${otorisasi.join(" & ")})`}
              </p>
            </Alert>
          )}
        </div>

        {profile && profile.status_approval === "approved" && (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {cards.map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-[#d1cb23] hover:bg-[#F6EE29]/5"
              >
                <p className="text-3xl font-bold text-slate-900">
                  {card.count}
                </p>
                <p className="mt-1 text-sm text-slate-600">{card.label}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
