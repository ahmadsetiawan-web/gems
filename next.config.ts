import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Izinkan akses dev server dari laptop lain di jaringan yang sama
  // (tanpa ini, Next.js blokir file JS-nya sendiri saat diakses lewat
  // IP jaringan, bikin tombol/form tidak berfungsi sama sekali).
  allowedDevOrigins: ["172.16.159.20", "172.16.159.23"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "isuvtjdhtzgomohtmnra.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
