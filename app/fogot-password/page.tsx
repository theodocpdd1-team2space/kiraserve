"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email") ?? "";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (emailFromUrl) {
      setEmail(emailFromUrl);
    }
  }, [emailFromUrl]);

  const handleResetPassword = async () => {
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setStatus("Masukkan email terlebih dahulu.");
      return;
    }

    setLoading(true);
    setStatus("Mengirim link reset password...");

    const origin =
      typeof window !== "undefined" ? window.location.origin : "";

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus(
      "Link reset password berhasil dikirim. Silakan cek inbox atau spam email Anda."
    );
  };

  return (
    <main className="min-h-screen overflow-hidden bg-gradient-to-br from-[#eef7ff] via-white to-[#f8efff] px-5 py-8 text-slate-900 selection:bg-purple-200 md:px-10">
      <div className="pointer-events-none fixed left-[-120px] top-[80px] h-[360px] w-[360px] rounded-full bg-cyan-300/40 blur-3xl" />
      <div className="pointer-events-none fixed right-[-140px] top-[120px] h-[430px] w-[430px] rounded-full bg-blue-400/25 blur-3xl" />
      <div className="pointer-events-none fixed bottom-[-160px] left-[25%] h-[360px] w-[360px] rounded-full bg-violet-300/25 blur-3xl" />

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-64px)] max-w-[980px] items-center justify-center">
        <div className="w-full max-w-[560px] rounded-[2.6rem] border border-white/80 bg-white/90 p-6 shadow-2xl shadow-blue-200/50 backdrop-blur-xl md:p-8">
          <div className="mb-8 flex items-center justify-between">
            <a
              href="/login"
              className="rounded-full bg-slate-100 px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
            >
              ← Login
            </a>

            <a
              href="/dashboard"
              className="rounded-full bg-blue-50 px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-blue-600 transition hover:bg-blue-600 hover:text-white"
            >
              Dashboard
            </a>
          </div>

          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-blue-600 to-cyan-400 text-2xl font-black text-white shadow-lg shadow-blue-300/50">
              ?
            </div>

            <p className="mt-5 text-xs font-black uppercase tracking-[0.28em] text-blue-600">
              Reset Password
            </p>

            <h1 className="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.06em] text-slate-950 md:text-5xl">
              Lupa password?
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm font-bold leading-7 text-slate-500">
              Masukkan email akun KiraServe Anda. Sistem akan mengirim link
              untuk membuat password baru.
            </p>
          </div>

          <div className="mt-8 rounded-[1.5rem] bg-gradient-to-br from-blue-50 to-cyan-50 p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-black text-blue-600 shadow-sm">
                ✉
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-500">
                  Email Reset Link
                </p>

                <p className="mt-2 text-sm font-bold leading-6 text-blue-800">
                  Link reset password akan dikirim ke email yang terdaftar.
                </p>

                <p className="mt-1 text-xs font-bold leading-5 text-blue-500">
                  Setelah klik link dari email, Anda akan diarahkan ke halaman
                  buat password baru.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7">
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-400">
              Email
            </label>

            <input
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setStatus("");
              }}
              type="email"
              placeholder="nama@email.com"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleResetPassword();
                }
              }}
              className="w-full rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 text-base font-bold text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <button
            type="button"
            onClick={handleResetPassword}
            disabled={loading}
            className="mt-6 w-full rounded-2xl bg-[#A88BFA] px-6 py-5 text-base font-bold text-white shadow-lg shadow-purple-200 transition hover:-translate-y-0.5 hover:bg-[#9372F9] disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {loading ? "Mengirim..." : "Kirim Link Reset →"}
          </button>

          <a
            href="/login"
            className="mt-3 flex w-full justify-center rounded-2xl border-2 border-slate-200 bg-white px-6 py-5 text-base font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
          >
            Kembali ke Login
          </a>

          {status && (
            <div className="mt-5 rounded-xl bg-slate-100 p-4 text-center text-sm font-semibold text-slate-700">
              {status}
            </div>
          )}

          <div className="mt-7 grid grid-cols-2 gap-3">
            <InfoPill title="Account" value="Email Check" />
            <InfoPill title="Security" value="Reset Link" />
          </div>

          <p className="mt-6 text-center text-xs font-bold leading-6 text-slate-500">
            Cek folder inbox, spam, atau promotions jika email belum terlihat.
          </p>
        </div>
      </section>
    </main>
  );
}

function InfoPill({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-sm font-black text-slate-800">{value}</p>
    </div>
  );
}