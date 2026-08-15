import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import NavDropdown from "@/components/NavDropdown";

export default async function Navbar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  let isPimpinan = false;
  let isPimpinan2 = false;
  let isTeknisi = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, is_pimpinan, is_pimpinan2, is_teknisi, is_developer")
      .eq("id", user.id)
      .single();
    isAdmin = (profile?.is_admin || profile?.is_developer) ?? false;
    isPimpinan = (profile?.is_pimpinan || profile?.is_developer) ?? false;
    isPimpinan2 = (profile?.is_pimpinan2 || profile?.is_developer) ?? false;
    isTeknisi = (profile?.is_teknisi || profile?.is_developer) ?? false;
  }

  return (
    <header className="border-b-4 border-[#F6EE29] bg-white shadow-sm">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-y-2 px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo-esdm.png"
              alt="Kementerian ESDM"
              width={28}
              height={34}
            />
            <span className="text-lg font-bold tracking-tight text-slate-900">
              GEMS
            </span>
          </Link>
          {user && (
            <NavDropdown
              label="Peralatan"
              items={[
                { href: "/peralatan", label: "Peralatan Survei" },
                { href: "/peralatan-organik", label: "Peralatan Organik" },
              ]}
            />
          )}
          {isAdmin && (
            <>
              <NavDropdown
                label="Kelola Alat"
                items={[
                  { href: "/admin/alat", label: "Kelola Alat Survei" },
                  { href: "/admin/alat-organik", label: "Kelola Alat Organik" },
                ]}
              />
              <Link
                href="/admin/pengguna"
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Kelola Pengguna
              </Link>
              <Link
                href="/admin/status-peminjaman"
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Status Peminjaman
              </Link>
            </>
          )}
          {(isAdmin || isTeknisi) && (
            <>
              <NavDropdown
                label="Pemeriksaan Alat"
                items={[
                  { href: "/pemeriksaan-alat", label: "Pemeriksaan Alat Survei" },
                  {
                    href: "/pemeriksaan-alat-organik",
                    label: "Pemeriksaan Alat Organik",
                  },
                ]}
              />
              <NavDropdown
                label="Pengembalian Alat"
                items={[
                  { href: "/pengembalian", label: "Pengembalian Alat Survei" },
                  {
                    href: "/pengembalian-organik",
                    label: "Pengembalian Alat Organik",
                  },
                ]}
              />
            </>
          )}
          {isPimpinan && (
            <NavDropdown
              label="Persetujuan"
              items={[
                { href: "/pimpinan/peminjaman", label: "Persetujuan Alat Survei" },
                {
                  href: "/pimpinan/peminjaman-organik",
                  label: "Persetujuan Alat Organik",
                },
              ]}
            />
          )}
          {isPimpinan2 && (
            <NavDropdown
              label="Penugasan Teknisi"
              items={[
                { href: "/pimpinan2/peminjaman", label: "Penugasan Alat Survei" },
                {
                  href: "/pimpinan2/peminjaman-organik",
                  label: "Penugasan Alat Organik",
                },
              ]}
            />
          )}
          {user && (
            <Link
              href="/riwayat"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Riwayat
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <Link
              href="/profil"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Profil Saya
            </Link>
          )}
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
