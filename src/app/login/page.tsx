"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AuthCard from "@/components/AuthCard";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setSubmitting(false);

    if (error) {
      if (error.message.includes("Email not confirmed")) {
        setError("Email belum dikonfirmasi. Cek inbox/spam untuk link konfirmasi.");
      } else if (error.message.includes("Invalid login credentials")) {
        setError("Email atau password salah.");
      } else {
        setError(error.message);
      }
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthCard
      title="Login"
      footer={
        <>
          Belum punya akun?{" "}
          <Link href="/register" className="font-medium text-[#8a8300] hover:underline">
            Daftar di sini
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
        />
        <p className="text-right text-sm">
          <Link
            href="/lupa-password"
            className="font-medium text-[#8a8300] hover:underline"
          >
            Lupa Password?
          </Link>
        </p>
        {error && <Alert variant="error">{error}</Alert>}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Masuk..." : "Login"}
        </Button>
      </form>
    </AuthCard>
  );
}
