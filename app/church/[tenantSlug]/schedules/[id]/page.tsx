"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import AppNavbar from "@/components/AppNavbar";
import { supabase } from "@/lib/supabase/client";
import { getChurchAccess } from "@/lib/church/access";

type OldTableJson = {
  mode?: string;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  columns: string[];
  rows: {
    label: string;
    cells: string[];
  }[];
};

type BuilderColumn = {
  id: string;
  label: string;
  date?: string | null;
  start_time: string | null;
  end_time: string | null;
};

type BuilderCell = {
  display_name: string;
  profile_id?: string | null;
  email?: string | null;
};

type BuilderRow = {
  id: string;
  label: string;
  serving_role_id?: string | null;
  cells: BuilderCell[];
};

type BuilderGroup = {
  id: string;
  title: string;
  date: string | null;
  note: string;
  columns: BuilderColumn[];
  rows: BuilderRow[];
};

type NewTableJson = {
  mode?: string;
  groups: BuilderGroup[];
};

type TableJson = OldTableJson | NewTableJson;

type RelationArray<T> = T[] | T | null;

type Schedule = {
  id: string;
  church_id: string;
  division_id: string | null;
  title: string;
  description: string | null;
  schedule_type: string;
  visibility: string;
  share_slug: string | null;
  table_json: TableJson | null;
  image_url: string | null;
  created_at: string;
  divisions?: RelationArray<{
    name: string;
    slug: string;
  }>;
  schedule_categories?: RelationArray<{
    name: string;
  }>;
  churches?: RelationArray<{
    name: string;
    slug: string;
  }>;
};

function firstRelation<T>(value: RelationArray<T> | undefined): T | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function isNewTable(table: TableJson): table is NewTableJson {
  return "groups" in table && Array.isArray(table.groups);
}

function getCellDisplay(cell: string | BuilderCell | undefined) {
  if (!cell) return "-";
  if (typeof cell === "string") return cell || "-";
  return cell.display_name || "-";
}

function formatDate(dateString?: string | null) {
  if (!dateString) return "";

  return new Date(`${dateString}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getPrimaryScheduleDate(schedule: Schedule) {
  const table = schedule.table_json;

  if (!table) return null;

  if (isNewTable(table)) {
    const firstGroup = table.groups?.[0];
    const firstColumn = firstGroup?.columns?.[0];

    return firstColumn?.date || firstGroup?.date || null;
  }

  return table.date || null;
}

function getPrimaryScheduleTime(schedule: Schedule) {
  const table = schedule.table_json;

  if (!table) {
    return {
      startTime: "09:00",
      endTime: "11:00",
    };
  }

  if (isNewTable(table)) {
    const firstColumn = table.groups?.[0]?.columns?.[0];

    return {
      startTime: firstColumn?.start_time || "09:00",
      endTime: firstColumn?.end_time || "11:00",
    };
  }

  return {
    startTime: table.start_time || "09:00",
    endTime: table.end_time || "11:00",
  };
}

export default function ScheduleDetailPage() {
  const params = useParams();
  const tenantSlug = String(params.tenantSlug);
  const scheduleParam = String(params.id);

  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [churchRole, setChurchRole] = useState<string | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [canManageSchedule, setCanManageSchedule] = useState(false);

  useEffect(() => {
    const loadSchedule = async () => {
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

      const { data, error } = await supabase
        .from("schedules")
        .select(
          `
          id,
          church_id,
          division_id,
          title,
          description,
          schedule_type,
          visibility,
          share_slug,
          table_json,
          image_url,
          created_at,
          divisions (
            name,
            slug
          ),
          schedule_categories (
            name
          ),
          churches (
            name,
            slug
          )
        `
        )
        .eq("church_id", access.churchId)
        .or(`share_slug.eq.${scheduleParam},id.eq.${scheduleParam}`)
        .maybeSingle();

      if (error) {
        console.log("Schedule detail error:", error);
      }

      const scheduleData = (data as unknown as Schedule) ?? null;

      if (!scheduleData) {
        setSchedule(null);
        setLoading(false);
        return;
      }

      const isOwnerChurch =
        access.isPlatformAdmin || access.churchRole === "CHURCH_ADMIN";

      let isDivisionMember = false;
      let isDivisionCoordinator = false;

      if (scheduleData.division_id) {
        const { data: divisionMember } = await supabase
          .from("division_members")
          .select("id, role")
          .eq("church_id", access.churchId)
          .eq("division_id", scheduleData.division_id)
          .eq("profile_id", access.profileId)
          .maybeSingle();

        isDivisionMember = Boolean(divisionMember);
        isDivisionCoordinator =
          divisionMember?.role === "DIVISION_COORDINATOR";
      }

      if (scheduleData.visibility === "PRIVATE") {
        if (!isOwnerChurch && !isDivisionMember) {
          setRedirecting(true);
          window.location.href = `/church/${tenantSlug}/schedules`;
          return;
        }
      }

      setCanManageSchedule(isOwnerChurch || isDivisionCoordinator);
      setSchedule(scheduleData);
      setLoading(false);
    };

    if (tenantSlug && scheduleParam) {
      loadSchedule();
    }
  }, [tenantSlug, scheduleParam]);

  const currentUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://kiraserve.com/church/${tenantSlug}/schedules/${scheduleParam}`;

  const whatsappText = useMemo(() => {
    if (!schedule) return "";

    return encodeURIComponent(
      `Shalom, berikut jadwal pelayanan:\n\n${schedule.title}\n${currentUrl}`
    );
  }, [schedule, currentUrl]);

  if (loading || redirecting) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800">
        <AppNavbar
          mode="church"
          tenantSlug={tenantSlug}
          isPlatformAdmin={isPlatformAdmin}
          churchRole={churchRole}
        />
        <div className="mx-auto max-w-[1400px] px-8 py-24 md:px-14">
          <p className="text-lg font-bold text-slate-500">
            {redirecting ? "Redirecting..." : "Loading schedule..."}
          </p>
        </div>
      </main>
    );
  }

  if (!schedule) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800">
        <AppNavbar
          mode="church"
          tenantSlug={tenantSlug}
          isPlatformAdmin={isPlatformAdmin}
          churchRole={churchRole}
        />

        <div className="mx-auto max-w-[900px] px-8 py-24 text-center md:px-14">
          <h1 className="text-5xl font-black tracking-[-0.05em] text-slate-900">
            Jadwal tidak ditemukan.
          </h1>

          <p className="mt-5 text-lg text-slate-500">
            Link jadwal mungkin salah, bukan milik church ini, atau jadwal sudah
            dihapus.
          </p>

          <a
            href={`/church/${tenantSlug}/schedules`}
            className="mt-8 inline-flex rounded-full bg-blue-600 px-8 py-4 text-sm font-black uppercase tracking-[0.14em] text-white"
          >
            Kembali ke Schedules →
          </a>
        </div>
      </main>
    );
  }

  const division = firstRelation(schedule.divisions);
  const category = firstRelation(schedule.schedule_categories);
  const church = firstRelation(schedule.churches);
  const calendarUrl = createGoogleCalendarUrl(schedule);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <AppNavbar
        mode="church"
        tenantSlug={tenantSlug}
        isPlatformAdmin={isPlatformAdmin}
        churchRole={churchRole}
      />

      <section className="relative overflow-hidden px-8 pb-28 pt-16 md:px-14">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-indigo-950 to-blue-900" />
        <div className="absolute -left-[10%] top-[-20%] h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute right-[-8%] top-[10%] h-[560px] w-[560px] rounded-full bg-cyan-400/10 blur-[140px]" />

        <div className="relative z-10 mx-auto max-w-[1400px]">
          <a
            href={`/church/${tenantSlug}/schedules`}
            className="mb-10 inline-flex rounded-full border border-white/15 bg-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/70 backdrop-blur-md transition hover:bg-white/20 hover:text-white"
          >
            ← Back to Schedules
          </a>

          <div className="grid gap-10 lg:grid-cols-[1fr_420px] lg:items-end">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-100 backdrop-blur-md">
                {division?.name ?? "Schedule"}
              </p>

              <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.05em] text-white md:text-7xl">
                {schedule.title}
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100/70">
                {schedule.description ?? "Jadwal pelayanan gereja."}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {canManageSchedule && (
                  <a
                    href={`/church/${tenantSlug}/schedules/${schedule.id}/edit`}
                    className="rounded-full bg-white px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-slate-900 transition hover:bg-blue-100"
                  >
                    Edit Schedule →
                  </a>
                )}

                <a
                  href={`https://wa.me/?text=${whatsappText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/15 px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
                >
                  Share WhatsApp
                </a>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <p className="text-sm font-bold text-blue-100/70">
                Share schedule
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white">
                Bagikan jadwal
              </h2>

              <div className="mt-6 grid gap-3">
                <a
                  href={calendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-white px-6 py-4 text-center text-xs font-black uppercase tracking-[0.14em] text-slate-900 transition hover:bg-blue-100"
                >
                  Add to Google Calendar
                </a>

                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(currentUrl)}
                  className="rounded-full border border-white/15 px-6 py-4 text-center text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
                >
                  Copy Link
                </button>

                <a
                  href={`https://wa.me/?text=${whatsappText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/15 px-6 py-4 text-center text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
                >
                  Share WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-20 -mt-16 rounded-t-[3rem] bg-slate-50 px-8 py-16 md:px-14">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-8 grid gap-4 md:grid-cols-4">
            <InfoCard label="Church" value={church?.name ?? "-"} />
            <InfoCard label="Division" value={division?.name ?? "-"} />
            <InfoCard label="Category" value={category?.name ?? "-"} />
            <InfoCard label="Visibility" value={schedule.visibility} />
          </div>

          <div className="overflow-hidden rounded-[2.5rem] bg-white p-5 shadow-xl shadow-slate-200/60 md:p-7">
            {schedule.schedule_type === "IMAGE_UPLOAD" && schedule.image_url ? (
              <img
                src={schedule.image_url}
                alt={schedule.title}
                className="w-full rounded-[2rem] object-contain"
              />
            ) : schedule.table_json ? (
              <ScheduleTable table={schedule.table_json} />
            ) : (
              <div className="rounded-[2rem] bg-slate-50 p-10 text-center">
                <h2 className="text-3xl font-black tracking-[-0.05em] text-slate-900">
                  Belum ada data jadwal.
                </h2>
                <p className="mt-4 text-slate-500">
                  Jadwal ini belum memiliki table atau gambar.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function ScheduleTable({ table }: { table: TableJson }) {
  if (isNewTable(table)) {
    return (
      <div className="grid gap-8">
        {table.groups.map((group, groupIndex) => (
          <ScheduleGroupTable
            key={group.id ?? groupIndex}
            group={group}
            mode={table.mode}
          />
        ))}
      </div>
    );
  }

  return <OldScheduleTable table={table} />;
}

function ScheduleGroupTable({
  group,
  mode,
}: {
  group: BuilderGroup;
  mode?: string;
}) {
  const minWidth = 260 + group.columns.length * 170;

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
      <div className="flex flex-col border-b border-slate-200 bg-slate-900 text-white md:flex-row">
        <div className="min-w-[260px] border-b border-white/10 px-5 py-4 md:border-b-0 md:border-r md:border-white/10">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100/70">
            Group
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
            {group.title || "Group"}
          </h2>

          {group.date && (
            <p className="mt-2 text-sm font-bold text-white/60">
              {formatDate(group.date)}
            </p>
          )}
        </div>

        <div className="flex-1 px-5 py-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100/70">
            Note
          </p>

          <h3 className="mt-2 text-xl font-black uppercase tracking-[0.04em]">
            {group.note || "Tidak ada catatan"}
          </h3>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table
          className="table-fixed border-separate border-spacing-0 text-sm"
          style={{ minWidth: `${minWidth}px` }}
        >
          <thead>
            <tr>
              <th className="w-[260px] border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Role
              </th>

              {group.columns.map((column) => (
                <th
                  key={column.id}
                  className="w-[170px] border-b border-slate-200 bg-slate-50 px-4 py-3 text-center"
                >
                  <p className="text-sm font-black text-slate-900">
                    {column.label || "-"}
                  </p>

                  <p className="mt-1 text-[11px] font-bold text-slate-400">
                    {mode === "MONTHLY_MULTI_DATE"
                      ? formatDate(column.date)
                      : column.start_time || column.date || ""}
                  </p>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {group.rows.map((row) => (
              <tr key={row.id}>
                <td className="w-[260px] border-b border-slate-100 bg-slate-50 px-4 py-3 text-sm font-black text-slate-900">
                  {row.label}
                </td>

                {row.cells.map((cell, index) => (
                  <td
                    key={`${row.id}-${index}`}
                    className="w-[170px] border-b border-slate-100 px-4 py-3 text-center text-sm font-bold text-slate-700"
                  >
                    {getCellDisplay(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function OldScheduleTable({ table }: { table: OldTableJson }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px] border-separate border-spacing-0 overflow-hidden rounded-[1.5rem]">
        <thead>
          <tr>
            {table.columns.map((column) => (
              <th
                key={column}
                className="border-b border-slate-200 bg-slate-900 px-6 py-5 text-left text-sm font-black uppercase tracking-[0.14em] text-white first:rounded-tl-[1.5rem] last:rounded-tr-[1.5rem]"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {table.rows.map((row, index) => (
            <tr key={`${row.label}-${index}`}>
              <td className="border-b border-slate-100 bg-slate-50 px-6 py-5 text-lg font-black text-slate-900">
                {row.label}
              </td>

              {row.cells.map((cell, cellIndex) => (
                <td
                  key={`${row.label}-${cellIndex}`}
                  className="border-b border-slate-100 px-6 py-5 text-lg font-bold text-slate-600"
                >
                  {cell || "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/60">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
        {label}
      </p>

      <p className="mt-4 text-2xl font-black tracking-[-0.05em] text-slate-900">
        {value}
      </p>
    </article>
  );
}

function createGoogleCalendarUrl(schedule: Schedule) {
  const division = firstRelation(schedule.divisions);
  const church = firstRelation(schedule.churches);

  const title = encodeURIComponent(schedule.title);
  const details = encodeURIComponent(
    `${schedule.description ?? "Jadwal pelayanan"}\n\nDivision: ${
      division?.name ?? "-"
    }`
  );
  const location = encodeURIComponent(church?.name ?? "");

  const scheduleDate = getPrimaryScheduleDate(schedule);
  const { startTime, endTime } = getPrimaryScheduleTime(schedule);

  const start = scheduleDate
    ? new Date(`${scheduleDate}T${startTime}:00`)
    : new Date();

  if (!scheduleDate) {
    start.setDate(start.getDate() + 1);
    start.setHours(9, 0, 0, 0);
  }

  const end = scheduleDate
    ? new Date(`${scheduleDate}T${endTime}:00`)
    : new Date(start);

  if (!scheduleDate) {
    end.setHours(11, 0, 0, 0);
  }

  if (end <= start) {
    end.setHours(start.getHours() + 2);
  }

  const formatDateForGoogle = (date: Date) =>
    date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatDateForGoogle(
    start
  )}/${formatDateForGoogle(end)}&details=${details}&location=${location}`;
}