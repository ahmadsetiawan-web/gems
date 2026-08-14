"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AuthCard from "@/components/AuthCard";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function LupaPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    setSubmitting(false);

    // Selalu tampilkan pesan sukses yang sama (walau email tidak terdaftar)
    // supaya tidak bocorkan email mana saja yang punya akun.
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <AuthCard
      title="Lupa Password"
      subtitle="Masukkan email akun kamu, kami kirimkan link untuk atur ulang password."
      footer={
        <Link href="/login" className="font-medium text-[#8a8300] hover:underline">
          Kembali ke Login
        </Link>
      }
    >
      {sent ? (
        <Alert variant="success">
          Kalau email itu terdaftar, link reset password sudah dikirim. Cek
          inbox/spam kamu.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && <Alert variant="error">{error}</Alert>}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Mengirim..." : "Kirim Link Reset"}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
