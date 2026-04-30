"use client";

import { useEffect, useState } from "react";
import AppNavbar from "@/components/AppNavbar";
import { supabase } from "@/lib/supabase/client";

export default function RequestChurchWorkspacePage() {
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [profileId, setProfileId] = useState("");

  const [churchName, setChurchName] = useState("");
  const [churchCity, setChurchCity] = useState("");
  const [picName, setPicName] = useState("");
  const [picEmail, setPicEmail] = useState("");
  const [picWhatsapp, setPicWhatsapp] = useState("");
  const [needsDescription, setNeedsDescription] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) return;

      setUserEmail(user.email);
      setPicEmail(user.email);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, name, email")
        .eq("email", user.email)
        .maybeSingle();

      if (profileData) {
        setProfileId(profileData.id);
        setPicName(profileData.name ?? "");
      }
    };

    loadUser();
  }, []);

  const submitRequest = async () => {
    if (!userEmail) {
      setStatus("Anda harus login terlebih dahulu untuk request church workspace.");
      return;
    }

    if (!churchName || !picName || !picEmail) {
      setStatus("Nama gereja, nama PIC, dan email PIC wajib diisi.");
      return;
    }

    setLoading(true);
    setStatus("Mengirim request church workspace...");

    const { error } = await supabase.from("church_workspace_requests").insert({
      requester_profile_id: profileId || null,
      church_name: churchName,
      church_city: churchCity,
      pic_name: picName,
      pic_email: picEmail,
      pic_whatsapp: picWhatsapp,
      needs_description: needsDescription,
      status: "PENDING",
    });

    setLoading(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setChurchName("");
    setChurchCity("");
    setPicWhatsapp("");
    setNeedsDescription("");
    setStatus("Request berhasil dikirim. KiraServe Super Admin akan melakukan review.");
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <AppNavbar />

      <section className="relative overflow-hidden px-8 pb-28 pt-16 md:px-14">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950" />
        <div className="absolute -left-[10%] top-[-20%] h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute right-[-8%] top-[10%] h-[560px] w-[560px] rounded-full bg-cyan-400/10 blur-[140px]" />

        <div className="relative z-10 mx-auto max-w-[1200px]">
          <a
            href="/dashboard"
            className="mb-10 inline-flex rounded-full border border-white/15 bg-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/70 backdrop-blur-md transition hover:bg-white/20 hover:text-white"
          >
            ← Central Dashboard
          </a>

          <p className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-100 backdrop-blur-md">
            Request Church Workspace
          </p>

          <h1 className="max-w-5xl text-5xl font-black leading-[0.95] tracking-[-0.05em] text-white md:text-7xl">
            Aktifkan KiraServe untuk gereja Anda.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100/70">
            Kirim request agar Super Admin KiraServe dapat membuat workspace gereja,
            mengaktifkan Church Management, dan assign PIC sebagai Church Admin.
          </p>
        </div>
      </section>

      <section className="relative z-20 -mt-16 rounded-t-[3rem] bg-slate-50 px-8 py-16 md:px-14">
        <div className="mx-auto grid max-w-[1200px] gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/60">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
              How It Works
            </p>

            <h2 className="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.05em]">
              Request dulu, lalu kami approve.
            </h2>

            <p className="mt-5 text-base leading-7 text-slate-500">
              Untuk menjaga kualitas dan keamanan, workspace gereja tidak dibuat
              bebas oleh user. Request akan direview oleh Super Admin KiraServe.
            </p>

            <div className="mt-8 grid gap-4">
              <Step number="01" title="Isi data gereja dan PIC" />
              <Step number="02" title="Super Admin review request" />
              <Step number="03" title="Workspace Church diaktifkan" />
              <Step number="04" title="PIC menjadi Church Admin" />
            </div>
          </div>

          <div className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/60 md:p-10">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
              Request Form
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
              Data Gereja
            </h2>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <Field label="Nama Gereja">
                <input
                  value={churchName}
                  onChange={(event) => setChurchName(event.target.value)}
                  placeholder="GSJS Pakuwon Mall"
                  className="input"
                />
              </Field>

              <Field label="Kota / Area">
                <input
                  value={churchCity}
                  onChange={(event) => setChurchCity(event.target.value)}
                  placeholder="Surabaya"
                  className="input"
                />
              </Field>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Nama PIC">
                <input
                  value={picName}
                  onChange={(event) => setPicName(event.target.value)}
                  placeholder="Nama penanggung jawab"
                  className="input"
                />
              </Field>

              <Field label="Email PIC">
                <input
                  value={picEmail}
                  onChange={(event) => setPicEmail(event.target.value)}
                  placeholder="admin@gereja.com"
                  type="email"
                  className="input"
                />
              </Field>
            </div>

            <Field label="Nomor WhatsApp PIC">
              <input
                value={picWhatsapp}
                onChange={(event) => setPicWhatsapp(event.target.value)}
                placeholder="0812xxxxxxx"
                className="input"
              />
            </Field>

            <Field label="Kebutuhan Utama">
              <textarea
                value={needsDescription}
                onChange={(event) => setNeedsDescription(event.target.value)}
                placeholder="Contoh: Kami ingin mengatur jadwal pelayan ibadah, divisi multimedia, worship, kids, dan reminder pelayanan."
                className="input min-h-36 resize-none"
              />
            </Field>

            <button
              type="button"
              onClick={submitRequest}
              disabled={loading}
              className="mt-2 w-full rounded-full bg-blue-600 px-8 py-5 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-blue-500 disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit Request →"}
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