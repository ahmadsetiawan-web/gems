"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AuthCard from "@/components/AuthCard";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

type NipResult = { nama: string; jabatan: string; valid: boolean };

export default function RegisterPage() {
  const supabase = createClient();
  const router = useRouter();

  const [step, setStep] = useState<"nip" | "akun">("nip");
  const [nip, setNip] = useState("");
  const [checking, setChecking] = useState(false);
  const [nipError, setNipError] = useState("");
  const [pegawaiData, setPegawaiData] = useState<NipResult | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleCheckNip(e: FormEvent) {
    e.preventDefault();
    setNipError("");
    setChecking(true);

    const { data, error } = await supabase.rpc("check_nip", {
      input_nip: nip.trim(),
    });

    setChecking(false);

    if (error) {
      setNipError("Terjadi kesalahan, coba lagi.");
      return;
    }

    if (!data || data.length === 0) {
      setNipError("NIP tidak ditemukan dalam data pegawai.");
      return;
    }

    const result = data[0] as NipResult;

    if (!result.valid) {
      setNipError("NIP ini sudah pernah dipakai untuk daftar.");
      return;
    }

    setPegawaiData(result);
    setStep("akun");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: "pegawai",
          nip: nip.trim(),
          nama: pegawaiData?.nama,
        },
      },
    });

    setSubmitting(false);

    if (error) {
      setSubmitError(error.message);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <AuthCard title="Registrasi berhasil">
        <p className="text-sm text-slate-600">
          Cek email kamu (<strong>{email}</strong>) untuk konfirmasi akun
          sebelum bisa login.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Registrasi Pegawai"
      subtitle={
        step === "nip"
          ? "Masukkan NIP untuk verifikasi identitas"
          : undefined
      }
      footer={
        <>
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-[#8a8300] hover:underline">
            Login
          </Link>
        </>
      }
    >
      {step === "nip" && (
        <form onSubmit={handleCheckNip} className="space-y-4">
          <Input
            label="NIP"
            type="text"
            value={nip}
            onChange={(e) => setNip(e.target.value)}
            required
            placeholder="Masukkan NIP"
          />
          {nipError && <Alert variant="error">{nipError}</Alert>}
          <Button type="submit" disabled={checking} className="w-full">
            {checking ? "Memeriksa..." : "Cek NIP"}
          </Button>
        </form>
      )}

      {step === "akun" && pegawaiData && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert variant="success">
            <p>NIP valid. Ini kamu?</p>
            <p className="font-medium">{pegawaiData.nama}</p>
            <p className="text-green-700">{pegawaiData.jabatan}</p>
          </Alert>

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {submitError && <Alert variant="error">{submitError}</Alert>}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Mendaftarkan..." : "Daftar"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep("nip")}
            >
              Ganti NIP
            </Button>
          </div>
        </form>
      )}
    </AuthCard>
  );
}
