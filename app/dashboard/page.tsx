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
  plan: string | null;
};

type Division = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

type Schedule = {
  id: string;
  title: string;
  description: string | null;
  visibility: string;
  share_slug: string | null;
  divisions?: {
    name: string;
  } | null;
  schedule_categories?: {
    name: string;
  } | null;
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [church, setChurch] = useState<Church | null>(null);
  const [churchRole, setChurchRole] = useState<string | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  const [coordinatorDivisions, setCoordinatorDivisions] = useState<Division[]>(
    []
  );
  const [memberDivisions, setMemberDivisions] = useState<Division[]>([]);
  const [allDivisions, setAllDivisions] = useState<Division[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

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
        .select("id, email, name")
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
          .select("id, email, name")
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

      const platformAdmin =
        platformAdminData?.role === "KIRASERVE_SUPER_ADMIN";

      setIsPlatformAdmin(platformAdmin);

      const { data: churchData, error: churchError } = await supabase
        .from("churches")
        .select("id, name, slug, plan")
        .eq("slug", "gsjs")
        .maybeSingle();

      if (churchError) {
        console.log("Church error:", churchError);
      }

      if (churchData) {
        setChurch(churchData);

        const { data: churchMemberData } = await supabase
          .from("church_members")
          .select("role")
          .eq("church_id", churchData.id)
          .eq("profile_id", currentProfile.id)
          .maybeSingle();

        setChurchRole(churchMemberData?.role ?? null);

        const { data: divisionsData } = await supabase
          .from("divisions")
          .select("id, name, slug, description")
          .eq("church_id", churchData.id)
          .order("name");

        setAllDivisions(divisionsData ?? []);

        const { data: divisionMembershipData } = await supabase
          .from("division_members")
          .select(
            `
            role,
            divisions (
              id,
              name,
              slug,
              description
            )
          `
          )
          .eq("church_id", churchData.id)
          .eq("profile_id", currentProfile.id);

        const coordinator =
          divisionMembershipData
            ?.filter((item: any) => item.role === "DIVISION_COORDINATOR")
            .map((item: any) => item.divisions)
            .filter(Boolean) ?? [];

        const member =
          divisionMembershipData
            ?.map((item: any) => item.divisions)
            .filter(Boolean) ?? [];

        setCoordinatorDivisions(coordinator);
        setMemberDivisions(member);

        const { data: schedulesData } = await supabase
          .from("schedules")
          .select(
            `
            id,
            title,
            description,
            visibility,
            share_slug,
            divisions (
              name
            ),
            schedule_categories (
              name
            )
          `
          )
          .eq("church_id", churchData.id)
          .order("created_at", { ascending: false })
          .limit(5);

        setSchedules((schedulesData as Schedule[]) ?? []);
      }

      setLoading(false);
    };

    loadDashboard();
  }, []);

  const canCreateSchedule =
    isPlatformAdmin ||
    churchRole === "CHURCH_ADMIN" ||
    coordinatorDivisions.length > 0;

  const hasAnyAccess =
    isPlatformAdmin ||
    churchRole !== null ||
    coordinatorDivisions.length > 0 ||
    memberDivisions.length > 0;

  useEffect(() => {
    if (!loading && userEmail && !hasAnyAccess) {
      setRedirecting(true);
      window.location.href = "/join";
    }
  }, [loading, userEmail, hasAnyAccess]);

  const visibleDivisions =
    isPlatformAdmin || churchRole === "CHURCH_ADMIN"
      ? allDivisions
      : memberDivisions;

  const roleLabel = isPlatformAdmin
    ? "Super Admin"
    : churchRole === "CHURCH_ADMIN"
    ? "Church Admin"
    : coordinatorDivisions.length > 0
    ? "Coordinator"
    : "Member";

  if (loading || redirecting) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800">
        <AppNavbar isPlatformAdmin={isPlatformAdmin} churchRole={churchRole} />

        <div className="mx-auto max-w-[1400px] px-8 py-24 md:px-14">
          <p className="text-lg font-bold text-slate-500">
            {redirecting
              ? "Redirecting to join page..."
              : "Loading dashboard..."}
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
            Silakan login terlebih dahulu untuk mengakses dashboard.
          </p>

          <a
            href="/login"
            className="mt-8 inline-flex rounded-full bg-blue-600 px-8 py-4 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-blue-500"
          >
            Login →
          </a>
        </div>
      </main>
    );
  }

  if (!hasAnyAccess) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <AppNavbar isPlatformAdmin={isPlatformAdmin} churchRole={churchRole} />

      <section className="relative overflow-hidden px-8 pb-28 pt-16 md:px-14 lg:pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-indigo-950 to-blue-900" />
        <div className="absolute -left-[10%] top-[-20%] h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute right-[-8%] top-[10%] h-[560px] w-[560px] rounded-full bg-cyan-400/10 blur-[140px]" />

        <div className="relative z-10 mx-auto max-w-[1400px]">
          <div className="grid gap-10 lg:grid-cols-[1fr_420px] lg:items-end">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-100 backdrop-blur-md">
                Dashboard
              </p>

              <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.05em] text-white md:text-7xl">
                {church?.name ?? "KiraServe"}
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100/70">
                Login sebagai <b>{profile?.email}</b>. Role Anda:{" "}
                <b>{roleLabel}</b>.
              </p>
            </div>

            {canCreateSchedule ? (
              <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
                <p className="text-sm font-bold text-blue-100/70">
                  Quick action
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white">
                  Buat jadwal baru
                </h2>

                <p className="mt-3 text-sm leading-6 text-blue-100/60">
                  Role Anda memiliki akses untuk membuat jadwal pelayanan.
                </p>

                <a
                  href="/schedules/new"
                  className="mt-6 inline-flex w-full justify-center rounded-full bg-blue-600 px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-blue-500"
                >
                  Create Schedule →
                </a>
              </div>
            ) : (
              <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
                <p className="text-sm font-bold text-blue-100/70">Access</p>

                <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white">
                  View only
                </h2>

                <p className="mt-3 text-sm leading-6 text-blue-100/60">
                  Anda dapat melihat jadwal dan daftar member pada divisi yang
                  Anda ikuti.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="relative z-20 -mt-16 rounded-t-[3rem] bg-slate-50 px-8 py-16 md:px-14">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard label="Divisi Saya" value={String(visibleDivisions.length)} />

            <StatCard label="Jadwal Aktif" value={String(schedules.length)} />

            <StatCard label="Role" value={roleLabel} />

            <StatCard
              label="Koordinator"
              value={String(coordinatorDivisions.length)}
            />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
            <div className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/60">
              <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
                    My Divisions
                  </p>

                  <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-900">
                    Divisi & Pelayan Tuhan
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                    Klik salah satu divisi untuk melihat detail, koordinator,
                    dan daftar pelayan Tuhan yang tergabung di divisi tersebut.
                  </p>
                </div>

                <a
                  href="/divisions"
                  className="w-fit rounded-full border border-slate-200 px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-600 transition hover:border-blue-600 hover:text-blue-600"
                >
                  View All
                </a>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {visibleDivisions.length > 0 ? (
                  visibleDivisions.map((division) => {
                    const isCoordinator = coordinatorDivisions.some(
                      (item) => item.id === division.id
                    );

                    return (
                      <a
                        key={division.id}
                        href={`/divisions/${division.id}`}
                        className="block rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-lg hover:shadow-blue-900/5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-black tracking-[-0.04em] text-slate-900">
                              {division.name}
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                              {division.description ?? "Belum ada deskripsi."}
                            </p>
                          </div>

                          {(isCoordinator ||
                            churchRole === "CHURCH_ADMIN" ||
                            isPlatformAdmin) && (
                            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-600">
                              {isCoordinator ? "Coordinator" : "Access"}
                            </span>
                          )}
                        </div>

                        <p className="mt-6 text-xs font-black uppercase tracking-[0.14em] text-blue-600">
                          Lihat member →
                        </p>
                      </a>
                    );
                  })
                ) : (
                  <div className="rounded-[1.5rem] bg-slate-50 p-6 md:col-span-2">
                    <p className="text-sm font-bold text-slate-500">
                      Anda belum tergabung ke divisi mana pun. Gunakan join code
                      untuk bergabung ke divisi.
                    </p>

                    <a
                      href="/join"
                      className="mt-5 inline-flex rounded-full bg-blue-600 px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-white"
                    >
                      Join with Code →
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/60">
              <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
                    Recent
                  </p>

                  <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-900">
                    Jadwal terbaru
                  </h2>
                </div>

                <a
                  href="/schedules"
                  className="w-fit rounded-full border border-slate-200 px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-600 transition hover:border-blue-600 hover:text-blue-600"
                >
                  View Schedules
                </a>
              </div>

              <div className="grid gap-4">
                {schedules.length > 0 ? (
                  schedules.map((schedule) => (
                    <a
                      key={schedule.id}
                      href={`/schedules/${schedule.share_slug ?? schedule.id}`}
                      className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5 transition hover:border-blue-200 hover:bg-white hover:shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-black tracking-[-0.03em] text-slate-900">
                            {schedule.title}
                          </h3>

                          <p className="mt-2 text-sm text-slate-500">
                            {schedule.divisions?.name ?? "-"} •{" "}
                            {schedule.schedule_categories?.name ?? "-"}
                          </p>
                        </div>

                        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black uppercase text-blue-600">
                          {schedule.visibility}
                        </span>
                      </div>

                      <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-blue-600">
                        Open schedule →
                      </p>
                    </a>
                  ))
                ) : (
                  <p className="text-slate-500">Belum ada jadwal.</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/60">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
                Invite Codes
              </p>

              <h2 className="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.05em] text-slate-900">
                Onboarding lebih cepat dengan kode.
              </h2>

              <p className="mt-5 text-base leading-7 text-slate-500">
                Church Admin dan Koordinator dapat membuat kode join supaya
                servant dapat bergabung tanpa perlu assign email satu per satu.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/invite-codes"
                  className="rounded-full bg-slate-900 px-7 py-4 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-blue-600"
                >
                  Manage Codes →
                </a>

                <a
                  href="/join"
                  className="rounded-full border border-slate-200 px-7 py-4 text-xs font-black uppercase tracking-[0.14em] text-slate-600 transition hover:border-blue-600 hover:text-blue-600"
                >
                  Join Page
                </a>
              </div>
            </div>

            {isPlatformAdmin && (
              <div className="rounded-[2.5rem] bg-slate-900 p-8 text-white shadow-xl shadow-slate-200/60">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-300">
                  Platform Admin
                </p>

                <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                  Anda memiliki akses KiraServe Admin.
                </h2>

                <p className="mt-5 text-base leading-7 text-white/55">
                  Akses ini disembunyikan dari tampilan koordinator, tapi tetap
                  aktif untuk mengelola tenant, church admin, dan struktur
                  platform.
                </p>

                <a
                  href="/admin"
                  className="mt-8 inline-flex rounded-full bg-white px-7 py-4 text-xs font-black uppercase tracking-[0.14em] text-slate-900 transition hover:bg-blue-100"
                >
                  Open Admin Dashboard →
                </a>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[2rem] bg-white p-7 shadow-xl shadow-slate-200/60">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
        {label}
      </p>

      <p className="mt-5 text-4xl font-black tracking-[-0.06em] text-slate-900">
        {value}
      </p>
    </article>
  );
}