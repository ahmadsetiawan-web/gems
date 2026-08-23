import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
      <Image
        src="/logo-esdm-horizontal.png"
        alt="Kementerian ESDM"
        width={200}
        height={88}
        priority
      />
      <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
        GEMS
      </h1>
      <div className="mt-2 max-w-md text-slate-500">
        <p>Geophysical Equipment Management System</p>
        <p>Sistem Peminjaman Peralatan Geofisika</p>
        <p>Pusat Survei Geologi, Badan Geologi, Kementerian ESDM</p>
      </div>
      <div className="mt-8 flex gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-[#F6EE29] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[#d1cb23]"
        >
          Masuk
        </Link>
        <Link
          href="/register"
          className="rounded-lg border-2 border-slate-900 px-5 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-50"
        >
          Daftar
        </Link>
      </div>
    </main>
  );
}
