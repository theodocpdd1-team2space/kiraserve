"use client";

import { useEffect, useState } from "react";
import AppNavbar from "@/components/AppNavbar";
import { supabase } from "@/lib/supabase/client";

type Division = {
  id: string;
  name: string;
  slug: string;
};

type Category = {
  id: string;
  name: string;
};

export default function NewSchedulePage() {
  const [loading, setLoading] = useState(false);
  const [churchId, setChurchId] = useState("");
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [divisionId, setDivisionId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: church } = await supabase
        .from("churches")
        .select("id")
        .eq("slug", "gsjs")
        .maybeSingle();

      if (!church) return;

      setChurchId(church.id);

      const { data: divisionsData } = await supabase
        .from("divisions")
        .select("id, name, slug")
        .eq("church_id", church.id)
        .order("name");

      setDivisions(divisionsData ?? []);
    };

    load();
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      if (!divisionId) return;

      const { data } = await supabase
        .from("schedule_categories")
        .select("id, name")
        .eq("division_id", divisionId)
        .order("name");

      setCategories(data ?? []);
    };

    loadCategories();
  }, [divisionId]);

  const createSchedule = async () => {
    if (!churchId || !divisionId || !title) {
      setStatus("Lengkapi divisi dan judul jadwal.");
      return;
    }

    setLoading(true);
    setStatus("Membuat jadwal...");

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const { error } = await supabase.from("schedules").insert({
      church_id: churchId,
      division_id: divisionId,
      category_id: categoryId || null,
      title,
      description,
      schedule_type: "TABLE_MONTHLY",
      visibility,
      share_slug: slug,
      table_json: {
        columns: ["Role", "Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4"],
        rows: [
          {
            label: "PIC",
            cells: ["-", "-", "-", "-"],
          },
        ],
      },
    });

    setLoading(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    window.location.href = "/schedules";
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <AppNavbar />

      <section className="px-8 py-16 md:px-14">
        <div className="mx-auto max-w-[1100px]">
          <a
            href="/schedules"
            className="mb-12 inline-flex text-xs font-black uppercase tracking-[0.22em] text-slate-400 hover:text-blue-600"
          >
            ← Schedules
          </a>

          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="mb-5 text-xs font-black uppercase tracking-[0.35em] text-blue-600">
                New Schedule
              </p>

              <h1 className="text-6xl font-black leading-[0.95] tracking-[-0.05em] text-slate-900 md:text-7xl">
                Buat Jadwal.
              </h1>

              <p className="mt-6 text-lg leading-8 text-slate-500">
                Buat jadwal pelayanan baru untuk divisi gereja. Untuk awal,
                jadwal dibuat sebagai table bulanan sederhana.
              </p>
            </div>

            <div className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/60 md:p-10">
              <Field label="Judul Jadwal">
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Production Schedule - Juni 2026"
                  className="input"
                />
              </Field>

              <Field label="Deskripsi">
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Deskripsi singkat jadwal."
                  className="input min-h-32 resize-none"
                />
              </Field>

              <Field label="Divisi">
                <select
                  value={divisionId}
                  onChange={(event) => {
                    setDivisionId(event.target.value);
                    setCategoryId("");
                  }}
                  className="input"
                >
                  <option value="">Pilih divisi</option>
                  {divisions.map((division) => (
                    <option key={division.id} value={division.id}>
                      {division.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Kategori">
                <select
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  className="input"
                >
                  <option value="">Tanpa kategori</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Visibility">
                <select
                  value={visibility}
                  onChange={(event) => setVisibility(event.target.value)}
                  className="input"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Private</option>
                  <option value="LINK_ONLY">Link Only</option>
                </select>
              </Field>

              <button
                type="button"
                onClick={createSchedule}
                disabled={loading}
                className="mt-4 w-full rounded-full bg-blue-600 px-8 py-5 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-blue-500 disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create Schedule →"}
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
