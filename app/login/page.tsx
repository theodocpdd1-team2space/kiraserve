"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectParam = searchParams.get("redirect");
  const safeRedirect =
    redirectParam && redirectParam.startsWith("/")
      ? redirectParam
      : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        router.replace(safeRedirect);
        return;
      }

      setCheckingSession(false);
    };

    checkSession();
  }, [router, safeRedirect]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setStatus("Masukkan email dan password terlebih dahulu.");
      return;
    }

    setLoading(true);
    setStatus("Memproses login...");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setLoading(false);
      setStatus(error.message);
      return;
    }

    setStatus("Login berhasil. Mengarahkan...");
    router.replace(safeRedirect);
  };

  const handleMagicLink = async () => {
    if (!email.trim()) {
      setStatus("Masukkan email terlebih dahulu untuk magic link.");
      return;
    }

    setLoading(true);
    setStatus("Mengirim magic link...");

    const origin =
      typeof window !== "undefined" ? window.location.origin : "";

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${origin}${safeRedirect}`,
      },
    });

    setLoading(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Magic link berhasil dikirim. Cek inbox email Anda.");
  };

  const forgotPasswordHref = `/forgot-password${
    email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ""
  }`;

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eef7ff] px-5 text-slate-900">
        <div className="rounded-[2rem] bg-white p-8 shadow-xl shadow-blue-200/40">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">
            Checking session...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-gradient-to-br from-[#eef7ff] via-white to-[#f8efff] px-5 py-8 text-slate-900 selection:bg-purple-200 md:px-10">
      <div className="pointer-events-none fixed left-[-120px] top-[80px] h-[360px] w-[360px] rounded-full bg-cyan-300/40 blur-3xl" />
      <div className="pointer-events-none fixed right-[-140px] top-[120px] h-[430px] w-[430px] rounded-full bg-blue-400/25 blur-3xl" />
      <div className="pointer-events-none fixed bottom-[-160px] left-[25%] h-[360px] w-[360px] rounded-full bg-violet-300/25 blur-3xl" />

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-64px)] max-w-[1120px] items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="hidden lg:block">
            <div className="relative">
              <div className="absolute -left-6 top-10 h-20 w-20 rotate-12 rounded-[2rem] bg-lime-300" />
              <div className="absolute right-12 top-0 h-16 w-16 rounded-full bg-orange-300" />
              <div className="absolute bottom-8 left-20 h-24 w-24 -rotate-12 rounded-[2rem] bg-violet-300" />

              <div className="relative rounded-[3rem] border border-white/80 bg-white/60 p-8 shadow-2xl shadow-blue-200/40 backdrop-blur-xl">
                <p className="w-fit rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-blue-600 shadow-sm">
                  KiraServe Account
                </p>

                <h1 className="mt-8 text-6xl font-black leading-[0.92] tracking-[-0.07em] text-slate-950">
                  Welcome
                  <br />
                  back to
                  <br />
                  workspace.
                </h1>

                <p className="mt-6 max-w-sm text-base font-bold leading-8 text-slate-500">
                  Login untuk masuk ke dashboard, redeem invite code, dan
                  mengelola jadwal pelayanan.
                </p>

                <div className="mt-10 grid gap-3">
                  <FeatureCard
                    label="Schedule"
                    title="Kelola jadwal pelayanan"
                    color="blue"
                  />
                  <FeatureCard
                    label="Invite"
                    title="Join church/division"
                    color="green"
                  />
                  <FeatureCard
                    label="Team"
                    title="Serving role by division"
                    color="orange"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[540px]">
            <div className="rounded-[2.6rem] border border-white/80 bg-white/90 p-6 shadow-2xl shadow-blue-200/50 backdrop-blur-xl md:p-8">
              <div className="mb-8 flex items-center justify-between">
                <a
                  href="/"
                  className="rounded-full bg-slate-100 px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                >
                  ← Home
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
                  K
                </div>

                <p className="mt-5 text-xs font-black uppercase tracking-[0.28em] text-blue-600">
                  Login Account
                </p>

                <h2 className="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.06em] text-slate-950 md:text-5xl">
                  Masuk ke KiraServe.
                </h2>

                <p className="mx-auto mt-4 max-w-md text-sm font-bold leading-7 text-slate-500">
                  Gunakan email yang sama dengan akun invite / workspace Anda.
                </p>
              </div>

              {redirectParam && (
                <div className="mt-7 rounded-[1.5rem] bg-gradient-to-br from-blue-50 to-cyan-50 p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-black text-blue-600 shadow-sm">
                      →
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-500">
                        Setelah Login
                      </p>

                      <p className="mt-2 text-sm font-bold leading-6 text-blue-800">
                        Anda akan diarahkan kembali ke halaman sebelumnya untuk
                        melanjutkan proses.
                      </p>

                      <p className="mt-1 text-xs font-bold leading-5 text-blue-500">
                        Jika berasal dari invite link, lanjutkan redeem kode
                        undangan setelah login.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-7 grid gap-4">
                <div>
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
                    className="w-full rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 text-base font-bold text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <label className="block text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                      Password
                    </label>

                    <a
                      href={forgotPasswordHref}
                      className="text-xs font-black uppercase tracking-[0.12em] text-blue-600 transition hover:text-purple-600"
                    >
                      Lupa Password?
                    </a>
                  </div>

                  <input
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setStatus("");
                    }}
                    type="password"
                    placeholder="••••••••"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleLogin();
                      }
                    }}
                    className="w-full rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 text-base font-bold text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogin}
                disabled={loading}
                className="mt-6 w-full rounded-2xl bg-[#A88BFA] px-6 py-5 text-base font-bold text-white shadow-lg shadow-purple-200 transition hover:-translate-y-0.5 hover:bg-[#9372F9] disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? "Processing..." : "Login →"}
              </button>

              <button
                type="button"
                onClick={handleMagicLink}
                disabled={loading}
                className="mt-3 w-full rounded-2xl border-2 border-slate-200 bg-white px-6 py-5 text-base font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 disabled:opacity-60 disabled:hover:translate-y-0"
              >
                Kirim Magic Link
              </button>

              {status && (
                <div className="mt-5 rounded-xl bg-slate-100 p-4 text-center text-sm font-semibold text-slate-700">
                  {status}
                </div>
              )}

              <div className="mt-7 grid grid-cols-2 gap-3">
                <InfoPill title="Account" value="Email Login" />
                <InfoPill title="Access" value="Auto Redirect" />
              </div>

              <p className="mt-6 text-center text-xs font-bold leading-6 text-slate-500">
                Setelah login, Anda akan diarahkan kembali ke halaman yang
                sebelumnya dibuka.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  label,
  title,
  color,
}: {
  label: string;
  title: string;
  color: "blue" | "green" | "orange";
}) {
  const colorClass =
    color === "blue"
      ? "bg-blue-50 text-blue-700"
      : color === "green"
      ? "bg-lime-100 text-lime-800"
      : "bg-orange-100 text-orange-700";

  return (
    <div className={`rounded-[1.6rem] p-5 ${colorClass}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-70">
        {label}
      </p>

      <p className="mt-2 text-xl font-black tracking-[-0.04em]">{title}</p>
    </div>
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