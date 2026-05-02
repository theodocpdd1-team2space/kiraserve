"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppNavbar from "@/components/AppNavbar";
import { supabase } from "@/lib/supabase/client";
import { getChurchAccess } from "@/lib/church/access";

type RelationArray<T> = T[] | T | null;

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
  divisions?: RelationArray<{
    name: string;
  }>;
  schedule_categories?: RelationArray<{
    name: string;
  }>;
};

type DivisionMembership = {
  role: string;
  divisions: RelationArray<Division>;
};

function firstRelation<T>(value: RelationArray<T> | undefined): T | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export default function ChurchDashboardPage() {
  const params = useParams();
  const tenantSlug = String(params.tenantSlug);

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

      const access = await getChurchAccess(tenantSlug);

      if (!access.allowed) {
        setRedirecting(true);
        window.location.href = "/dashboard";
        return;
      }

      setUserEmail(access.userEmail);
      setChurchRole(access.churchRole);
      setIsPlatformAdmin(access.isPlatformAdmin);

      if (!access.profileId || !access.churchId) {
        setRedirecting(true);
        window.location.href = "/dashboard";
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, name")
        .eq("id", access.profileId)
        .maybeSingle();

      if (profileError) {
        console.log("Profile error:", profileError);
        setLoading(false);
        return;
      }

      setProfile(profileData as Profile | null);

      const { data: churchData, error: churchError } = await supabase
        .from("churches")
        .select("id, name, slug, plan")
        .eq("id", access.churchId)
        .maybeSingle();

      if (churchError) {
        console.log("Church error:", churchError);
      }

      if (!churchData) {
        setRedirecting(true);
        window.location.href = "/dashboard";
        return;
      }

      setChurch(churchData as Church);

      const { data: divisionsData, error: divisionsError } = await supabase
        .from("divisions")
        .select("id, name, slug, description")
        .eq("church_id", churchData.id)
        .order("name");

      if (divisionsError) {
        console.log("Divisions error:", divisionsError);
      }

      setAllDivisions((divisionsData as Division[]) ?? []);

      const { data: divisionMembershipData, error: divisionMembershipError } =
        await supabase
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
          .eq("profile_id", access.profileId);

      if (divisionMembershipError) {
        console.log("Division membership error:", divisionMembershipError);
      }

      const mappedDivisionMembership =
        ((divisionMembershipData as unknown as DivisionMembership[] | null) ??
          []).map((item) => ({
          role: item.role,
          division: firstRelation(item.divisions),
        }));

      const coordinator = mappedDivisionMembership
        .filter((item) => item.role === "DIVISION_COORDINATOR")
        .map((item) => item.division)
        .filter(Boolean) as Division[];

      const member = mappedDivisionMembership
        .map((item) => item.division)
        .filter(Boolean) as Division[];

      setCoordinatorDivisions(coordinator);
      setMemberDivisions(member);

      const { data: schedulesData, error: schedulesError } = await supabase
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

      if (schedulesError) {
        console.log("Schedules error:", schedulesError);
      }

      setSchedules((schedulesData as unknown as Schedule[]) ?? []);
      setLoading(false);
    };

    if (tenantSlug) {
      loadDashboard();
    }
  }, [tenantSlug]);

  const canCreateSchedule =
    isPlatformAdmin ||
    churchRole === "CHURCH_ADMIN" ||
    coordinatorDivisions.length > 0;

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
        <AppNavbar
          mode="church"
          tenantSlug={tenantSlug}
          isPlatformAdmin={isPlatformAdmin}
          churchRole={churchRole}
        />

        <section className="mx-auto max-w-[1400px] px-8 py-24 md:px-14">
          <div className="rounded-[2rem] bg-white p-8 shadow-xl shadow-slate-200/70">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              {redirecting ? "Redirecting" : "Loading"}
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-900">
              {redirecting
                ? "Mengarahkan ke central dashboard..."
                : "Menyiapkan church dashboard..."}
            </h1>

            <p className="mt-3 text-sm font-bold text-slate-500">
              Mengambil akses, divisi, dan jadwal terbaru.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (!userEmail) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800">
        <AppNavbar mode="central" />

        <div className="mx-auto max-w-[900px] px-8 py-24 text-center md:px-14">
          <h1 className="text-5xl font-black tracking-[-0.05em] text-slate-900">
            Anda belum login.
          </h1>

          <p className="mt-5 text-lg text-slate-500">
            Silakan login terlebih dahulu untuk mengakses church dashboard.
          </p>

          <Link
            href="/login"
            className="mt-8 inline-flex rounded-full bg-blue-600 px-8 py-4 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-blue-500"
          >
            Login →
          </Link>
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

      <section className="relative overflow-hidden px-8 pb-28 pt-16 md:px-14 lg:pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-indigo-950 to-blue-900" />
        <div className="absolute -left-[10%] top-[-20%] h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute right-[-8%] top-[10%] h-[560px] w-[560px] rounded-full bg-cyan-400/10 blur-[140px]" />

        <div className="relative z-10 mx-auto max-w-[1400px]">
          <div className="grid gap-10 lg:grid-cols-[1fr_420px] lg:items-end">
            <div>
              <Link
                href="/dashboard"
                className="mb-8 inline-flex rounded-full border border-white/15 bg-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/70 backdrop-blur-md transition hover:bg-white/20 hover:text-white"
              >
                ← Central Dashboard
              </Link>

              <p className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-100 backdrop-blur-md">
                Church Dashboard
              </p>

              <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.05em] text-white md:text-7xl">
                {church?.name ?? "Church Workspace"}
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

                <Link
                  href={`/church/${tenantSlug}/schedules/new`}
                  className="mt-6 inline-flex w-full justify-center rounded-full bg-blue-600 px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-blue-500"
                >
                  Create Schedule →
                </Link>
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
            <StatCard
              label="Divisi Saya"
              value={String(visibleDivisions.length)}
            />
            <StatCard label="Jadwal Terbaru" value={String(schedules.length)} />
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
                    serving role, dan daftar pelayan Tuhan.
                  </p>
                </div>

                <Link
                  href={`/church/${tenantSlug}/divisions`}
                  className="w-fit rounded-full border border-slate-200 px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-600 transition hover:border-blue-600 hover:text-blue-600"
                >
                  View All
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {visibleDivisions.length > 0 ? (
                  visibleDivisions.map((division) => {
                    const isCoordinator = coordinatorDivisions.some(
                      (item) => item.id === division.id
                    );

                    return (
                      <Link
                        key={division.id}
                        href={`/church/${tenantSlug}/divisions/${division.id}`}
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
                            <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-600">
                              {isCoordinator ? "Coordinator" : "Access"}
                            </span>
                          )}
                        </div>

                        <p className="mt-6 text-xs font-black uppercase tracking-[0.14em] text-blue-600">
                          Lihat member →
                        </p>
                      </Link>
                    );
                  })
                ) : (
                  <div className="rounded-[1.5rem] bg-slate-50 p-6 md:col-span-2">
                    <p className="text-sm font-bold text-slate-500">
                      Anda belum tergabung ke divisi mana pun. Gunakan join code
                      untuk bergabung ke divisi.
                    </p>

                    <Link
                      href={`/church/${tenantSlug}/join`}
                      className="mt-5 inline-flex rounded-full bg-blue-600 px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-white"
                    >
                      Join with Code →
                    </Link>
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

                <Link
                  href={`/church/${tenantSlug}/schedules`}
                  className="w-fit rounded-full border border-slate-200 px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-600 transition hover:border-blue-600 hover:text-blue-600"
                >
                  View Schedules
                </Link>
              </div>

              <div className="grid gap-4">
                {schedules.length > 0 ? (
                  schedules.map((schedule) => {
                    const division = firstRelation(schedule.divisions);
                    const category = firstRelation(
                      schedule.schedule_categories
                    );

                    return (
                      <Link
                        key={schedule.id}
                        href={`/church/${tenantSlug}/schedules/${
                          schedule.share_slug || schedule.id
                        }`}
                        className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5 transition hover:border-blue-200 hover:bg-white hover:shadow-lg"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-black tracking-[-0.03em] text-slate-900">
                              {schedule.title}
                            </h3>

                            <p className="mt-2 text-sm text-slate-500">
                              {division?.name ?? "-"} • {category?.name ?? "-"}
                            </p>
                          </div>

                          <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black uppercase text-blue-600">
                            {schedule.visibility}
                          </span>
                        </div>

                        <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-blue-600">
                          Open schedule →
                        </p>
                      </Link>
                    );
                  })
                ) : (
                  <div className="rounded-[1.5rem] bg-slate-50 p-6">
                    <p className="text-sm font-bold text-slate-500">
                      Belum ada jadwal.
                    </p>

                    {canCreateSchedule && (
                      <Link
                        href={`/church/${tenantSlug}/schedules/new`}
                        className="mt-5 inline-flex rounded-full bg-blue-600 px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-white"
                      >
                        Buat Jadwal →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            {(isPlatformAdmin ||
              churchRole === "CHURCH_ADMIN" ||
              coordinatorDivisions.length > 0) && (
              <div className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/60">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
                  Invite Codes
                </p>

                <h2 className="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.05em] text-slate-900">
                  Onboarding lebih cepat dengan kode.
                </h2>

                <p className="mt-5 text-base leading-7 text-slate-500">
                  Church Admin dan Koordinator dapat membuat kode join supaya
                  servant dapat bergabung tanpa perlu assign email satu per
                  satu.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={`/church/${tenantSlug}/invite-codes`}
                    className="rounded-full bg-slate-900 px-7 py-4 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-blue-600"
                  >
                    Manage Codes →
                  </Link>

                  <Link
                    href={`/church/${tenantSlug}/join`}
                    className="rounded-full border border-slate-200 px-7 py-4 text-xs font-black uppercase tracking-[0.14em] text-slate-600 transition hover:border-blue-600 hover:text-blue-600"
                  >
                    Join Page
                  </Link>
                </div>
              </div>
            )}

            {isPlatformAdmin && (
              <div className="rounded-[2.5rem] bg-slate-900 p-8 text-white shadow-xl shadow-slate-200/60">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-300">
                  Platform Admin
                </p>

                <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                  Anda memiliki akses KiraServe Admin.
                </h2>

                <p className="mt-5 text-base leading-7 text-white/55">
                  Akses ini aktif untuk mengelola tenant, church admin, dan
                  struktur platform.
                </p>

                <Link
                  href="/admin"
                  className="mt-8 inline-flex rounded-full bg-white px-7 py-4 text-xs font-black uppercase tracking-[0.14em] text-slate-900 transition hover:bg-blue-100"
                >
                  Open Admin Dashboard →
                </Link>
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

      <p className="mt-5 break-words text-4xl font-black tracking-[-0.06em] text-slate-900">
        {value}
      </p>
    </article>
  );
}