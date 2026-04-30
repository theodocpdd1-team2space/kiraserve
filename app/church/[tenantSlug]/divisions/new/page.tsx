"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppNavbar from "@/components/AppNavbar";
import { supabase } from "@/lib/supabase/client";
import { getChurchAccess } from "@/lib/church/access";

export default function NewDivisionPage() {
  const params = useParams();
  const tenantSlug = String(params.tenantSlug);

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const [churchId, setChurchId] = useState("");
  const [churchName, setChurchName] = useState("");
  const [churchRole, setChurchRole] = useState<string | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  const [status, setStatus] = useState("");

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  useEffect(() => {
    const load = async () => {
      setPageLoading(true);

      const access = await getChurchAccess(tenantSlug);

      if (!access.allowed) {
        setRedirecting(true);
        window.location.href = "/dashboard";
        return;
      }

      setChurchRole(access.churchRole);
      setIsPlatformAdmin(access.isPlatformAdmin);

      if (!access.churchId) {
        setRedirecting(true);
        window.location.href = "/dashboard";
        return;
      }

      const canCreateDivision =
        access.isPlatformAdmin || access.churchRole === "CHURCH_ADMIN";

      if (!canCreateDivision) {
        setRedirecting(true);
        window.location.href = `/church/${tenantSlug}/divisions`;
        return;
      }

      setChurchId(access.churchId);
      setChurchName(access.churchName ?? "Church Workspace");

      setPageLoading(false);
    };

    if (tenantSlug) {
      load();
    }
  }, [tenantSlug]);

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(generateSlug(value));
  };

  const createDivision = async () => {
    if (!churchId) {
      setStatus("Church workspace tidak ditemukan.");
      return;
    }

    if (!name.trim()) {
      setStatus("Nama divisi wajib diisi.");
      return;
    }

    if (!slug.trim()) {
      setStatus("Slug divisi wajib diisi.");
      return;
    }

    setSaving(true);
    setStatus("Membuat divisi...");

    const { error } = await supabase.from("divisions").insert({
      church_id: churchId,
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
    });

    setSaving(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Divisi berhasil dibuat.");
    window.location.href = `/church/${tenantSlug}/divisions`;
  };

  if (pageLoading || redirecting) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800">
        <AppNavbar
          mode="church"
          tenantSlug={tenantSlug}
          isPlatformAdmin={isPlatformAdmin}
          churchRole={churchRole}
        />

        <div className="mx-auto max-w-[1400px] px-8 py-24 md:px-14">
          <p className="text-lg font-bold text-slate-500">
            {redirecting ? "Redirecting..." : "Loading create division..."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <AppNavbar
        mode="church"
        tenantSlug={tenantSlug}
        isPlatformAdmin={isPlatformAdmin}
        churchRole={churchRole}
      />

      <section className="relative overflow-hidden px-8 pb-28 pt-16 md:px-14">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-indigo-950 to-blue-900" />
        <div className="absolute -left-[10%] top-[-20%] h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute right-[-8%] top-[10%] h-[560px] w-[560px] rounded-full bg-cyan-400/10 blur-[140px]" />

        <div className="relative z-10 mx-auto max-w-[1200px]">
          <a
            href={`/church/${tenantSlug}/divisions`}
            className="mb-10 inline-flex rounded-full border border-white/15 bg-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/70 backdrop-blur-md transition hover:bg-white/20 hover:text-white"
          >
            ← Divisions
          </a>

          <p className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-100 backdrop-blur-md">
            New Division
          </p>

          <h1 className="max-w-5xl text-5xl font-black leading-[0.95] tracking-[-0.05em] text-white md:text-7xl">
            Buat divisi pelayanan.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100/70">
            Tambahkan divisi baru untuk <b>{churchName}</b>, misalnya Production,
            Worship, Kids, Youth, Usher, atau divisi pelayanan lainnya.
          </p>
        </div>
      </section>

      <section className="relative z-20 -mt-16 rounded-t-[3rem] bg-slate-50 px-8 py-16 md:px-14">
        <div className="mx-auto grid max-w-[1200px] gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/60">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
              Division Guide
            </p>

            <h2 className="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.05em] text-slate-900">
              Divisi adalah pusat koordinasi.
            </h2>

            <p className="mt-5 text-base leading-7 text-slate-500">
              Setiap divisi bisa punya koordinator, servant/member, serving role,
              dan jadwal pelayanannya sendiri.
            </p>

            <div className="mt-8 grid gap-4">
              <Step number="01" title="Buat divisi pelayanan" />
              <Step number="02" title="Tambahkan koordinator divisi" />
              <Step number="03" title="Buat serving role / skill" />
              <Step number="04" title="Mulai buat jadwal pelayanan" />
            </div>
          </div>

          <div className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/60 md:p-10">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
              Division Form
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-900">
              Detail Divisi
            </h2>

            <div className="mt-8">
              <Field label="Nama Divisi">
                <input
                  value={name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  placeholder="Production / Worship / Kids / Youth"
                  className="input"
                />
              </Field>

              <Field label="Slug">
                <input
                  value={slug}
                  onChange={(event) => setSlug(generateSlug(event.target.value))}
                  placeholder="production"
                  className="input"
                />
              </Field>

              <Field label="Deskripsi">
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Contoh: Tim multimedia, camera, switcher, ProPresenter, Resolume, lighting, dan audio visual."
                  className="input min-h-36 resize-none"
                />
              </Field>

              <button
                type="button"
                onClick={createDivision}
                disabled={saving}
                className="mt-2 w-full rounded-full bg-blue-600 px-8 py-5 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-blue-500 disabled:opacity-60"
              >
                {saving ? "Creating..." : "Create Division →"}
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
        </div>
      </section>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgb(226 232 240);
          background: rgb(248 250 252);
          padding: 1.1rem 1.25rem;
          font-size: 1rem;
          font-weight: 700;
          color: rgb(15 23 42);
          outline: none;
        }

        .input:focus {
          border-color: rgb(37 99 235);
          background: white;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }
      `}</style>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <label className="mb-3 block text-xs font-black uppercase tracking-[0.24em] text-slate-400">
        {label}
      </label>
      {children}
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