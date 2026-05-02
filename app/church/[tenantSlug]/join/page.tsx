"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import AppNavbar from "@/components/AppNavbar"; // Pastikan Anda menyesuaikan atau menyembunyikan navbar jika ingin tampilan full card
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
  const searchParams = useSearchParams();

  const tenantSlug = String(params.tenantSlug);
  const codeFromUrl = searchParams.get("code") ?? "";

  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingLogin, setCheckingLogin] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<InviteCode | null>(null);
  const [joinedData, setJoinedData] = useState<InviteCode | null>(null);

  useEffect(() => {
    const loadInitialState = async () => {
      const cleanCode = codeFromUrl.trim().toUpperCase();

      if (cleanCode) {
        setCode(cleanCode);
        await loadInvitePreview(cleanCode);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUserEmail(user?.email ?? null);
      setCheckingLogin(false);
    };

    loadInitialState();
  }, [codeFromUrl]);

  const loadInvitePreview = async (targetCode: string) => {
    const cleanCode = targetCode.trim().toUpperCase();

    if (!cleanCode) {
      setPreviewData(null);
      return;
    }

    setPreviewLoading(true);

    const { data, error } = await supabase
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

    setPreviewLoading(false);

    if (error || !data) {
      setPreviewData(null);
      return;
    }

    setPreviewData(mapInviteCode(data));
  };

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
      setUserEmail(null);
      setStatus("Anda harus login terlebih dahulu sebelum menggunakan kode.");
      return;
    }

    setUserEmail(user.email);

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

  const activeData = joinedData ?? previewData;
  const detectedChurchSlug = activeData?.churches?.slug ?? tenantSlug;

  const loginHref = `/login?redirect=${encodeURIComponent(
    `/church/${tenantSlug}/join${code ? `?code=${code}` : ""}`
  )}`;

  const churchName = previewLoading
    ? "Loading..."
    : activeData?.churches?.name ?? "Church Name";

  const divisionName = previewLoading
    ? "Loading..."
    : activeData?.divisions?.name ?? "Church Level";

  const inviteStatus = getInviteStatus(activeData);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-white to-[#F9F0FF] p-4 md:p-8 flex items-center justify-center font-sans text-slate-900 selection:bg-purple-200">
      {/* Jika Anda butuh AppNavbar, biarkan. Jika tidak, bisa dikomen. */}
      {/* <AppNavbar mode="central" /> */}

      <div className="w-full max-w-[900px] bg-white rounded-[2rem] md:rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 md:p-12 relative overflow-hidden">
        
        {/* Top bar (Dashboard & Profile icon) */}
        <div className="flex justify-between items-center mb-10 md:mb-16">
          <a
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Dashboard
          </a>
          
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
             {/* Fallback avatar jika tidak ada foto profil */}
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
               <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
               <circle cx="12" cy="7" r="4"></circle>
             </svg>
          </div>
        </div>

        {/* Main Header Area */}
        <div className="text-center max-w-3xl mx-auto mb-12 relative z-10">
          {/* Decorative Doodles (Stars) */}
          <svg className="absolute -top-6 -left-4 md:-left-12 w-12 h-12 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
             <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <svg className="absolute top-16 -right-2 md:-right-8 w-8 h-8 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
             <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <svg className="absolute bottom-4 -left-6 md:-left-16 w-10 h-10 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
             <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>

          <h1 className="text-3xl md:text-5xl font-black tracking-[-0.03em] text-slate-900 leading-tight mb-3">
            Congratulation you are invited to Join Team:
          </h1>
          
          <div className="inline-block relative">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
              {churchName}
            </h2>
            {/* Custom doodle underline */}
            <svg className="absolute -bottom-3 left-0 w-full h-4 text-purple-400" preserveAspectRatio="none" viewBox="0 0 100 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M2 15 Q 25 5, 50 12 T 98 10" />
            </svg>
          </div>
          
          <h3 className="text-2xl md:text-4xl font-bold text-slate-800 mt-5">
            {divisionName}
          </h3>
        </div>

        {/* Action Form */}
        <div className="max-w-xl mx-auto">
          <label className="block text-sm font-semibold text-slate-600 mb-2">
            Enter your invite code
          </label>
          <input
            value={code}
            onChange={async (event) => {
              const value = event.target.value.toUpperCase();
              setCode(value);
              setStatus("");
              setJoinedData(null);
              await loadInvitePreview(value);
            }}
            placeholder="CODE-HERE"
            className="w-full rounded-2xl border-2 border-slate-200 bg-white px-6 py-4 text-center text-lg font-bold tracking-[0.15em] uppercase text-slate-900 placeholder:text-slate-300 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
          />

          {/* Status Cards */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {/* Status Kode Card */}
            <div className="rounded-2xl bg-[#E2F7E4] p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center text-green-700">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-green-800/70">Code Status</p>
                <p className="text-sm font-bold text-green-900">{inviteStatus}</p>
              </div>
            </div>

            {/* User Login Card */}
            <div className="rounded-2xl bg-[#E2EEFF] p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center text-blue-700">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-blue-800/70">User Login</p>
                <p className="text-sm font-bold text-blue-900 truncate">
                  {checkingLogin ? "Checking..." : userEmail ? userEmail : "Belum login"}
                </p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-6">
            {!checkingLogin && !userEmail ? (
              <a
                href={loginHref}
                className="flex w-full justify-center rounded-2xl bg-slate-900 px-6 py-5 text-base font-bold text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Login to Redeem Code
              </a>
            ) : (
              <button
                type="button"
                onClick={redeemCode}
                disabled={loading || checkingLogin}
                className="w-full rounded-2xl bg-[#A88BFA] px-6 py-5 text-base font-bold text-white shadow-lg shadow-purple-200 transition hover:-translate-y-0.5 hover:bg-[#9372F9] disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? "Processing..." : "Redeem Code"}
              </button>
            )}
          </div>

          {/* Status & Success Messages */}
          {status && (
            <div className={`mt-4 rounded-xl p-4 text-center text-sm font-semibold ${joinedData ? 'bg-[#E2F7E4] text-green-800' : 'bg-slate-100 text-slate-700'}`}>
              {status}
              
              {joinedData && (
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <a
                    href={`/church/${detectedChurchSlug}/dashboard`}
                    className="rounded-full bg-slate-900 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
                  >
                    Open Church Workspace
                  </a>
                </div>
              )}
            </div>
          )}

          {/* How It Works Mini Guide */}
          <div className="mt-10">
            <p className="text-sm font-bold text-slate-800 mb-4">How It Works</p>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                 <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-500">
                    <span className="text-xs font-black">1</span>
                 </div>
                 <p className="text-xs font-medium text-slate-600 leading-tight">Enter your invite code</p>
              </div>
              <div className="flex-1 flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                 <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-500">
                    <span className="text-xs font-black">2</span>
                 </div>
                 <p className="text-xs font-medium text-slate-600 leading-tight">System detects church/div</p>
              </div>
              <div className="flex-1 flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                 <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-500">
                    <span className="text-xs font-black">3</span>
                 </div>
                 <p className="text-xs font-medium text-slate-600 leading-tight">Click redeem to join team</p>
              </div>
            </div>
          </div>

        </div>
      </div>
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

function getInviteStatus(invite: InviteCode | null) {
  if (!invite) return "Waiting...";

  const expired = invite.expires_at
    ? new Date(invite.expires_at).getTime() < Date.now()
    : false;

  const usedUp = invite.used_count >= invite.max_uses;

  if (!invite.is_active) return "Inactive";
  if (expired) return "Expired";
  if (usedUp) return "Full Quota";

  return "Active";
}