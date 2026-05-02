"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackLoading />}>
      <AuthCallbackContent />
    </Suspense>
  );
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState("Memproses login...");

  useEffect(() => {
    const handleCallback = async () => {
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      const nextParam = searchParams.get("next");

      const safeNext =
        nextParam && nextParam.startsWith("/") ? nextParam : "/dashboard";

      if (!tokenHash) {
        setStatus("Token login tidak ditemukan. Silakan kirim magic link ulang.");
        return;
      }

      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type === "recovery" ? "recovery" : "magiclink",
      });

      if (error) {
        setStatus(error.message);
        return;
      }

      router.replace(safeNext);
    };

    handleCallback();
  }, [router, searchParams]);

  return <CallbackScreen status={status} />;
}

function CallbackLoading() {
  return <CallbackScreen status="Loading callback..." />;
}

function CallbackScreen({ status }: { status: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef7ff] px-5 text-slate-900">
      <div className="w-full max-w-[520px] rounded-[2.5rem] border border-white/80 bg-white/90 p-8 text-center shadow-2xl shadow-blue-200/50 backdrop-blur-xl">
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

        <a
          href="/login"
          className="mt-7 inline-flex rounded-full border border-slate-200 px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-600 transition hover:border-blue-600 hover:text-blue-600"
        >
          Kembali ke Login
        </a>
      </div>
    </main>
  );
}