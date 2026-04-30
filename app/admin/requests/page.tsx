"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Profile = {
  id: string;
  email: string;
  name: string | null;
};

type ChurchRequest = {
  id: string;
  church_name: string;
  church_city: string | null;
  pic_name: string;
  pic_email: string;
  pic_whatsapp: string | null;
  needs_description: string | null;
  status: string;
  created_at: string;
};

export default function AdminRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<ChurchRequest[]>([]);
  const [status, setStatus] = useState("");

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const ensureUniqueChurchSlug = async (baseSlug: string) => {
    let slug = baseSlug || `church-${Date.now()}`;
    let counter = 1;

    while (true) {
      const { data } = await supabase
        .from("churches")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (!data) return slug;

      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }
  };

  const loadData = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      window.location.href = "/login";
      return;
    }

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

    const isSuperAdmin = platformAdminData?.role === "KIRASERVE_SUPER_ADMIN";

    if (!isSuperAdmin) {
      setAuthorized(false);
      setLoading(false);
      return;
    }

    setAuthorized(true);

    const { data, error } = await supabase
      .from("church_workspace_requests")
      .select(
        "id, church_name, church_city, pic_name, pic_email, pic_whatsapp, needs_description, status, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setStatus(error.message);
    }

    setRequests((data as ChurchRequest[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const approveRequest = async (request: ChurchRequest) => {
    if (!profile) return;

    const confirmed = window.confirm(
      `Approve ${request.church_name} dan buat church workspace?`
    );

    if (!confirmed) return;

    setStatus("Membuat church workspace...");

    const baseSlug = generateSlug(request.church_name);
    const finalSlug = await ensureUniqueChurchSlug(baseSlug);

    const { data: churchData, error: churchError } = await supabase
      .from("churches")
      .insert({
        name: request.church_name,
        slug: finalSlug,
        custom_domain: null,
      })
      .select("id, name, slug")
      .single();

    if (churchError) {
      setStatus(churchError.message);
      return;
    }

    setStatus("Menyiapkan profile PIC...");

    const cleanEmail = request.pic_email.toLowerCase().trim();

    const { data: existingProfile, error: existingProfileError } =
      await supabase
        .from("profiles")
        .select("id")
        .eq("email", cleanEmail)
        .maybeSingle();

    if (existingProfileError) {
      setStatus(existingProfileError.message);
      return;
    }

    let picProfileId = existingProfile?.id;

    if (!picProfileId) {
      const { data: newProfile, error: profileError } = await supabase
        .from("profiles")
        .insert({
          email: cleanEmail,
          name: request.pic_name,
        })
        .select("id")
        .single();

      if (profileError) {
        setStatus(profileError.message);
        return;
      }

      picProfileId = newProfile.id;
    }

    setStatus("Assign PIC sebagai Church Admin...");

    const { error: memberError } = await supabase.from("church_members").upsert(
      {
        church_id: churchData.id,
        profile_id: picProfileId,
        role: "CHURCH_ADMIN",
      },
      {
        onConflict: "church_id,profile_id",
      }
    );

    if (memberError) {
      setStatus(memberError.message);
      return;
    }

    const { error: requestError } = await supabase
      .from("church_workspace_requests")
      .update({
        status: "APPROVED",
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", request.id);

    if (requestError) {
      setStatus(requestError.message);
      return;
    }

    setStatus(
      `Workspace ${churchData.name} berhasil dibuat. PIC sudah menjadi Church Admin.`
    );

    await loadData();
  };

  const rejectRequest = async (requestId: string) => {
    if (!profile) return;

    const confirmed = window.confirm("Reject request ini?");
    if (!confirmed) return;

    setStatus("Rejecting request...");

    const { error } = await supabase
      .from("church_workspace_requests")
      .update({
        status: "REJECTED",
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Request berhasil di-reject.");
    await loadData();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5F7FB] text-slate-900">
        <div className="flex min-h-screen items-center justify-center">
          <p className="rounded-[2rem] bg-white p-8 text-sm font-black uppercase tracking-[0.18em] text-slate-500 shadow-xl">
            Loading requests...
          </p>
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

            <h1 className="mt-5 text-5xl font-black tracking-[-0.06em]">
              Anda bukan Super Admin.
            </h1>

            <a
              href="/dashboard"
              className="mt-8 inline-flex rounded-full bg-slate-900 px-8 py-4 text-xs font-black uppercase tracking-[0.14em] text-white"
            >
              Back to Dashboard →
            </a>
          </div>
        </div>
      </main>
    );
  }

  const pendingCount = requests.filter((item) => item.status === "PENDING").length;

  return (
    <main className="min-h-screen bg-[#F5F7FB] text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white lg:block">
          <div className="flex h-20 items-center border-b border-slate-100 px-7">
            <a
              href="/admin"
              className="text-2xl font-black tracking-[-0.06em]"
            >
              KiraServe
            </a>
          </div>

          <div className="px-5 py-6">
            <p className="mb-4 px-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
              Platform Admin
            </p>

            <nav className="grid gap-1">
              <AdminLink href="/admin" label="Overview" />
              <AdminLink href="/admin/churches" label="Tenants" />
              <AdminLink href="/admin/requests" label="Requests" active />
              <AdminLink href="/admin/users" label="Users" />
              <AdminLink href="/admin/services" label="Services" />
              <AdminLink href="/admin/payments" label="Payments" />
              <AdminLink href="/admin/system" label="System" />
            </nav>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
            <div className="flex h-20 items-center justify-between px-6 md:px-8">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-600">
                  Super Admin
                </p>

                <h1 className="mt-1 text-2xl font-black tracking-[-0.05em]">
                  Church Workspace Requests
                </h1>
              </div>

              <a
                href="/admin"
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-600 transition hover:border-blue-600 hover:text-blue-600"
              >
                Overview
              </a>
            </div>
          </header>

          <div className="px-6 py-8 md:px-8">
            <div className="mb-8 grid gap-4 md:grid-cols-3">
              <StatCard label="Total Requests" value={requests.length} />
              <StatCard label="Pending" value={pendingCount} />
              <StatCard
                label="Reviewed"
                value={requests.length - pendingCount}
              />
            </div>

            <section className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/70">
              <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-600">
                    Requests
                  </p>

                  <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">
                    Request Masuk
                  </h2>
                </div>

                <a
                  href="/church/request"
                  className="rounded-full border border-slate-200 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-600 transition hover:border-blue-600 hover:text-blue-600"
                >
                  Open Request Form
                </a>
              </div>

              <div className="overflow-hidden rounded-[1.5rem] border border-slate-100">
                <table className="w-full min-w-[980px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                        Church
                      </th>
                      <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                        PIC
                      </th>
                      <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                        Needs
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
                    {requests.length > 0 ? (
                      requests.map((request) => (
                        <tr
                          key={request.id}
                          className="border-t border-slate-100 bg-white"
                        >
                          <td className="px-5 py-4 align-top">
                            <p className="font-black text-slate-900">
                              {request.church_name}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {request.church_city ?? "-"} •{" "}
                              {new Date(request.created_at).toLocaleDateString(
                                "id-ID"
                              )}
                            </p>
                          </td>

                          <td className="px-5 py-4 align-top">
                            <p className="text-sm font-black text-slate-900">
                              {request.pic_name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {request.pic_email}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {request.pic_whatsapp ?? "-"}
                            </p>
                          </td>

                          <td className="max-w-[360px] px-5 py-4 align-top">
                            <p className="line-clamp-3 text-sm leading-6 text-slate-500">
                              {request.needs_description ?? "-"}
                            </p>
                          </td>

                          <td className="px-5 py-4 align-top">
                            <StatusBadge status={request.status} />
                          </td>

                          <td className="px-5 py-4 text-right align-top">
                            {request.status === "PENDING" ? (
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => approveRequest(request)}
                                  className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white hover:bg-emerald-700"
                                >
                                  Approve
                                </button>

                                <button
                                  type="button"
                                  onClick={() => rejectRequest(request.id)}
                                  className="rounded-full border border-red-200 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-red-600 hover:bg-red-600 hover:text-white"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-slate-400">
                                Reviewed
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-10 text-center text-sm font-bold text-slate-400"
                        >
                          Belum ada request.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {status && (
                <div className="mt-6 rounded-[1.5rem] border border-blue-100 bg-blue-50 p-5">
                  <p className="text-sm font-bold leading-7 text-blue-700">
                    {status}
                  </p>
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function AdminLink({
  href,
  label,
  active = false,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <a
      href={href}
      className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
        active
          ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
          : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"
      }`}
    >
      {label}
    </a>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-[1.5rem] bg-white p-5 shadow-xl shadow-slate-200/70">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>

      <p className="mt-4 text-4xl font-black tracking-[-0.06em]">{value}</p>
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "APPROVED"
      ? "bg-emerald-50 text-emerald-600"
      : status === "REJECTED"
      ? "bg-red-50 text-red-600"
      : "bg-amber-50 text-amber-600";

  return (
    <span
      className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] ${className}`}
    >
      {status}
    </span>
  );
}