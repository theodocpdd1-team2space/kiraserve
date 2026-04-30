"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Profile = {
  id: string;
  name: string | null;
  email: string;
};

type Church = {
  id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  created_at: string;
};

type PlatformStats = {
  users: number;
  churches: number;
  divisions: number;
  schedules: number;
  inviteCodes: number;
  pendingRequests: number;
};

const adminLinks = [
  { label: "Overview", href: "/admin", active: true },
  { label: "Tenants", href: "/admin/churches" },
  { label: "Requests", href: "/admin/requests" },
  { label: "Users", href: "/admin/users" },
  { label: "Services", href: "/admin/services" },
  { label: "Payments", href: "/admin/payments" },
  { label: "System", href: "/admin/system" },
];

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<PlatformStats>({
    users: 0,
    churches: 0,
    divisions: 0,
    schedules: 0,
    inviteCodes: 0,
    pendingRequests: 0,
  });

  const [recentChurches, setRecentChurches] = useState<Church[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const loadAdmin = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        window.location.href = "/login";
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, email")
        .eq("email", user.email)
        .maybeSingle();

      if (profileError || !profileData) {
        setStatus("Profile tidak ditemukan.");
        setLoading(false);
        return;
      }

      setProfile(profileData);

      const { data: platformAdminData } = await supabase
        .from("platform_admins")
        .select("role")
        .eq("profile_id", profileData.id)
        .maybeSingle();

      const isSuperAdmin =
        platformAdminData?.role === "KIRASERVE_SUPER_ADMIN";

      if (!isSuperAdmin) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setAuthorized(true);

      const [
        profilesCount,
        churchesCount,
        divisionsCount,
        schedulesCount,
        inviteCodesCount,
        churchesData,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("churches").select("id", { count: "exact", head: true }),
        supabase.from("divisions").select("id", { count: "exact", head: true }),
        supabase.from("schedules").select("id", { count: "exact", head: true }),
        supabase
          .from("invite_codes")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("churches")
          .select("id, name, slug, custom_domain, created_at")
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

      setStats({
        users: profilesCount.count ?? 0,
        churches: churchesCount.count ?? 0,
        divisions: divisionsCount.count ?? 0,
        schedules: schedulesCount.count ?? 0,
        inviteCodes: inviteCodesCount.count ?? 0,
        pendingRequests: 0,
      });

      setRecentChurches((churchesData.data as Church[]) ?? []);
      setLoading(false);
    };

    loadAdmin();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5F7FB] text-slate-900">
        <div className="flex min-h-screen items-center justify-center">
          <div className="rounded-[2rem] bg-white p-8 shadow-xl shadow-slate-200/70">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
              Loading Super Admin...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="min-h-screen bg-[#F5F7FB] text-slate-900">
        <div className="mx-auto flex min-h-screen max-w-[900px] items-center justify-center px-8 text-center">
          <div className="rounded-[2.5rem] bg-white p-10 shadow-xl shadow-slate-200/70">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-red-600">
              Access Denied
            </p>

            <h1 className="mt-5 text-5xl font-black tracking-[-0.06em] text-slate-900">
              Anda bukan Super Admin.
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-500">
              Halaman ini hanya untuk akun platform admin KiraServe.
            </p>

            <a
              href="/dashboard"
              className="mt-8 inline-flex rounded-full bg-slate-900 px-8 py-4 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-blue-600"
            >
              Back to Dashboard →
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7FB] text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white lg:block">
          <div className="flex h-20 items-center border-b border-slate-100 px-7">
            <a
              href="/admin"
              className="text-2xl font-black tracking-[-0.06em] text-slate-900"
            >
              KiraServe
            </a>
          </div>

          <div className="px-5 py-6">
            <p className="mb-4 px-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
              Platform Admin
            </p>

            <nav className="grid gap-1">
              {adminLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                    item.active
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                      : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="mt-8 rounded-[1.5rem] bg-slate-50 p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                Admin Domain
              </p>

              <p className="mt-2 text-sm font-black text-slate-900">
                admin.kiraserve.com
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Saat ini masih development via /admin.
              </p>
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
            <div className="flex h-20 items-center justify-between px-6 md:px-8">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-600">
                  Super Admin Dashboard
                </p>

                <h1 className="mt-1 text-2xl font-black tracking-[-0.05em] text-slate-900">
                  Platform Overview
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="/dashboard"
                  className="hidden rounded-full border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-600 transition hover:border-blue-600 hover:text-blue-600 md:inline-flex"
                >
                  User Dashboard
                </a>

                <div className="hidden rounded-full bg-slate-100 px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 md:inline-flex">
                  Super Admin
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full bg-slate-900 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-red-600"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          <div className="px-6 py-8 md:px-8">
            <div className="mb-8 rounded-[2rem] bg-slate-900 p-7 text-white shadow-xl shadow-slate-300/60">
              <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-center">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-300">
                    Welcome back
                  </p>

                  <h2 className="mt-3 text-4xl font-black tracking-[-0.06em]">
                    KiraServe Control Center
                  </h2>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">
                    Pantau tenant, user, request church, jadwal aktif, invite
                    code, dan kesehatan platform dari satu dashboard.
                  </p>
                </div>

                <div className="rounded-[1.5rem] bg-white/10 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
                    Signed in as
                  </p>

                  <p className="mt-2 break-all text-lg font-black text-white">
                    {profile?.email}
                  </p>

                  <p className="mt-2 text-sm text-white/50">
                    KIRASERVE_SUPER_ADMIN
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <StatCard label="Users" value={stats.users} trend="+ live" />
              <StatCard label="Tenants" value={stats.churches} trend="church" />
              <StatCard label="Divisions" value={stats.divisions} trend="active" />
              <StatCard label="Schedules" value={stats.schedules} trend="created" />
              <StatCard label="Invite Codes" value={stats.inviteCodes} trend="issued" />
              <StatCard label="Requests" value={stats.pendingRequests} trend="pending" />
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_420px]">
              <section className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/70">
                <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-600">
                      Tenant Management
                    </p>

                    <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-900">
                      Recent Church Tenants
                    </h2>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <a
                      href="/admin/churches/new"
                      className="rounded-full bg-slate-900 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-blue-600"
                    >
                      Create Tenant
                    </a>

                    <a
                      href="/admin/churches"
                      className="rounded-full border border-slate-200 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-600 transition hover:border-blue-600 hover:text-blue-600"
                    >
                      View All
                    </a>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[1.5rem] border border-slate-100">
                  <table className="w-full min-w-[760px] border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Tenant
                        </th>
                        <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Slug
                        </th>
                        <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Domain
                        </th>
                        <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Status
                        </th>
                        <th className="px-5 py-4 text-right text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentChurches.length > 0 ? (
                        recentChurches.map((church) => (
                          <tr
                            key={church.id}
                            className="border-t border-slate-100 bg-white"
                          >
                            <td className="px-5 py-4">
                              <p className="font-black text-slate-900">
                                {church.name}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                Created{" "}
                                {new Date(church.created_at).toLocaleDateString(
                                  "id-ID"
                                )}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-sm font-bold text-slate-500">
                              {church.slug}
                            </td>

                            <td className="px-5 py-4 text-sm text-slate-500">
                              {church.custom_domain ?? "-"}
                            </td>

                            <td className="px-5 py-4">
                              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-emerald-600">
                                Active
                              </span>
                            </td>

                            <td className="px-5 py-4 text-right">
                              <a
                                href="/admin/churches"
                                className="text-xs font-black uppercase tracking-[0.14em] text-blue-600 hover:text-blue-800"
                              >
                                Manage →
                              </a>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-5 py-10 text-center text-sm font-bold text-slate-400"
                          >
                            Belum ada tenant.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <div className="grid gap-6">
                <section className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/70">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-600">
                    Pending Requests
                  </p>

                  <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-900">
                    Church Workspace
                  </h2>

                  <div className="mt-6 rounded-[1.5rem] bg-slate-50 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-4xl font-black tracking-[-0.06em] text-slate-900">
                          {stats.pendingRequests}
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-500">
                          request pending
                        </p>
                      </div>

                      <a
                        href="/admin/requests"
                        className="rounded-full bg-slate-900 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-blue-600"
                      >
                        Review
                      </a>
                    </div>
                  </div>
                </section>

                <section className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/70">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-600">
                    Platform Health
                  </p>

                  <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-900">
                    System Status
                  </h2>

                  <div className="mt-6 grid gap-3">
                    <HealthRow label="App Server" value="Online" />
                    <HealthRow label="Database" value="Connected" />
                    <HealthRow label="Email Sender" value="Ready" />
                    <HealthRow label="Midtrans" value="Soon" />
                  </div>
                </section>

                <section className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/70">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-600">
                    Quick Links
                  </p>

                  <div className="mt-5 grid gap-3">
                    <QuickLink href="/admin/churches" label="Manage Tenants" />
                    <QuickLink href="/admin/churches/new" label="Create Church Tenant" />
                    <QuickLink href="/dashboard" label="Open User Dashboard" />
                  </div>
                </section>
              </div>
            </div>

            {status && (
              <div className="mt-8 rounded-[1.5rem] border border-blue-100 bg-blue-50 p-5">
                <p className="text-sm font-bold leading-7 text-blue-700">
                  {status}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: number;
  trend: string;
}) {
  return (
    <article className="rounded-[1.5rem] bg-white p-5 shadow-xl shadow-slate-200/70">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            {label}
          </p>

          <p className="mt-4 text-4xl font-black tracking-[-0.06em] text-slate-900">
            {value}
          </p>
        </div>

        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-blue-600">
          {trend}
        </span>
      </div>
    </article>
  );
}

function HealthRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="text-sm font-black text-emerald-600">{value}</p>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-blue-50 hover:text-blue-600"
    >
      {label}
      <span>→</span>
    </a>
  );
}