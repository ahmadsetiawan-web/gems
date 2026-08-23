import Image from "next/image";
import { type ReactNode } from "react";

type AuthCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export default function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: AuthCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/logo-esdm-horizontal.png"
            alt="Kementerian ESDM"
            width={160}
            height={70}
            className="mb-3"
            priority
          />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            GEMS
          </h1>
          <p className="text-sm text-slate-500">
            Geophysical Equipment Management System
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border-2 border-slate-900 shadow-lg">
          <div className="h-2 bg-[#F6EE29]" />
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            )}
            <div className="mt-5">{children}</div>
          </div>
        </div>

        {footer && (
          <p className="mt-5 text-center text-sm text-slate-500">{footer}</p>
        )}
      </div>
    </main>
  );
}
