"use client";

import { useEffect, useState } from "react";
import AppNavbar from "@/components/AppNavbar";
import { supabase } from "@/lib/supabase/client";

type Profile = {
  id: string;
  name: string | null;
  email: string;
};

type WorkspaceCard = {
  title: string;
  service: string;
  role: string;
  href: string;
  label: string;
};

type ChurchMembership = {
  role: string;
  churches: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export default function CentralDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [workspaceCards, setWorkspaceCards] = useState<WorkspaceCard[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setUserEmail(null);
        setLoading(false);
        return;
      }

      setUserEmail(user.email);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, email")
        .eq("email", user.email)
        .maybeSingle();

      if (profileError) {
        console.log("Profile error:", profileError);
        setLoading(false);
        return;
      }

      let currentProfile = profileData;

      if (!currentProfile) {
        const { data: newProfile, error: newProfileError } = await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            email: user.email,
            name: user.email,
          })
          .select("id, name, email")
          .single();

        if (newProfileError) {
          console.log("Create profile error:", newProfileError);
          setLoading(false);
          return;
        }

        currentProfile = newProfile;
      }

      setProfile(currentProfile);

      const { data: platformAdminData } = await supabase
        .from("platform_admins")
        .select("role")
        .eq("profile_id", currentProfile.id)
        .maybeSingle();

      const superAdmin =
        platformAdminData?.role === "KIRASERVE_SUPER_ADMIN";

      setIsPlatformAdmin(superAdmin);

      const { data: churchMemberships, error: churchMembershipsError } =
        await supabase
          .from("church_members")
          .select(
            `
            role,
            churches (
              id,
              name,
              slug
            )
          `
          )
          .eq("profile_id", currentProfile.id);

      if (churchMembershipsError) {
        console.log("Church memberships error:", churchMembershipsError);
      }

      const churchCards =
        ((churchMemberships as ChurchMembership[] | null) ?? [])
          .filter((item) => item.churches)
          .map((item) => ({
            title: item.churches?.name ?? "Church Workspace",
            service: "Church Management",
            role:
              item.role === "CHURCH_ADMIN"
                ? "Church Admin"
                : item.role === "SERVANT"
                ? "Church Member"
                : item.role,
            href: `/church/${item.churches?.slug}/dashboard`,
            label: "Open Church",
          }));

      const platformCards: WorkspaceCard[] = superAdmin
        ? [
            {
              title: "KiraServe Platform",
              service: "Super Admin",
              role: "KIRASERVE_SUPER_ADMIN",
              href: "/admin",
              label: "Open Admin",
            },
          ]
        : [];

      setWorkspaceCards([...platformCards, ...churchCards]);
      setLoading(false);
    };

    loadDashboard();
  }, []);

  const serviceActions = [
    {
      title: "Church Management",
      desc: "Kelola jadwal pelayanan, divisi, pelayan Tuhan, serving role, Google Calendar, dan reminder ibadah.",
      actions: [
        { label: "Join with Code", href: "/church/gsjs/join" },
        { label: "Request Church Workspace", href: "/church/request" },
      ],
    },
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800">
        <AppNavbar
          isPlatformAdmin={isPlatformAdmin}
          churchRole={null}
        />

        <div className="mx-auto max-w-[1400px] px-8 py-24 md:px-14">
          <p className="text-lg font-bold text-slate-500">
            Loading dashboard...
          </p>
        </div>
      </main>
    );
  }

  if (!userEmail) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800">
        <AppNavbar />

        <section className="mx-auto max-w-[900px] px-8 py-24 text-center md:px-14">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
            KiraServe
          </p>

          <h1 className="mt-5 text-5xl font-black tracking-[-0.06em] text-slate-900">
            Anda belum login.
          </h1>

          <p className="mt-5 text-lg leading-8 text-slate-500">
            Login terlebih dahulu untuk melihat workspace dan layanan KiraServe.
          </p>

          <a
            href="/login"
            className="mt-8 inline-flex rounded-full bg-slate-900 px-8 py-4 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-blue-600"
          >
            Login →
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <AppNavbar isPlatformAdmin={isPlatformAdmin} churchRole={null} />

      <section className="relative overflow-hidden px-8 pb-28 pt-16 md:px-14">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950" />
        <div className="absolute -left-[10%] top-[-20%] h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute right-[-8%] top-[10%] h-[560px] w-[560px] rounded-full bg-cyan-400/10 blur-[140px]" />

        <div className="relative z-10 mx-auto max-w-[1400px]">
          <p className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-100 backdrop-blur-md">
            KiraServe Ecosystem
          </p>

          <h1 className="max-w-5xl text-5xl font-black leading-[0.95] tracking-[-0.05em] text-white md:text-7xl">
            One account, multiple services.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100/70">
            Login sebagai <b>{profile?.email}</b>. Pilih workspace yang Anda
            miliki atau mulai layanan baru.
          </p>
        </div>
      </section>

      <section className="relative z-20 -mt-16 rounded-t-[3rem] bg-slate-50 px-8 py-16 md:px-14">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-10">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
              Your Workspaces
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-900">
              Workspace yang Anda miliki
            </h2>
          </div>

          {workspaceCards.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {workspaceCards.map((workspace) => (
                <a
                  key={`${workspace.service}-${workspace.title}`}
                  href={workspace.href}
                  className="group rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/60 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/10"
                >
                  <div className="mb-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-xl font-black text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                    →
                  </div>

                  <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
                    {workspace.service}
                  </p>

                  <h3 className="mt-4 text-3xl font-black tracking-[-0.05em] text-slate-900">
                    {workspace.title}
                  </h3>

                  <p className="mt-4 text-sm leading-6 text-slate-500">
                    Role: {workspace.role}
                  </p>

                  <p className="mt-8 text-xs font-black uppercase tracking-[0.14em] text-blue-600">
                    {workspace.label} →
                  </p>
                </a>
              ))}
            </div>
          ) : (
            <div className="max-w-[720px] rounded-[2.5rem] border border-dashed border-slate-300 bg-white p-8 shadow-xl shadow-slate-200/60">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
                No Workspace Yet
              </p>

              <h3 className="mt-4 text-3xl font-black tracking-[-0.05em] text-slate-900">
                Anda belum tergabung dalam workspace mana pun.
              </h3>

              <p className="mt-4 text-base leading-7 text-slate-500">
                Gunakan join code dari gereja Anda atau request workspace baru
                jika gereja Anda ingin memakai KiraServe.
              </p>
            </div>
          )}

          <div className="mt-14 mb-10">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
              Start Something New
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-900">
              Aktifkan layanan KiraServe
            </h2>
          </div>

          <div className="grid max-w-[560px] gap-6">
            {serviceActions.map((service) => (
              <div
                key={service.title}
                className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/60"
              >
                <h3 className="text-3xl font-black tracking-[-0.05em] text-slate-900">
                  {service.title}
                </h3>

                <p className="mt-4 text-base leading-7 text-slate-500">
                  {service.desc}
                </p>

                <div className="mt-8 grid gap-3">
                  {service.actions.map((action) => (
                    <a
                      key={action.href}
                      href={action.href}
                      className="rounded-full bg-slate-900 px-6 py-4 text-center text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-blue-600"
                    >
                      {action.label} →
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}