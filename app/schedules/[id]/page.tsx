"use client";

import { useEffect, useState } from "react";
import AppNavbar from "@/components/AppNavbar";
import { supabase } from "@/lib/supabase/client";

type TableJson = {
  columns: string[];
  rows: {
    label: string;
    cells: string[];
  }[];
};

type Schedule = {
  id: string;
  title: string;
  description: string | null;
  schedule_type: string;
  visibility: string;
  share_slug: string | null;
  table_json: TableJson | null;
  image_url: string | null;
  created_at: string;
  divisions?: {
    name: string;
    slug: string;
  } | null;
  schedule_categories?: {
    name: string;
  } | null;
  churches?: {
    name: string;
    slug: string;
  } | null;
};

export default function ScheduleDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<Schedule | null>(null);

  useEffect(() => {
    const loadSchedule = async () => {
      setLoading(true);

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
        .or(`share_slug.eq.${params.id},id.eq.${params.id}`)
        .maybeSingle();

      if (error) {
        console.log("Schedule detail error:", error);
      }

      setSchedule((data as Schedule) ?? null);
      setLoading(false);
    };

    loadSchedule();
  }, [params.id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800">
        <AppNavbar />
        <div className="mx-auto max-w-[1400px] px-8 py-24 md:px-14">
          <p className="text-lg font-bold text-slate-500">Loading schedule...</p>
        </div>
      </main>
    );
  }

  if (!schedule) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800">
        <AppNavbar />
        <div className="mx-auto max-w-[900px] px-8 py-24 text-center md:px-14">
          <h1 className="text-5xl font-black tracking-[-0.05em] text-slate-900">
            Jadwal tidak ditemukan.
          </h1>

          <p className="mt-5 text-lg text-slate-500">
            Link jadwal mungkin salah atau jadwal sudah dihapus.
          </p>

          <a
            href="/schedules"
            className="mt-8 inline-flex rounded-full bg-blue-600 px-8 py-4 text-sm font-black uppercase tracking-[0.14em] text-white"
          >
            Kembali ke Schedules →
          </a>
        </div>
      </main>
    );
  }

  const currentUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://kiraserve.com/schedules/${schedule.share_slug ?? schedule.id}`;

  const whatsappText = encodeURIComponent(
    `Shalom, berikut jadwal pelayanan:\n\n${schedule.title}\n${currentUrl}`
  );

  const calendarUrl = createGoogleCalendarUrl(schedule);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <AppNavbar />

      <section className="relative overflow-hidden px-8 pb-28 pt-16 md:px-14">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-indigo-950 to-blue-900" />
        <div className="absolute -left-[10%] top-[-20%] h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute right-[-8%] top-[10%] h-[560px] w-[560px] rounded-full bg-cyan-400/10 blur-[140px]" />

        <div className="relative z-10 mx-auto max-w-[1400px]">
          <a
            href="/schedules"
            className="mb-10 inline-flex rounded-full border border-white/15 bg-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/70 backdrop-blur-md transition hover:bg-white/20 hover:text-white"
          >
            ← Back to Schedules
          </a>

          <div className="grid gap-10 lg:grid-cols-[1fr_420px] lg:items-end">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-100 backdrop-blur-md">
                {schedule.divisions?.name ?? "Schedule"}
              </p>

              <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.05em] text-white md:text-7xl">
                {schedule.title}
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100/70">
                {schedule.description ?? "Jadwal pelayanan gereja."}
              </p>
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
                  href={`https://wa.me/?text=${whatsappText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-white px-6 py-4 text-center text-xs font-black uppercase tracking-[0.14em] text-slate-900 transition hover:bg-blue-100"
                >
                  Share WhatsApp
                </a>

                <a
                  href={calendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/15 px-6 py-4 text-center text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
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
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-20 -mt-16 rounded-t-[3rem] bg-slate-50 px-8 py-16 md:px-14">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-8 grid gap-4 md:grid-cols-4">
            <InfoCard label="Church" value={schedule.churches?.name ?? "-"} />
            <InfoCard label="Division" value={schedule.divisions?.name ?? "-"} />
            <InfoCard
              label="Category"
              value={schedule.schedule_categories?.name ?? "-"}
            />
            <InfoCard label="Visibility" value={schedule.visibility} />
          </div>

          <div className="overflow-hidden rounded-[2.5rem] bg-white p-6 shadow-xl shadow-slate-200/60 md:p-8">
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
  const title = encodeURIComponent(schedule.title);
  const details = encodeURIComponent(
    `${schedule.description ?? "Jadwal pelayanan"}\n\nDivision: ${
      schedule.divisions?.name ?? "-"
    }`
  );
  const location = encodeURIComponent(schedule.churches?.name ?? "");

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() + 1);
  start.setHours(9, 0, 0, 0);

  const end = new Date(start);
  end.setHours(11, 0, 0, 0);

  const formatDate = (date: Date) =>
    date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatDate(
    start
  )}/${formatDate(end)}&details=${details}&location=${location}`;
}