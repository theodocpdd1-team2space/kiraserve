"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackLoading />}>
      <AuthCallbackContent />
    </Suspense>
  );
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextParam = searchParams.get("next");
  const safeNext =
    nextParam && nextParam.startsWith("/") ? nextParam : "/dashboard";

  const [status, setStatus] = useState("Memproses login...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const hash = window.location.hash;

        if (hash) {
          const params = new URLSearchParams(hash.replace("#", ""));

          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");

          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              setStatus(error.message);
              return;
            }

            window.history.replaceState(
              null,
              "",
              `/auth/callback?next=${encodeURIComponent(safeNext)}`
            );

            router.replace(safeNext);
            return;
          }
        }

        const { data } = await supabase.auth.getSession();

        if (data.session) {
          router.replace(safeNext);
          return;
        }

        setStatus("Session tidak ditemukan. Silakan login ulang.");
      } catch (error: any) {
        setStatus(error?.message ?? "Terjadi error saat memproses login.");
      }
    };

    handleCallback();
  }, [router, safeNext]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#eef7ff] via-white to-[#f8efff] px-5 text-slate-900">
      <div className="w-full max-w-[440px] rounded-[2.5rem] border border-white/80 bg-white/90 p-8 text-center shadow-2xl shadow-blue-200/50 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-blue-600 to-cyan-400 text-2xl font-black text-white shadow-lg shadow-blue-300/50">
          K
        </div>

        <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-blue-600">
          Auth Callback
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950">
          Menyiapkan akses.
        </h1>

        <p className="mt-4 text-sm font-bold leading-7 text-slate-500">
          {status}
        </p>

        {status.includes("tidak ditemukan") ||
        status.includes("error") ||
        status.includes("Error") ? (
          <a
            href="/login"
            className="mt-6 inline-flex rounded-2xl bg-slate-900 px-6 py-4 text-sm font-black text-white transition hover:bg-blue-600"
          >
            Kembali ke Login
          </a>
        ) : null}
      </div>
    </main>
  );
}

function AuthCallbackLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef7ff] px-5 text-slate-900">
      <div className="rounded-[2rem] bg-white p-8 shadow-xl shadow-blue-200/40">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">
          Loading auth callback...
        </p>
      </div>
    </main>
  );
}