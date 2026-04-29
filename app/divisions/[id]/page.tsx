"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppNavbar from "@/components/AppNavbar";
import { supabase } from "@/lib/supabase/client";

type Division = {
  id: string;
  church_id: string;
  name: string;
  slug: string;
  description: string | null;
};

type Profile = {
  id: string;
  name: string | null;
  email: string;
};

type DivisionMember = {
  id: string;
  role: string;
  profiles: Profile | null;
};

export default function DivisionDetailPage() {
  const params = useParams();
  const divisionParam = String(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [division, setDivision] = useState<Division | null>(null);
  const [churchRole, setChurchRole] = useState<string | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [isCurrentDivisionCoordinator, setIsCurrentDivisionCoordinator] =
    useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  const [coordinators, setCoordinators] = useState<DivisionMember[]>([]);
  const [servants, setServants] = useState<DivisionMember[]>([]);

  const [newCoordinatorName, setNewCoordinatorName] = useState("");
  const [newCoordinatorEmail, setNewCoordinatorEmail] = useState("");

  const [status, setStatus] = useState("");

  const HIDDEN_SYSTEM_EMAILS = ["kiratechindustries@gmail.com"];

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const loadDivision = async () => {
    setLoading(true);
    setStatus("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: profileData } = user?.email
      ? await supabase
          .from("profiles")
          .select("id, email, name")
          .eq("email", user.email)
          .maybeSingle()
      : { data: null };

    const { data: divisionData, error: divisionError } = await supabase
      .from("divisions")
      .select("id, church_id, name, slug, description")
      .or(`id.eq.${divisionParam},slug.eq.${divisionParam}`)
      .maybeSingle();

    if (divisionError) {
      console.log("Division error:", divisionError);
      setStatus(divisionError.message);
      setLoading(false);
      return;
    }

    if (!divisionData) {
      setDivision(null);
      setLoading(false);
      return;
    }

    setDivision(divisionData);
    setName(divisionData.name);
    setSlug(divisionData.slug);
    setDescription(divisionData.description ?? "");

    if (profileData) {
      const { data: platformAdminData } = await supabase
        .from("platform_admins")
        .select("role")
        .eq("profile_id", profileData.id)
        .maybeSingle();

      setIsPlatformAdmin(
        platformAdminData?.role === "KIRASERVE_SUPER_ADMIN"
      );

      const { data: churchMemberData } = await supabase
        .from("church_members")
        .select("role")
        .eq("church_id", divisionData.church_id)
        .eq("profile_id", profileData.id)
        .maybeSingle();

      setChurchRole(churchMemberData?.role ?? null);

      const { data: currentDivisionMember } = await supabase
        .from("division_members")
        .select("role")
        .eq("division_id", divisionData.id)
        .eq("profile_id", profileData.id)
        .maybeSingle();

      setIsCurrentDivisionCoordinator(
        currentDivisionMember?.role === "DIVISION_COORDINATOR"
      );
    }

    const { data: membersData, error: membersError } = await supabase
      .from("division_members")
      .select(
        `
        id,
        role,
        profiles (
          id,
          name,
          email
        )
      `
      )
      .eq("division_id", divisionData.id)
      .order("role");

    if (membersError) {
      console.log("Members error:", membersError);
      setStatus(membersError.message);
    }

    const visibleMembers =
      (membersData as DivisionMember[] | null)?.filter((member) => {
        const email = member.profiles?.email?.toLowerCase();
        return !HIDDEN_SYSTEM_EMAILS.includes(email ?? "");
      }) ?? [];

    setCoordinators(
      visibleMembers.filter(
        (member) => member.role === "DIVISION_COORDINATOR"
      )
    );

    setServants(
      visibleMembers.filter((member) => member.role !== "DIVISION_COORDINATOR")
    );

    setLoading(false);
  };

  useEffect(() => {
    if (!divisionParam) return;
    loadDivision();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [divisionParam]);

  const canManageDivision = isPlatformAdmin || churchRole === "CHURCH_ADMIN";

  const canManageMembers =
    isPlatformAdmin ||
    churchRole === "CHURCH_ADMIN" ||
    isCurrentDivisionCoordinator;

  const handleSaveDivision = async () => {
    if (!division) return;

    if (!canManageDivision) {
      setStatus("Anda tidak punya akses untuk mengedit divisi.");
      return;
    }

    if (!name || !slug) {
      setStatus("Nama divisi dan slug wajib diisi.");
      return;
    }

    setSaving(true);
    setStatus("Menyimpan perubahan divisi...");

    const { error } = await supabase
      .from("divisions")
      .update({
        name,
        slug: generateSlug(slug),
        description,
      })
      .eq("id", division.id);

    setSaving(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Divisi berhasil diperbarui.");
    await loadDivision();
  };

  const handleAddCoordinator = async () => {
    if (!division) return;

    if (!canManageDivision) {
      setStatus("Hanya Church Admin yang bisa menambahkan koordinator.");
      return;
    }

    const cleanEmail = newCoordinatorEmail.toLowerCase().trim();

    if (!cleanEmail) {
      setStatus("Email koordinator wajib diisi.");
      return;
    }

    setSaving(true);
    setStatus("Menambahkan koordinator...");

    const { data: existingProfile, error: existingProfileError } =
      await supabase
        .from("profiles")
        .select("id")
        .eq("email", cleanEmail)
        .maybeSingle();

    if (existingProfileError) {
      setSaving(false);
      setStatus(existingProfileError.message);
      return;
    }

    let profileId = existingProfile?.id;

    if (!profileId) {
      const { data: newProfile, error: profileError } = await supabase
        .from("profiles")
        .insert({
          name: newCoordinatorName || cleanEmail,
          email: cleanEmail,
        })
        .select("id")
        .single();

      if (profileError) {
        setSaving(false);
        setStatus(profileError.message);
        return;
      }

      profileId = newProfile.id;
    }

    const { error: churchMemberError } = await supabase
      .from("church_members")
      .upsert(
        {
          church_id: division.church_id,
          profile_id: profileId,
          role: "SERVANT",
        },
        {
          onConflict: "church_id,profile_id",
        }
      );

    if (churchMemberError) {
      setSaving(false);
      setStatus(churchMemberError.message);
      return;
    }

    const { error: divisionMemberError } = await supabase
      .from("division_members")
      .upsert(
        {
          church_id: division.church_id,
          division_id: division.id,
          profile_id: profileId,
          role: "DIVISION_COORDINATOR",
        },
        {
          onConflict: "division_id,profile_id",
        }
      );

    setSaving(false);

    if (divisionMemberError) {
      setStatus(divisionMemberError.message);
      return;
    }

    setNewCoordinatorName("");
    setNewCoordinatorEmail("");
    setStatus("Koordinator berhasil ditambahkan.");
    await loadDivision();
  };

  const handleRemoveMember = async (memberId: string, role: string) => {
    if (!canManageMembers) {
      setStatus("Anda tidak punya akses untuk menghapus member.");
      return;
    }

    if (role === "DIVISION_COORDINATOR" && !canManageDivision) {
      setStatus("Hanya Church Admin yang bisa menghapus koordinator.");
      return;
    }

    const confirmed = window.confirm(
      role === "DIVISION_COORDINATOR"
        ? "Hapus koordinator ini dari divisi?"
        : "Hapus pelayan ini dari divisi?"
    );

    if (!confirmed) return;

    setSaving(true);
    setStatus("Menghapus member...");

    const { error } = await supabase
      .from("division_members")
      .delete()
      .eq("id", memberId);

    setSaving(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Member berhasil dihapus dari divisi.");
    await loadDivision();
  };

  const handleDeleteDivision = async () => {
    if (!division) return;

    if (!canManageDivision) {
      setStatus("Anda tidak punya akses untuk menghapus divisi.");
      return;
    }

    const confirmed = window.confirm(
      "Yakin ingin menghapus divisi ini? Semua membership divisi ini akan ikut terhapus."
    );

    if (!confirmed) return;

    setSaving(true);
    setStatus("Menghapus divisi...");

    const { error } = await supabase
      .from("divisions")
      .delete()
      .eq("id", division.id);

    setSaving(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    window.location.href = "/divisions";
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800">
        <AppNavbar />
        <div className="mx-auto max-w-[1200px] px-8 py-24 md:px-14">
          <p className="text-lg font-bold text-slate-500">
            Loading division...
          </p>
        </div>
      </main>
    );
  }

  if (!division) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800">
        <AppNavbar />
        <div className="mx-auto max-w-[900px] px-8 py-24 text-center md:px-14">
          <h1 className="text-5xl font-black tracking-[-0.05em] text-slate-900">
            Divisi tidak ditemukan.
          </h1>

          <p className="mt-5 text-lg text-slate-500">
            Link divisi mungkin salah atau divisi sudah dihapus.
          </p>

          <a
            href="/divisions"
            className="mt-8 inline-flex rounded-full bg-blue-600 px-8 py-4 text-sm font-black uppercase tracking-[0.14em] text-white"
          >
            Kembali ke Divisions →
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <AppNavbar
        isPlatformAdmin={isPlatformAdmin}
        churchRole={churchRole}
      />

      <section className="relative overflow-hidden px-8 pb-24 pt-16 md:px-14">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-indigo-950 to-blue-900" />
        <div className="absolute -left-[10%] top-[-20%] h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute right-[-8%] top-[8%] h-[560px] w-[560px] rounded-full bg-cyan-400/10 blur-[140px]" />

        <div className="relative z-10 mx-auto max-w-[1200px]">
          <a
            href="/divisions"
            className="mb-10 inline-flex rounded-full border border-white/15 bg-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/70 backdrop-blur-md transition hover:bg-white/20 hover:text-white"
          >
            ← Divisions
          </a>

          <p className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-100 backdrop-blur-md">
            Manage Division
          </p>

          <h1 className="max-w-5xl text-5xl font-black leading-[0.95] tracking-[-0.05em] text-white md:text-7xl">
            {division.name}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100/70">
            Lihat daftar pelayan Tuhan dalam divisi ini. Church Admin dapat
            mengedit divisi dan koordinator dapat mengelola member divisinya.
          </p>
        </div>
      </section>

      <section className="relative z-20 -mt-14 rounded-t-[3rem] bg-slate-50 px-8 py-14 md:px-14">
        <div className="mx-auto grid max-w-[1200px] gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="grid gap-8">
            <div className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/60 md:p-10">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
                Division Details
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-900">
                Detail Divisi
              </h2>

              <div className="mt-8">
                <Field label="Nama Divisi">
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    disabled={!canManageDivision}
                    className="input disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </Field>

                <Field label="Slug">
                  <input
                    value={slug}
                    onChange={(event) =>
                      setSlug(generateSlug(event.target.value))
                    }
                    disabled={!canManageDivision}
                    className="input disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </Field>

                <Field label="Deskripsi">
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    disabled={!canManageDivision}
                    className="input min-h-36 resize-none disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </Field>

                {canManageDivision && (
                  <button
                    type="button"
                    onClick={handleSaveDivision}
                    disabled={saving}
                    className="mt-2 w-full rounded-full bg-blue-600 px-8 py-5 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-blue-500 disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save Changes →"}
                  </button>
                )}
              </div>
            </div>

            {canManageDivision && (
              <div className="rounded-[2.5rem] border border-red-100 bg-red-50 p-8">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-red-600">
                  Danger Zone
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-900">
                  Hapus Divisi
                </h2>

                <p className="mt-4 text-sm font-bold leading-7 text-red-700">
                  Hanya lakukan ini jika divisi benar-benar tidak dipakai lagi.
                </p>

                <button
                  type="button"
                  onClick={handleDeleteDivision}
                  disabled={saving}
                  className="mt-6 rounded-full bg-red-600 px-7 py-4 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  Delete Division
                </button>
              </div>
            )}
          </div>

          <div className="grid gap-8">
            <MemberSection
              title="Koordinator Divisi"
              subtitle="Coordinator"
              members={coordinators}
              canRemove={canManageDivision}
              saving={saving}
              onRemove={handleRemoveMember}
            />

            <MemberSection
              title="Daftar Pelayan Tuhan"
              subtitle="Servant / Member"
              members={servants}
              canRemove={canManageMembers}
              saving={saving}
              onRemove={handleRemoveMember}
            />

            {canManageDivision && (
              <div className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/60 md:p-10">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
                  Add Coordinator
                </p>

                <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-900">
                  Tambah Manual
                </h2>

                <p className="mt-4 text-sm leading-7 text-slate-500">
                  Masukkan email koordinator. Jika user belum pernah login,
                  profile tetap dibuat dan akan terhubung saat mereka login.
                </p>

                <div className="mt-8">
                  <Field label="Nama Koordinator / Optional">
                    <input
                      value={newCoordinatorName}
                      onChange={(event) =>
                        setNewCoordinatorName(event.target.value)
                      }
                      placeholder="Theo Filus"
                      className="input"
                    />
                  </Field>

                  <Field label="Email Koordinator">
                    <input
                      value={newCoordinatorEmail}
                      onChange={(event) =>
                        setNewCoordinatorEmail(event.target.value)
                      }
                      placeholder="nama@email.com"
                      type="email"
                      className="input"
                    />
                  </Field>

                  <button
                    type="button"
                    onClick={handleAddCoordinator}
                    disabled={saving}
                    className="mt-2 w-full rounded-full bg-slate-900 px-8 py-5 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-blue-600 disabled:opacity-60"
                  >
                    {saving ? "Processing..." : "Add Coordinator →"}
                  </button>
                </div>
              </div>
            )}

            {status && (
              <div className="rounded-[2rem] border border-blue-100 bg-blue-50 p-6">
                <p className="text-sm font-bold leading-7 text-blue-700">
                  {status}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgb(226 232 240);
          background: rgb(248 250 252);
          padding: 1.1rem 1.25rem;
          font-size: 1rem;
          font-weight: 700;
          color: rgb(15 23 42);
          outline: none;
        }

        .input:focus {
          border-color: rgb(37 99 235);
          background: white;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }
      `}</style>
    </main>
  );
}

function MemberSection({
  title,
  subtitle,
  members,
  canRemove,
  saving,
  onRemove,
}: {
  title: string;
  subtitle: string;
  members: DivisionMember[];
  canRemove: boolean;
  saving: boolean;
  onRemove: (memberId: string, role: string) => void;
}) {
  return (
    <div className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/60 md:p-10">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
        {subtitle}
      </p>

      <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-900">
        {title}
      </h2>

      <div className="mt-8 grid gap-4">
        {members.length > 0 ? (
          members.map((member) => (
            <div
              key={member.id}
              className="flex flex-col justify-between gap-4 rounded-[1.5rem] bg-slate-50 p-5 md:flex-row md:items-center"
            >
              <div>
                <p className="text-base font-black text-slate-900">
                  {member.profiles?.name ?? member.profiles?.email}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {member.profiles?.email}
                </p>

                <p className="mt-2 w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-blue-600">
                  {member.role}
                </p>
              </div>

              {canRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(member.id, member.role)}
                  disabled={saving}
                  className="w-fit rounded-full border border-red-200 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-60"
                >
                  Remove
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-[1.5rem] bg-slate-50 p-6">
            <p className="text-sm font-bold text-slate-500">
              Belum ada data.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <label className="mb-3 block text-xs font-black uppercase tracking-[0.24em] text-slate-400">
        {label}
      </label>
      {children}
    </div>
  );
}