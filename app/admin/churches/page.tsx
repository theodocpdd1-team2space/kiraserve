"use client";

import { useEffect, useState } from "react";
import AppNavbar from "@/components/AppNavbar";
import { supabase } from "@/lib/supabase/client";

type Church = {
  id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  created_at: string;
};

type ChurchAdmin = {
  church_id: string;
  role: string;
  profiles: {
    name: string | null;
    email: string;
  } | null;
};

export default function AdminChurchesPage() {
  const [loading, setLoading] = useState(true);
  const [churches, setChurches] = useState<Church[]>([]);
  const [admins, setAdmins] = useState<ChurchAdmin[]>([]);

  useEffect(() => {
    const loadChurches = async () => {
      setLoading(true);

      const { data: churchesData, error: churchesError } = await supabase
        .from("churches")
        .select("id, name, slug, custom_domain, created_at")
        .order("created_at", { ascending: false });

      if (churchesError) {
        console.log("Churches error:", churchesError);
      }

      const { data: adminsData, error: adminsError } = await supabase
        .from("church_members")
        .select(
          `
          church_id,
          role,
          profiles (
            name,
            email
          )
        `
        )
        .eq("role", "CHURCH_ADMIN");

      if (adminsError) {
        console.log("Admins error:", adminsError);
      }

      setChurches((churchesData as Church[]) ?? []);
      setAdmins((adminsData as ChurchAdmin[]) ?? []);
      setLoading(false);
    };

    loadChurches();
  }, []);

  const getChurchAdmin = (churchId: string) => {
    return admins.find((admin) => admin.church_id === churchId);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <AppNavbar isPlatformAdmin />

      <section className="relative overflow-hidden px-8 pb-24 pt-16 md:px-14">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950" />
        <div className="absolute -left-[10%] top-[-20%] h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute right-[-8%] top-[8%] h-[560px] w-[560px] rounded-full bg-cyan-400/10 blur-[140px]" />

        <div className="relative z-10 mx-auto max-w-[1400px]">
          <a
            href="/admin"
            className="mb-10 inline-flex rounded-full border border-white/15 bg-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/70 backdrop-blur-md transition hover:bg-white/20 hover:text-white"
          >
            ← Admin Dashboard
          </a>

          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-100 backdrop-blur-md">
                Churches
              </p>

              <h1 className="max-w-5xl text-5xl font-black leading-[0.95] tracking-[-0.05em] text-white md:text-7xl">
                Church Tenants.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100/70">
                Kelola gereja yang menggunakan KiraServe dan akses Church Admin
                pertama untuk setiap tenant.
              </p>
            </div>

            <a
              href="/admin/churches/new"
              className="w-fit rounded-full bg-white px-8 py-4 text-sm font-black uppercase tracking-[0.14em] text-slate-900 transition hover:-translate-y-0.5 hover:bg-blue-100"
            >
              Create Church →
            </a>
          </div>
        </div>
      </section>

      <section className="relative z-20 -mt-14 rounded-t-[3rem] bg-slate-50 px-8 py-14 md:px-14">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <StatCard
              label="Total Churches"
              value={String(churches.length)}
              desc="Tenant gereja yang sudah dibuat."
            />
            <StatCard
              label="Active Churches"
              value={String(churches.length)}
              desc="Untuk MVP, semua tenant dianggap aktif."
            />
            <StatCard
              label="Church Admins"
              value={String(admins.length)}
              desc="Admin gereja yang sudah diassign."
            />
          </div>

          <div className="rounded-[2.5rem] bg-white p-6 shadow-xl shadow-slate-200/60 md:p-8">
            <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
                  Tenant List
                </p>
                <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-900">
                  Gereja Terdaftar
                </h2>
              </div>

              <a
                href="/admin/churches/new"
                className="w-fit rounded-full border border-slate-200 px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-600 transition hover:border-blue-600 hover:text-blue-600"
              >
                Add Tenant
              </a>
            </div>

            {loading ? (
              <p className="text-lg font-bold text-slate-500">
                Loading churches...
              </p>
            ) : churches.length > 0 ? (
              <div className="grid gap-4">
                {churches.map((church) => {
                  const admin = getChurchAdmin(church.id);

                  return (
                    <article
                      key={church.id}
                      className="grid gap-5 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-6 transition hover:border-blue-200 hover:bg-white hover:shadow-lg hover:shadow-blue-900/5 lg:grid-cols-[1fr_1fr_160px] lg:items-center"
                    >
                      <div>
                        <h3 className="text-2xl font-black tracking-[-0.04em] text-slate-900">
                          {church.name}
                        </h3>

                        <p className="mt-2 text-sm font-bold text-slate-500">
                          /{church.slug}
                        </p>

                        {church.custom_domain && (
                          <p className="mt-1 text-sm text-slate-400">
                            {church.custom_domain}
                          </p>
                        )}
                      </div>

                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                          Church Admin
                        </p>

                        <p className="mt-2 text-sm font-black text-slate-800">
                          {admin?.profiles?.name ?? "Belum ada nama"}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {admin?.profiles?.email ?? "Belum ada admin"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3 lg:justify-end">
                        <span className="w-fit rounded-full bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-600">
                          Active
                        </span>

                        <a
                          href={`/admin/churches/${church.slug}`}
                          className="w-fit rounded-full bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-blue-600"
                        >
                          Manage
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[2rem] bg-slate-50 p-10 text-center">
                <h2 className="text-4xl font-black tracking-[-0.05em] text-slate-900">
                  Belum ada church.
                </h2>

                <p className="mt-4 text-slate-500">
                  Buat tenant gereja pertama lewat tombol Create Church.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  desc,
}: {
  label: string;
  value: string;
  desc: string;
}) {
  return (
    <article className="rounded-[2rem] bg-white p-7 shadow-xl shadow-slate-200/60">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
        {label}
      </p>

      <p className="mt-5 text-5xl font-black tracking-[-0.06em] text-slate-900">
        {value}
      </p>

      <p className="mt-4 text-sm leading-6 text-slate-500">{desc}</p>
    </article>
  );
}