"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email) {
      setStatus("Masukkan email terlebih dahulu.");
      return;
    }

    setLoading(true);
    setStatus("Mengirim magic link ke email...");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    setLoading(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Magic link sudah dikirim. Silakan cek inbox email Anda.");
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 selection:bg-blue-500 selection:text-white">
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-8 py-20 md:px-14">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-indigo-950 to-blue-900" />

        <div className="absolute -left-[10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px] mix-blend-screen" />
        <div className="absolute right-[-5%] top-[20%] h-[600px] w-[600px] rounded-full bg-cyan-400/10 blur-[150px] mix-blend-screen" />
        <div className="absolute bottom-[-20%] left-[20%] h-[400px] w-[600px] rounded-full bg-indigo-500/20 blur-[100px] mix-blend-screen" />

        <div className="relative z-10 grid w-full max-w-[1100px] overflow-hidden rounded-[3rem] border border-white/10 bg-white/10 shadow-2xl shadow-black/30 backdrop-blur-2xl lg:grid-cols-[0.95fr_1.05fr]">
          <div className="hidden min-h-[680px] flex-col justify-between bg-white/[0.06] p-12 text-white lg:flex">
            <div>
              <a
                href="/"
                className="inline-flex rounded-full border border-white/15 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                ← KiraServe
              </a>

              <h1 className="mt-16 text-6xl font-black leading-[0.95] tracking-[-0.05em]">
                Ministry schedule,
                <br />
                made simple.
              </h1>

              <p className="mt-8 max-w-md text-lg leading-8 text-blue-100/70">
                Masuk untuk mengelola divisi, jadwal pelayanan, koordinator,
                dan share jadwal ke tim pelayanan.
              </p>
            </div>

            <div className="grid gap-4">
              <MiniFeature title="Multiple Divisi" />
              <MiniFeature title="Role Koordinator" />
              <MiniFeature title="Share WhatsApp & Calendar" />
            </div>
          </div>

          <div className="bg-slate-50 p-8 md:p-12 lg:p-16">
            <a
              href="/"
              className="mb-10 inline-flex rounded-full border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500 shadow-sm transition hover:border-blue-500 hover:text-blue-600 lg:hidden"
            >
              ← KiraServe
            </a>

            <p className="mb-5 text-xs font-black uppercase tracking-[0.35em] text-blue-600">
              Login
            </p>

            <h2 className="text-5xl font-black leading-[0.95] tracking-[-0.05em] text-slate-900 md:text-6xl">
              Masuk ke akun Anda.
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-500">
              Gunakan email yang sudah terdaftar sebagai admin, koordinator,
              atau pelayan di gereja Anda.
            </p>

            <div className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 md:p-8">
              <label className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setStatus("");
                }}
                placeholder="nama@email.com"
                className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5 text-lg font-bold text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />

              <button
                type="button"
                onClick={handleLogin}
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center rounded-full bg-blue-600 px-8 py-5 text-sm font-black uppercase tracking-[0.14em] text-white shadow-[0_0_40px_-12px_rgba(37,99,235,0.6)] transition hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Mengirim..." : "Kirim Magic Link →"}
              </button>

              {status && (
                <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                  <p className="text-sm font-bold leading-7 text-blue-700">
                    {status}
                  </p>
                </div>
              )}

              <div className="mt-8 border-t border-slate-100 pt-6">
                <p className="text-sm leading-7 text-slate-500">
                  Dengan masuk, Anda akan menerima magic link / OTP melalui
                  email. Setelah login, Anda akan diarahkan ke dashboard
                  KiraServe.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <InfoCard
                title="Belum terdaftar?"
                desc="Minta admin gereja untuk mengundang email Anda."
              />

              <InfoCard
                title="Untuk koordinator"
                desc="Pastikan email Anda sudah diberi role di divisi."
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function MiniFeature({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="h-2.5 w-2.5 rounded-full bg-cyan-300" />
      <p className="text-sm font-bold text-white/75">{title}</p>
    </div>
  );
}

function InfoCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-black tracking-[-0.03em] text-slate-900">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p>
    </div>
  );
}