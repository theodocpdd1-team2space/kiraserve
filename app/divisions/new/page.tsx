"use client";

import { useEffect, useState } from "react";
import AppNavbar from "@/components/AppNavbar";
import { supabase } from "@/lib/supabase/client";

export default function NewDivisionPage() {
  const [churchId, setChurchId] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  useEffect(() => {
    const loadChurch = async () => {
      const { data } = await supabase
        .from("churches")
        .select("id")
        .eq("slug", "gsjs")
        .maybeSingle();

      if (data) setChurchId(data.id);
    };

    loadChurch();
  }, []);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug) setSlug(generateSlug(value));
  };

  const handleCreate = async () => {
    if (!churchId || !name || !slug) {
      setStatus("Lengkapi nama divisi dan slug.");
      return;
    }

    setLoading(true);
    setStatus("Membuat divisi...");

    const { error } = await supabase.from("divisions").insert({
      church_id: churchId,
      name,
      slug: generateSlug(slug),
      description,
    });

    setLoading(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Divisi berhasil dibuat.");

    setTimeout(() => {
      window.location.href = "/divisions";
    }, 700);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <AppNavbar />

      <section className="px-8 py-16 md:px-14">
        <div className="mx-auto max-w-[1100px]">
          <a
            href="/divisions"
            className="mb-12 inline-flex text-xs font-black uppercase tracking-[0.22em] text-slate-400 hover:text-blue-600"
          >
            ← Divisions
          </a>

          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="mb-5 text-xs font-black uppercase tracking-[0.35em] text-blue-600">
                New Division
              </p>

              <h1 className="text-6xl font-black leading-[0.95] tracking-[-0.05em] text-slate-900 md:text-7xl">
                Tambah Divisi.
              </h1>

              <p className="mt-6 text-lg leading-8 text-slate-500">
                Tambahkan divisi pelayanan baru. Setelah divisi dibuat, Church
                Admin bisa assign beberapa koordinator ke divisi tersebut.
              </p>
            </div>

            <div className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/60 md:p-10">
              <Field label="Nama Divisi">
                <input
                  value={name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  placeholder="Production"
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
                  placeholder="Deskripsi singkat divisi pelayanan."
                  className="input min-h-36 resize-none"
                />
              </Field>

              <button
                type="button"
                onClick={handleCreate}
                disabled={loading}
                className="mt-4 w-full rounded-full bg-blue-600 px-8 py-5 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-blue-500 disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create Division →"}
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
