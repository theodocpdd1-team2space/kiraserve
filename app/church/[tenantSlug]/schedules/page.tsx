"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppNavbar from "@/components/AppNavbar";
import { supabase } from "@/lib/supabase/client";
import { getChurchAccess } from "@/lib/church/access";

type RelationArray<T> = T[] | T | null;

type ScheduleItem = {
  id: string;
  title: string;
  description: string | null;
  schedule_type: string;
  visibility: string;
  share_slug: string | null;
  image_url: string | null;
  created_at: string;
  division_id: string | null;
  divisions?: RelationArray<{
    name: string;
    slug: string;
  }>;
  schedule_categories?: RelationArray<{
    name: string;
  }>;
};

type FullScheduleForDuplicate = {
  id: string;
  church_id: string;
  division_id: string | null;
  category_id: string | null;
  title: string;
  description: string | null;
  schedule_type: string;
  visibility: string;
  table_json: any;
  image_url: string | null;
  divisions?: RelationArray<{
    name: string;
    slug: string;
  }>;
};

function firstRelation<T>(value: RelationArray<T> | undefined): T | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function makeScheduleSlug(title: string, divisionSlugOrName?: string | null) {
  const base = `${divisionSlugOrName ?? "schedule"} ${title}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  const suffix = Math.random().toString(36).slice(2, 7);

  return `${base || "schedule"}-${suffix}`;
}

export default function SchedulesPage() {
  const params = useParams();
  const tenantSlug = String(params.tenantSlug);

  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  const [churchId, setChurchId] = useState("");
  const [profileId, setProfileId] = useState("");
  const [churchRole, setChurchRole] = useState<string | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  const [canCreateSchedule, setCanCreateSchedule] = useState(false);
  const [canDeleteAllSchedules, setCanDeleteAllSchedules] = useState(false);
  const [coordinatorDivisionIds, setCoordinatorDivisionIds] = useState<string[]>(
    []
  );

  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  useEffect(() => {
    const loadSchedules = async () => {
      setLoading(true);

      const access = await getChurchAccess(tenantSlug);

      if (!access.allowed) {
        setRedirecting(true);
        window.location.href = "/dashboard";
        return;
      }

      setChurchRole(access.churchRole);
      setIsPlatformAdmin(access.isPlatformAdmin);

      if (!access.churchId || !access.profileId) {
        setRedirecting(true);
        window.location.href = "/dashboard";
        return;
      }

      setChurchId(access.churchId);
      setProfileId(access.profileId);

      const { data: coordinatorData, error: coordinatorError } = await supabase
        .from("division_members")
        .select("division_id")
        .eq("church_id", access.churchId)
        .eq("profile_id", access.profileId)
        .eq("role", "DIVISION_COORDINATOR");

      if (coordinatorError) {
        console.log("Coordinator access error:", coordinatorError);
      }

      const coordinatorIds =
        coordinatorData
          ?.map((item: any) => item.division_id)
          .filter(Boolean) ?? [];

      const isChurchAdmin =
        access.isPlatformAdmin || access.churchRole === "CHURCH_ADMIN";

      const isCoordinator = coordinatorIds.length > 0;

      setCoordinatorDivisionIds(coordinatorIds);
      setCanCreateSchedule(isChurchAdmin || isCoordinator);
      setCanDeleteAllSchedules(isChurchAdmin);

      const { data, error } = await supabase
        .from("schedules")
        .select(
          `
          id,
          title,
          description,
          schedule_type,
          visibility,
          share_slug,
          image_url,
          created_at,
          division_id,
          divisions (
            name,
            slug
          ),
          schedule_categories (
            name
          )
        `
        )
        .eq("church_id", access.churchId)
        .order("created_at", { ascending: false });

      if (error) {
        console.log("Schedules list error:", error);
        setSchedules([]);
        setLoading(false);
        return;
      }

      setSchedules((data as unknown as ScheduleItem[]) ?? []);
      setLoading(false);
    };

    if (tenantSlug) {
      loadSchedules();
    }
  }, [tenantSlug]);

  const canManageSchedule = (schedule: ScheduleItem) => {
    if (canDeleteAllSchedules) return true;
    if (!schedule.division_id) return false;

    return coordinatorDivisionIds.includes(schedule.division_id);
  };

  const copyScheduleLink = async (href: string) => {
    try {
      const url = `${window.location.origin}${href}`;
      await navigator.clipboard.writeText(url);
      alert("Link jadwal berhasil disalin.");
    } catch {
      alert("Gagal menyalin link jadwal.");
    }
  };

  const duplicateSchedule = async (schedule: ScheduleItem) => {
    if (!churchId || !profileId) {
      alert("Session tidak valid. Silakan refresh halaman atau login ulang.");
      return;
    }

    const allowed = canManageSchedule(schedule);

    if (!allowed) {
      alert("Anda tidak memiliki permission untuk duplicate jadwal ini.");
      return;
    }

    const confirmed = window.confirm(
      `Duplicate jadwal "${schedule.title}"? Jadwal baru akan dibuat dan langsung dibuka di halaman edit.`
    );

    if (!confirmed) return;

    setDuplicatingId(schedule.id);

    const { data: latestSchedule, error: latestError } = await supabase
      .from("schedules")
      .select(
        `
        id,
        church_id,
        division_id,
        category_id,
        title,
        description,
        schedule_type,
        visibility,
        table_json,
        image_url,
        divisions (
          name,
          slug
        )
      `
      )
      .eq("id", schedule.id)
      .eq("church_id", churchId)
      .maybeSingle();

    if (latestError) {
      setDuplicatingId(null);
      alert(`Gagal cek jadwal: ${latestError.message}`);
      return;
    }

    const sourceSchedule =
      (latestSchedule as unknown as FullScheduleForDuplicate) ?? null;

    if (!sourceSchedule) {
      setDuplicatingId(null);
      alert("Jadwal tidak ditemukan atau sudah dihapus.");
      return;
    }

    const stillAllowed =
      canDeleteAllSchedules ||
      (sourceSchedule.division_id &&
        coordinatorDivisionIds.includes(sourceSchedule.division_id));

    if (!stillAllowed) {
      setDuplicatingId(null);
      alert("Permission duplicate tidak valid untuk jadwal ini.");
      return;
    }

    const division = firstRelation(sourceSchedule.divisions);
    const newTitle = `Copy - ${sourceSchedule.title}`;
    const newShareSlug = makeScheduleSlug(
      newTitle,
      division?.slug ?? division?.name
    );

    const { data: duplicatedSchedule, error: duplicateError } = await supabase
      .from("schedules")
      .insert({
        church_id: sourceSchedule.church_id,
        division_id: sourceSchedule.division_id,
        category_id: sourceSchedule.category_id,
        title: newTitle,
        description: sourceSchedule.description,
        schedule_type: sourceSchedule.schedule_type,
        visibility: sourceSchedule.visibility,
        share_slug: newShareSlug,
        table_json: sourceSchedule.table_json,
        image_url: sourceSchedule.image_url,
      })
      .select("id")
      .single();

    if (duplicateError) {
      setDuplicatingId(null);
      alert(`Gagal duplicate jadwal: ${duplicateError.message}`);
      return;
    }

    window.location.href = `/church/${tenantSlug}/schedules/${duplicatedSchedule.id}/edit`;
  };

  const deleteSchedule = async (schedule: ScheduleItem) => {
    if (!churchId || !profileId) {
      alert("Session tidak valid. Silakan refresh halaman atau login ulang.");
      return;
    }

    const allowed = canManageSchedule(schedule);

    if (!allowed) {
      alert("Anda tidak memiliki permission untuk menghapus jadwal ini.");
      return;
    }

    const confirmed = window.confirm(
      `Hapus jadwal "${schedule.title}"? Tindakan ini tidak bisa dibatalkan.`
    );

    if (!confirmed) return;

    setDeletingId(schedule.id);

    const { data: latestSchedule, error: latestError } = await supabase
      .from("schedules")
      .select("id, church_id, division_id, title")
      .eq("id", schedule.id)
      .eq("church_id", churchId)
      .maybeSingle();

    if (latestError) {
      setDeletingId(null);
      alert(`Gagal cek jadwal: ${latestError.message}`);
      return;
    }

    if (!latestSchedule) {
      setDeletingId(null);
      alert("Jadwal tidak ditemukan atau sudah dihapus.");
      setSchedules((current) =>
        current.filter((item) => item.id !== schedule.id)
      );
      return;
    }

    const stillAllowed =
      canDeleteAllSchedules ||
      (latestSchedule.division_id &&
        coordinatorDivisionIds.includes(latestSchedule.division_id));

    if (!stillAllowed) {
      setDeletingId(null);
      alert("Permission delete tidak valid untuk jadwal ini.");
      return;
    }

    const { error } = await supabase
      .from("schedules")
      .delete()
      .eq("id", schedule.id)
      .eq("church_id", churchId);

    if (error) {
      setDeletingId(null);
      alert(`Gagal menghapus jadwal: ${error.message}`);
      return;
    }

    setSchedules((current) =>
      current.filter((item) => item.id !== schedule.id)
    );

    setDeletingId(null);
    alert("Jadwal berhasil dihapus.");
  };

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
                ? "Mengarahkan ke dashboard..."
                : "Menyiapkan daftar jadwal..."}
            </h1>

            <p className="mt-3 text-sm font-bold text-slate-500">
              Mengambil jadwal terbaru dan permission akses.
            </p>
          </div>
        </section>
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

      <section className="relative overflow-hidden px-8 pb-20 pt-16 md:px-14">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-indigo-950 to-blue-900" />
        <div className="absolute -left-[10%] top-[-20%] h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute right-[-8%] top-[10%] h-[560px] w-[560px] rounded-full bg-cyan-400/10 blur-[140px]" />

        <div className="relative z-10 mx-auto max-w-[1400px]">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <p className="mb-5 text-xs font-black uppercase tracking-[0.35em] text-blue-100/70">
                Church Workspace
              </p>

              <h1 className="text-5xl font-black leading-[0.95] tracking-[-0.05em] text-white md:text-7xl">
                Schedules
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100/70">
                Kelola jadwal pelayanan, bagikan link jadwal, dan pastikan tim
                pelayanan mendapatkan informasi yang tepat.
              </p>
            </div>

            {canCreateSchedule && (
              <Link
                href={`/church/${tenantSlug}/schedules/new`}
                className="w-fit rounded-full bg-white px-7 py-4 text-xs font-black uppercase tracking-[0.14em] text-slate-900 transition hover:bg-blue-100"
              >
                + Buat Jadwal
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="relative z-20 -mt-10 rounded-t-[3rem] bg-slate-50 px-8 py-16 md:px-14">
        <div className="mx-auto max-w-[1400px]">
          {schedules.length === 0 ? (
            <div className="rounded-[2.5rem] bg-white p-10 text-center shadow-xl shadow-slate-200/70 md:p-16">
              <h2 className="text-4xl font-black tracking-[-0.05em] text-slate-950 md:text-5xl">
                Belum ada jadwal.
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-500">
                Buat jadwal pelayanan pertama untuk mulai membagikan jadwal ke
                tim pelayanan.
              </p>

              {canCreateSchedule && (
                <Link
                  href={`/church/${tenantSlug}/schedules/new`}
                  className="mt-8 inline-flex rounded-full bg-blue-600 px-8 py-4 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-blue-700"
                >
                  Buat Jadwal →
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-5">
              {schedules.map((schedule) => {
                const division = firstRelation(schedule.divisions);
                const category = firstRelation(schedule.schedule_categories);
                const showManageButtons = canManageSchedule(schedule);

                const detailHref = `/church/${tenantSlug}/schedules/${schedule.id}`;

                return (
                  <article
                    key={schedule.id}
                    className="group overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-slate-300/70"
                  >
                    <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
                      <div className="p-7 md:p-8">
                        <div className="mb-6 flex flex-wrap gap-2">
                          <span className="rounded-full bg-blue-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-blue-700">
                            {division?.name ?? "Schedule"}
                          </span>

                          <span className="rounded-full bg-slate-100 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                            {schedule.visibility}
                          </span>

                          <span className="rounded-full bg-slate-100 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                            {schedule.schedule_type}
                          </span>
                        </div>

                        <h2 className="text-3xl font-black leading-tight tracking-[-0.05em] text-slate-950 md:text-4xl">
                          {schedule.title}
                        </h2>

                        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-500">
                          {schedule.description ?? "Jadwal pelayanan gereja."}
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">
                          <Link
                            href={detailHref}
                            className="rounded-full bg-blue-600 px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-blue-700"
                          >
                            Buka Jadwal →
                          </Link>

                          <button
                            type="button"
                            onClick={() => copyScheduleLink(detailHref)}
                            className="rounded-full border border-slate-200 px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-700 transition hover:border-blue-600 hover:text-blue-600"
                          >
                            Copy Link
                          </button>

                          {showManageButtons && (
                            <button
                              type="button"
                              onClick={() => duplicateSchedule(schedule)}
                              disabled={duplicatingId === schedule.id}
                              className="rounded-full border border-blue-200 px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-blue-600 transition hover:bg-blue-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {duplicatingId === schedule.id
                                ? "Duplicating..."
                                : "Duplicate"}
                            </button>
                          )}

                          {showManageButtons && (
                            <button
                              type="button"
                              onClick={() => deleteSchedule(schedule)}
                              disabled={deletingId === schedule.id}
                              className="rounded-full border border-red-200 px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-red-600 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deletingId === schedule.id
                                ? "Deleting..."
                                : "Delete Jadwal"}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-slate-100 bg-slate-50 p-7 md:p-8 lg:border-l lg:border-t-0">
                        <div className="grid gap-5 text-sm font-bold text-slate-500">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                              Category
                            </p>
                            <p className="mt-2 text-base font-black text-slate-950">
                              {category?.name ?? "-"}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                              Created
                            </p>
                            <p className="mt-2 text-base font-black text-slate-950">
                              {formatDate(schedule.created_at)}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                              Schedule ID
                            </p>
                            <p className="mt-2 break-all text-xs font-bold text-slate-500">
                              {schedule.id}
                            </p>
                          </div>

                          {schedule.share_slug && (
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                Pretty Link
                              </p>
                              <p className="mt-2 break-all text-xs font-bold text-slate-500">
                                {schedule.share_slug}
                              </p>
                            </div>
                          )}

                          {showManageButtons && (
                            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
                                Manage Access
                              </p>
                              <p className="mt-2 text-xs font-bold leading-5 text-blue-600">
                                Anda punya akses duplicate dan hapus untuk
                                jadwal ini.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}