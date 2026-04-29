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
};

type Schedule = {
  id: string;
  title: string;
  description: string | null;
  schedule_type: string;
  visibility: string;
  share_slug: string | null;
  created_at: string;
  divisions?: {
    name: string;
    slug: string;
  } | null;
  schedule_categories?: {
    name: string;
  } | null;
};

export default function SchedulesPage() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [church, setChurch] = useState<Church | null>(null);
  const [churchRole, setChurchRole] = useState<string | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [coordinatorDivisions, setCoordinatorDivisions] = useState<Division[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

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

      const { data: coordinatorData } = await supabase
        .from("division_members")
        .select(
          `
          role,
          divisions (
            id,
            name,
            slug
          )
        `
        )
        .eq("church_id", churchData.id)
        .eq("profile_id", profileData.id)
        .eq("role", "DIVISION_COORDINATOR");

      const mappedDivisions =
        coordinatorData?.map((item: any) => item.divisions).filter(Boolean) ??
        [];

      setCoordinatorDivisions(mappedDivisions);

      const { data: scheduleData } = await supabase
        .from("schedules")
        .select(
          `
          id,
          title,
          description,
          schedule_type,
          visibility,
          share_slug,
          created_at,
          divisions (
            name,
            slug
          ),
          schedule_categories (
            name
          )
        `
        )
        .eq("church_id", churchData.id)
        .order("created_at", { ascending: false });

      setSchedules((scheduleData as Schedule[]) ?? []);
      setLoading(false);
    };

    load();
  }, []);

  const canCreateSchedule =
    isPlatformAdmin ||
    churchRole === "CHURCH_ADMIN" ||
    coordinatorDivisions.length > 0;

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800">
        <AppNavbar isPlatformAdmin={isPlatformAdmin} churchRole={churchRole} />
        <div className="mx-auto max-w-[1400px] px-8 py-24 md:px-14">
          <p className="text-lg font-bold text-slate-500">Loading schedules...</p>
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
            Silakan login untuk melihat jadwal pelayanan.
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
                Schedules
              </p>

              <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.05em] text-white md:text-7xl">
                Jadwal Pelayanan.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100/70">
                Semua jadwal pelayanan dari divisi yang ada di {church?.name}.
              </p>
            </div>

            {canCreateSchedule && (
              <a
                href="/schedules/new"
                className="w-fit rounded-full bg-white px-8 py-4 text-sm font-black uppercase tracking-[0.14em] text-slate-900 transition hover:-translate-y-0.5 hover:bg-blue-100"
              >
                Create Schedule →
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="relative z-20 -mt-16 rounded-t-[3rem] bg-slate-50 px-8 py-16 md:px-14">
        <div className="mx-auto max-w-[1400px]">
          {!canCreateSchedule && (
            <div className="mb-8 rounded-[2rem] border border-blue-100 bg-blue-50 p-6">
              <p className="text-sm font-bold leading-7 text-blue-700">
                Anda login sebagai member/pelayan. Tombol create schedule hanya
                muncul untuk Church Admin atau Division Coordinator.
              </p>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {schedules.map((schedule) => (
              <ScheduleCard key={schedule.id} schedule={schedule} />
            ))}
          </div>

          {schedules.length === 0 && (
            <div className="rounded-[2.5rem] bg-white p-10 text-center shadow-xl shadow-slate-200/60">
              <h2 className="text-4xl font-black tracking-[-0.05em] text-slate-900">
                Belum ada jadwal.
              </h2>
              <p className="mt-4 text-lg text-slate-500">
                Jadwal akan muncul setelah dibuat oleh admin atau koordinator.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function ScheduleCard({ schedule }: { schedule: Schedule }) {
  const shareUrl = `/schedules/${schedule.share_slug ?? schedule.id}`;

  const whatsappText = encodeURIComponent(
    `Shalom, berikut jadwal pelayanan:\n\n${schedule.title}\n${typeof window !== "undefined" ? window.location.origin : ""}${shareUrl}`
  );

  return (
    <article className="group overflow-hidden rounded-[2.5rem] bg-white p-7 shadow-xl shadow-slate-200/60 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600">
            {schedule.divisions?.name ?? "Division"}
          </p>

          <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.05em] text-slate-900">
            {schedule.title}
          </h2>
        </div>

        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black uppercase text-blue-600">
          {schedule.visibility}
        </span>
      </div>

      <p className="min-h-[56px] text-base leading-7 text-slate-500">
        {schedule.description ?? "Tidak ada deskripsi."}
      </p>

      <div className="mt-8 grid gap-3">
        <a
          href={shareUrl}
          className="rounded-full bg-slate-900 px-6 py-4 text-center text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-blue-600"
        >
          Open Schedule →
        </a>

        <a
          href={`https://wa.me/?text=${whatsappText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-slate-200 px-6 py-4 text-center text-xs font-black uppercase tracking-[0.14em] text-slate-600 transition hover:border-blue-600 hover:text-blue-600"
        >
          Share WhatsApp
        </a>
      </div>
    </article>
  );
}
