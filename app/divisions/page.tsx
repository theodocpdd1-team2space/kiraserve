"use client";

import { useEffect, useState } from "react";
import AppNavbar from "@/components/AppNavbar";
import { supabase } from "@/lib/supabase/client";

type Profile = {
  id: string;
  email: string;
  name: string | null;
};

type Church = {
  id: string;
  name: string;
  slug: string;
};

type Division = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

type DivisionMember = {
  division_id: string;
  role: string;
  profiles: {
    name: string | null;
    email: string;
  } | null;
};

export default function DivisionsPage() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [church, setChurch] = useState<Church | null>(null);
  const [churchRole, setChurchRole] = useState<string | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [members, setMembers] = useState<DivisionMember[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setLoading(false);
        return;
      }

      setUserEmail(user.email);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, email, name")
        .eq("email", user.email)
        .maybeSingle();

      if (!profileData) {
        setLoading(false);
        return;
      }

      setProfile(profileData);

      const { data: platformAdminData } = await supabase
        .from("platform_admins")
        .select("role")
        .eq("profile_id", profileData.id)
        .maybeSingle();

      setIsPlatformAdmin(platformAdminData?.role === "KIRASERVE_SUPER_ADMIN");

      const { data: churchData } = await supabase
        .from("churches")
        .select("id, name, slug")
        .eq("slug", "gsjs")
        .maybeSingle();

      if (!churchData) {
        setLoading(false);
        return;
      }

      setChurch(churchData);

      const { data: churchMemberData } = await supabase
        .from("church_members")
        .select("role")
        .eq("church_id", churchData.id)
        .eq("profile_id", profileData.id)
        .maybeSingle();

      setChurchRole(churchMemberData?.role ?? null);

      const { data: divisionsData } = await supabase
        .from("divisions")
        .select("id, name, slug, description")
        .eq("church_id", churchData.id)
        .order("name");

      setDivisions(divisionsData ?? []);

      const { data: membersData } = await supabase
        .from("division_members")
        .select(
          `
          division_id,
          role,
          profiles (
            name,
            email
          )
        `
        )
        .eq("church_id", churchData.id)
        .eq("role", "DIVISION_COORDINATOR");

      setMembers((membersData as DivisionMember[]) ?? []);
      setLoading(false);
    };

    load();
  }, []);

  const canManageDivisions = isPlatformAdmin || churchRole === "CHURCH_ADMIN";

  const HIDDEN_SYSTEM_EMAILS = ["kiratechindustries@gmail.com"];

  const getCoordinators = (divisionId: string) => {
    return members.filter((member) => {
      const email = member.profiles?.email?.toLowerCase();

      return (
        member.division_id === divisionId &&
        !HIDDEN_SYSTEM_EMAILS.includes(email ?? "")
      );
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800">
        <AppNavbar isPlatformAdmin={isPlatformAdmin} churchRole={churchRole} />
        <div className="mx-auto max-w-[1400px] px-8 py-24 md:px-14">
          <p className="text-lg font-bold text-slate-500">
            Loading divisions...
          </p>
        </div>
      </main>
    );
  }

  if (!userEmail) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800">
        <AppNavbar />
        <div className="mx-auto max-w-[900px] px-8 py-24 text-center md:px-14">
          <h1 className="text-5xl font-black tracking-[-0.05em] text-slate-900">
            Anda belum login.
          </h1>
          <p className="mt-5 text-lg text-slate-500">
            Silakan login untuk melihat divisi.
          </p>
          <a
            href="/login"
            className="mt-8 inline-flex rounded-full bg-blue-600 px-8 py-4 text-sm font-black uppercase tracking-[0.14em] text-white"
          >
            Login →
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <AppNavbar isPlatformAdmin={isPlatformAdmin} churchRole={churchRole} />

      <section className="relative overflow-hidden px-8 pb-28 pt-16 md:px-14">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-indigo-950 to-blue-900" />
        <div className="absolute -left-[10%] top-[-20%] h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute right-[-8%] top-[10%] h-[560px] w-[560px] rounded-full bg-cyan-400/10 blur-[140px]" />

        <div className="relative z-10 mx-auto max-w-[1400px]">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-100 backdrop-blur-md">
                Divisions
              </p>

              <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.05em] text-white md:text-7xl">
                Divisi Pelayanan.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100/70">
                Kelola divisi di {church?.name}. Setiap divisi bisa memiliki
                beberapa koordinator.
              </p>
            </div>

            {canManageDivisions && (
              <a
                href="/divisions/new"
                className="w-fit rounded-full bg-white px-8 py-4 text-sm font-black uppercase tracking-[0.14em] text-slate-900 transition hover:-translate-y-0.5 hover:bg-blue-100"
              >
                Tambah Divisi →
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="relative z-20 -mt-16 rounded-t-[3rem] bg-slate-50 px-8 py-16 md:px-14">
        <div className="mx-auto max-w-[1400px]">
          {!canManageDivisions && (
            <div className="mb-8 rounded-[2rem] border border-blue-100 bg-blue-50 p-6">
              <p className="text-sm font-bold leading-7 text-blue-700">
                Anda bisa melihat divisi, tapi hanya Church Admin atau KiraServe
                Super Admin yang bisa menambah divisi dan assign koordinator.
              </p>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {divisions.map((division) => {
              const coordinators = getCoordinators(division.id);

              return (
                <article
                  key={division.id}
                  className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/60 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/10"
                >
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600">
                    /{division.slug}
                  </p>

                  <h2 className="mt-6 text-4xl font-black tracking-[-0.05em] text-slate-900">
                    {division.name}
                  </h2>

                  <p className="mt-5 min-h-[84px] text-base leading-7 text-slate-500">
                    {division.description ?? "Belum ada deskripsi."}
                  </p>

                  <div className="mt-8 border-t border-slate-100 pt-6">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                      Koordinator
                    </p>

                    {coordinators.length > 0 ? (
                      <div className="mt-4 grid gap-3">
                        {coordinators.map((coordinator) => (
                          <div
                            key={`${division.id}-${coordinator.profiles?.email}`}
                            className="rounded-2xl bg-slate-50 px-4 py-3"
                          >
                            <p className="text-sm font-black text-slate-900">
                              {coordinator.profiles?.name ??
                                coordinator.profiles?.email}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {coordinator.profiles?.email}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-slate-400">
                        Belum ada koordinator.
                      </p>
                    )}
                  </div>

                  {canManageDivisions && (
                    <a
                      href={`/divisions/${division.id}`}
                      className="mt-8 inline-flex w-full justify-center rounded-full bg-slate-900 px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-blue-600"
                    >
                      Manage Division →
                    </a>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
