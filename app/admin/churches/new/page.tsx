"use client";

import { useState } from "react";
import AppNavbar from "@/components/AppNavbar";
import { supabase } from "@/lib/supabase/client";

export default function NewChurchPage() {
  const [churchName, setChurchName] = useState("");
  const [slug, setSlug] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleChurchNameChange = (value: string) => {
    setChurchName(value);

    if (!slug) {
      setSlug(generateSlug(value));
    }
  };

  const handleCreate = async () => {
    if (!churchName || !slug || !adminEmail) {
      setStatus("Lengkapi nama gereja, slug, dan email admin.");
      return;
    }

    setLoading(true);
    setStatus("Membuat tenant gereja...");

    const cleanSlug = generateSlug(slug);
    const cleanEmail = adminEmail.toLowerCase().trim();

    const { data: churchData, error: churchError } = await supabase
      .from("churches")
      .insert({
        name: churchName,
        slug: cleanSlug,
        custom_domain: customDomain || null,
        plan: "free",
      })
      .select("id, name, slug")
      .single();

    if (churchError) {
      setLoading(false);
      setStatus(churchError.message);
      return;
    }

    setStatus("Membuat profile Church Admin...");

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();

    let profileId = existingProfile?.id;

    if (!profileId) {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .insert({
          name: adminName || cleanEmail,
          email: cleanEmail,
        })
        .select("id")
        .single();

      if (profileError) {
        setLoading(false);
        setStatus(profileError.message);
        return;
      }

      profileId = profileData.id;
    }

    setStatus("Memberi akses Church Admin...");

    const { error: memberError } = await supabase.from("church_members").upsert(
      {
        church_id: churchData.id,
        profile_id: profileId,
        role: "CHURCH_ADMIN",
      },
      {
        onConflict: "church_id,profile_id",
      }
    );

    if (memberError) {
      setLoading(false);
      setStatus(memberError.message);
      return;
    }

    setLoading(false);
    setStatus("Church tenant berhasil dibuat.");

    setTimeout(() => {
      window.location.href = "/admin/churches";
    }, 900);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <AppNavbar isPlatformAdmin />

      <section className="relative overflow-hidden px-8 pb-24 pt-16 md:px-14">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950" />
        <div className="absolute -left-[10%] top-[-20%] h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute right-[-8%] top-[8%] h-[560px] w-[560px] rounded-full bg-cyan-400/10 blur-[140px]" />

        <div className="relative z-10 mx-auto max-w-[1200px]">
          <a
            href="/admin/churches"
            className="mb-10 inline-flex rounded-full border border-white/15 bg-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/70 backdrop-blur-md transition hover:bg-white/20 hover:text-white"
          >
            ← Churches
          </a>

          <div className="max-w-5xl">
            <p className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-100 backdrop-blur-md">
              New Tenant
            </p>

            <h1 className="text-5xl font-black leading-[0.95] tracking-[-0.05em] text-white md:text-7xl">
              Create Church.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100/70">
              Buat tenant gereja baru dan tentukan email pertama sebagai Church
              Admin.
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-20 -mt-14 rounded-t-[3rem] bg-slate-50 px-8 py-14 md:px-14">
        <div className="mx-auto grid max-w-[1200px] gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/60">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
              Setup Flow
            </p>

            <h2 className="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.05em] text-slate-900">
              Super Admin membuat akses awal.
            </h2>

            <div className="mt-8 grid gap-4">
              <Step number="01" title="Create Church" />
              <Step number="02" title="Create / find admin profile" />
              <Step number="03" title="Assign CHURCH_ADMIN role" />
              <Step number="04" title="Church Admin login via magic link" />
            </div>

            <div className="mt-8 rounded-[2rem] border border-blue-100 bg-blue-50 p-6">
              <p className="text-sm font-bold leading-7 text-blue-700">
                KiraServe gratis untuk gereja. Untuk versi awal, tidak ada plan,
                billing, atau subscription di dashboard.
              </p>
            </div>
          </div>

          <div className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/60 md:p-10">
            <FormField
              label="Nama Gereja"
              value={churchName}
              onChange={handleChurchNameChange}
              placeholder="GSJS Pakuwon Mall"
            />

            <FormField
              label="Slug"
              value={slug}
              onChange={(value) => setSlug(generateSlug(value))}
              placeholder="gsjs"
            />

            <FormField
              label="Custom Domain / Optional"
              value={customDomain}
              onChange={setCustomDomain}
              placeholder="production.gsjschurch.com"
            />

            <FormField
              label="Nama Church Admin"
              value={adminName}
              onChange={setAdminName}
              placeholder="Admin GSJS"
            />

            <FormField
              label="Email Church Admin"
              value={adminEmail}
              onChange={setAdminEmail}
              placeholder="admin@gereja.com"
              type="email"
            />

            <button
              type="button"
              onClick={handleCreate}
              disabled={loading}
              className="mt-4 w-full rounded-full bg-blue-600 px-8 py-5 text-sm font-black uppercase tracking-[0.14em] text-white shadow-[0_0_40px_-12px_rgba(37,99,235,0.6)] transition hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Tenant →"}
            </button>

            {status && (
              <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <p className="text-sm font-bold leading-7 text-blue-700">
                  {status}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div className="mb-6">
      <label className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5 text-lg font-bold text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
      />
    </div>
  );
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