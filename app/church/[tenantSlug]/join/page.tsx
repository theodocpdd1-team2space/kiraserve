"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import AppNavbar from "@/components/AppNavbar";
import { supabase } from "@/lib/supabase/client";

type InviteCode = {
  id: string;
  church_id: string;
  division_id: string | null;
  code: string;
  role_to_assign: string;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  churches: {
    name: string;
    slug: string;
  } | null;
  divisions: {
    name: string;
    slug: string;
  } | null;
};

export default function JoinPage() {
  const params = useParams();
  const tenantSlug = String(params.tenantSlug);

  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [joinedData, setJoinedData] = useState<InviteCode | null>(null);

  const redeemCode = async () => {
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      setStatus("Masukkan invite code terlebih dahulu.");
      return;
    }

    setLoading(true);
    setStatus("Memeriksa kode...");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      setLoading(false);
      setStatus("Anda harus login terlebih dahulu sebelum menggunakan kode.");
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, name")
      .eq("email", user.email)
      .maybeSingle();

    let profileId = profileData?.id;

    if (profileError) {
      setLoading(false);
      setStatus(profileError.message);
      return;
    }

    if (!profileId) {
      const { data: newProfile, error: newProfileError } = await supabase
        .from("profiles")
        .insert({
          user_id: user.id,
          email: user.email,
          name: user.email,
        })
        .select("id")
        .single();

      if (newProfileError) {
        setLoading(false);
        setStatus(newProfileError.message);
        return;
      }

      profileId = newProfile.id;
    }

    setStatus("Validasi invite code...");

    const { data: inviteCode, error: inviteError } = await supabase
      .from("invite_codes")
      .select(
        `
        id,
        church_id,
        division_id,
        code,
        role_to_assign,
        max_uses,
        used_count,
        expires_at,
        is_active,
        churches (
          name,
          slug
        ),
        divisions (
          name,
          slug
        )
      `
      )
      .eq("code", cleanCode)
      .maybeSingle();

    if (inviteError) {
      setLoading(false);
      setStatus(inviteError.message);
      return;
    }

    if (!inviteCode) {
      setLoading(false);
      setStatus("Invite code tidak ditemukan.");
      return;
    }

    const codeData = mapInviteCode(inviteCode);

    if (!codeData.churches?.slug) {
      setLoading(false);
      setStatus("Data church dari invite code tidak ditemukan.");
      return;
    }

    if (!codeData.is_active) {
      setLoading(false);
      setStatus("Invite code sudah tidak aktif.");
      return;
    }

    if (
      codeData.expires_at &&
      new Date(codeData.expires_at).getTime() < Date.now()
    ) {
      setLoading(false);
      setStatus("Invite code sudah expired.");
      return;
    }

    if (codeData.used_count >= codeData.max_uses) {
      setLoading(false);
      setStatus("Invite code sudah mencapai batas penggunaan.");
      return;
    }

    const { data: existingUse, error: existingUseError } = await supabase
      .from("invite_code_uses")
      .select("id")
      .eq("invite_code_id", codeData.id)
      .eq("profile_id", profileId)
      .maybeSingle();

    if (existingUseError) {
      setLoading(false);
      setStatus(existingUseError.message);
      return;
    }

    if (existingUse) {
      setLoading(false);
      setJoinedData(codeData);
      setStatus(
        `Anda sudah pernah menggunakan invite code ini. Akses ke ${codeData.churches.name} sudah aktif.`
      );
      return;
    }

    setStatus(`Menghubungkan Anda ke ${codeData.churches.name}...`);

    const churchRole =
      codeData.role_to_assign === "CHURCH_ADMIN" ? "CHURCH_ADMIN" : "SERVANT";

    const { error: churchMemberError } = await supabase
      .from("church_members")
      .upsert(
        {
          church_id: codeData.church_id,
          profile_id: profileId,
          role: churchRole,
        },
        {
          onConflict: "church_id,profile_id",
        }
      );

    if (churchMemberError) {
      setLoading(false);
      setStatus(churchMemberError.message);
      return;
    }

    if (codeData.division_id) {
      setStatus(`Menghubungkan Anda ke divisi ${codeData.divisions?.name}...`);

      const divisionRole =
        codeData.role_to_assign === "DIVISION_COORDINATOR"
          ? "DIVISION_COORDINATOR"
          : "SERVANT";

      const { error: divisionMemberError } = await supabase
        .from("division_members")
        .upsert(
          {
            church_id: codeData.church_id,
            division_id: codeData.division_id,
            profile_id: profileId,
            role: divisionRole,
          },
          {
            onConflict: "division_id,profile_id",
          }
        );

      if (divisionMemberError) {
        setLoading(false);
        setStatus(divisionMemberError.message);
        return;
      }
    }

    const { error: useError } = await supabase.from("invite_code_uses").insert({
      invite_code_id: codeData.id,
      profile_id: profileId,
    });

    if (useError) {
      setLoading(false);
      setStatus(useError.message);
      return;
    }

    const { error: updateError } = await supabase
      .from("invite_codes")
      .update({
        used_count: codeData.used_count + 1,
      })
      .eq("id", codeData.id)
      .eq("church_id", codeData.church_id);

    if (updateError) {
      setLoading(false);
      setStatus(updateError.message);
      return;
    }

    setLoading(false);
    setJoinedData(codeData);
    setStatus(
      `Berhasil join ${codeData.churches.name}. Anda sudah mendapatkan akses.`
    );
  };

  const detectedChurchSlug = joinedData?.churches?.slug ?? tenantSlug;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <AppNavbar mode="central" />

      <section className="relative overflow-hidden px-8 pb-24 pt-16 md:px-14">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-indigo-950 to-blue-900" />
        <div className="absolute -left-[10%] top-[-20%] h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute right-[-8%] top-[8%] h-[560px] w-[560px] rounded-full bg-cyan-400/10 blur-[140px]" />

        <div className="relative z-10 mx-auto max-w-[1100px]">
          <a
            href="/dashboard"
            className="mb-10 inline-flex rounded-full border border-white/15 bg-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/70 backdrop-blur-md transition hover:bg-white/20 hover:text-white"
          >
            ← Central Dashboard
          </a>

          <p className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-100 backdrop-blur-md">
            Join KiraServe
          </p>

          <h1 className="max-w-5xl text-5xl font-black leading-[0.95] tracking-[-0.05em] text-white md:text-7xl">
            Masukkan kode undangan.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100/70">
            Sistem akan otomatis mendeteksi church dan divisi dari invite code
            yang Anda masukkan.
          </p>
        </div>
      </section>

      <section className="relative z-20 -mt-14 rounded-t-[3rem] bg-slate-50 px-8 py-14 md:px-14">
        <div className="mx-auto grid max-w-[1100px] gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/60">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
              How It Works
            </p>

            <h2 className="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.05em] text-slate-900">
              Join otomatis berdasarkan kode.
            </h2>

            <p className="mt-5 text-base leading-7 text-slate-500">
              Anda tidak perlu memilih gereja secara manual. Setiap invite code
              sudah terhubung ke church dan divisi tertentu.
            </p>

            <div className="mt-8 grid gap-4">
              <Step number="01" title="Login pakai email" />
              <Step number="02" title="Masukkan kode undangan" />
              <Step number="03" title="Sistem mendeteksi church/divisi" />
              <Step number="04" title="Akses otomatis aktif" />
            </div>
          </div>

          <div className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/60 md:p-10">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
              Redeem Code
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-900">
              Masukkan Kode
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-500">
              Contoh kode: <b>PRODUCTION-SERVANT-ABC123</b>
            </p>

            <div className="mt-8">
              <label className="mb-3 block text-xs font-black uppercase tracking-[0.24em] text-slate-400">
                Invite Code
              </label>

              <input
                value={code}
                onChange={(event) => {
                  setCode(event.target.value.toUpperCase());
                  setStatus("");
                }}
                placeholder="MASUKKAN-KODE"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5 text-lg font-black uppercase tracking-[0.08em] text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />

              <button
                type="button"
                onClick={redeemCode}
                disabled={loading}
                className="mt-6 w-full rounded-full bg-blue-600 px-8 py-5 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-blue-500 disabled:opacity-60"
              >
                {loading ? "Processing..." : "Join Now →"}
              </button>

              {status && (
                <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                  <p className="text-sm font-bold leading-7 text-blue-700">
                    {status}
                  </p>
                </div>
              )}

              {joinedData && (
                <div className="mt-6 rounded-[2rem] border border-emerald-100 bg-emerald-50 p-6">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
                    Access Granted
                  </p>

                  <h3 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-900">
                    {joinedData.churches?.name}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-emerald-700">
                    Role: <b>{joinedData.role_to_assign}</b>
                    <br />
                    Divisi:{" "}
                    <b>{joinedData.divisions?.name ?? "Church Level"}</b>
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <a
                      href={`/church/${detectedChurchSlug}/dashboard`}
                      className="inline-flex rounded-full bg-slate-900 px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-blue-600"
                    >
                      Open Church →
                    </a>

                    <a
                      href="/dashboard"
                      className="inline-flex rounded-full border border-emerald-200 px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                    >
                      Central Dashboard
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function mapInviteCode(raw: any): InviteCode {
  return {
    id: raw.id,
    church_id: raw.church_id,
    division_id: raw.division_id,
    code: raw.code,
    role_to_assign: raw.role_to_assign,
    max_uses: raw.max_uses,
    used_count: raw.used_count,
    expires_at: raw.expires_at,
    is_active: raw.is_active,
    churches: Array.isArray(raw.churches)
      ? raw.churches[0] ?? null
      : raw.churches,
    divisions: Array.isArray(raw.divisions)
      ? raw.divisions[0] ?? null
      : raw.divisions,
  };
}

function Step({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-sm font-black text-blue-600">
        {number}
      </span>

      <p className="text-sm font-black text-slate-700">{title}</p>
    </div>
  );
}