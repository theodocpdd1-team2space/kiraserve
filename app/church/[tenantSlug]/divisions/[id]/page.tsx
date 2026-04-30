"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import AppNavbar from "@/components/AppNavbar";
import { supabase } from "@/lib/supabase/client";
import { getChurchAccess } from "@/lib/church/access";

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
  avatar_url: string | null;
};

type DivisionMember = {
  id: string;
  role: string;
  profile_id?: string;
  profiles: Profile | null;
};

type ServingRole = {
  id: string;
  church_id: string;
  division_id: string;
  name: string;
  description: string | null;
};

type MemberServingRole = {
  id: string;
  profile_id: string;
  serving_role_id: string;
  division_serving_roles: {
    id: string;
    name: string;
  } | null;
};

export default function DivisionDetailPage() {
  const params = useParams();
  const tenantSlug = String(params.tenantSlug);
  const divisionParam = String(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const [currentProfileId, setCurrentProfileId] = useState("");
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

  const [servingRoles, setServingRoles] = useState<ServingRole[]>([]);
  const [memberServingRoles, setMemberServingRoles] = useState<
    MemberServingRole[]
  >([]);

  const [newCoordinatorName, setNewCoordinatorName] = useState("");
  const [newCoordinatorEmail, setNewCoordinatorEmail] = useState("");

  const [newServingRoleName, setNewServingRoleName] = useState("");
  const [newServingRoleDesc, setNewServingRoleDesc] = useState("");

  const [status, setStatus] = useState("");

  const HIDDEN_SYSTEM_EMAILS = ["kiratechindustries@gmail.com"];

  const canManageDivision = isPlatformAdmin || churchRole === "CHURCH_ADMIN";

  const canManageMembers =
    isPlatformAdmin ||
    churchRole === "CHURCH_ADMIN" ||
    isCurrentDivisionCoordinator;

  const allVisibleMembers = useMemo(() => {
    return [...coordinators, ...servants];
  }, [coordinators, servants]);

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const loadDivision = async () => {
    setLoading(true);
    setStatus("");

    const access = await getChurchAccess(tenantSlug);

    if (!access.allowed) {
      setRedirecting(true);
      window.location.href = "/dashboard";
      return;
    }

    setChurchRole(access.churchRole);
    setIsPlatformAdmin(access.isPlatformAdmin);

    if (!access.profileId || !access.churchId) {
      setRedirecting(true);
      window.location.href = "/dashboard";
      return;
    }

    setCurrentProfileId(access.profileId);

    const { data: divisionData, error: divisionError } = await supabase
      .from("divisions")
      .select("id, church_id, name, slug, description")
      .eq("church_id", access.churchId)
      .or(`id.eq.${divisionParam},slug.eq.${divisionParam}`)
      .maybeSingle();

    if (divisionError) {
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

    const { data: currentDivisionMember } = await supabase
      .from("division_members")
      .select("role")
      .eq("church_id", access.churchId)
      .eq("division_id", divisionData.id)
      .eq("profile_id", access.profileId)
      .maybeSingle();

    const isCoordinator =
      currentDivisionMember?.role === "DIVISION_COORDINATOR";

    setIsCurrentDivisionCoordinator(isCoordinator);

    const canViewDivision =
      access.isPlatformAdmin ||
      access.churchRole === "CHURCH_ADMIN" ||
      Boolean(currentDivisionMember);

    if (!canViewDivision) {
      setRedirecting(true);
      window.location.href = `/church/${tenantSlug}/divisions`;
      return;
    }

    const { data: membersData, error: membersError } = await supabase
      .from("division_members")
      .select(
        `
        id,
        role,
        profile_id,
        profiles (
          id,
          name,
          email,
          avatar_url
        )
      `
      )
      .eq("church_id", access.churchId)
      .eq("division_id", divisionData.id)
      .order("role");

    if (membersError) {
      setStatus(membersError.message);
    }

    const mappedMembers =
      membersData?.map((item: any) => ({
        id: item.id,
        role: item.role,
        profile_id: item.profile_id,
        profiles: Array.isArray(item.profiles)
          ? item.profiles[0] ?? null
          : item.profiles,
      })) ?? [];

    const visibleMembers = mappedMembers.filter((member: DivisionMember) => {
      const email = member.profiles?.email?.toLowerCase();
      return !HIDDEN_SYSTEM_EMAILS.includes(email ?? "");
    });

    setCoordinators(
      visibleMembers.filter(
        (member: DivisionMember) => member.role === "DIVISION_COORDINATOR"
      )
    );

    setServants(
      visibleMembers.filter(
        (member: DivisionMember) => member.role !== "DIVISION_COORDINATOR"
      )
    );

    const { data: servingRolesData, error: servingRolesError } = await supabase
      .from("division_serving_roles")
      .select("id, church_id, division_id, name, description")
      .eq("church_id", access.churchId)
      .eq("division_id", divisionData.id)
      .order("name");

    if (servingRolesError) {
      setStatus(servingRolesError.message);
    }

    setServingRoles((servingRolesData as ServingRole[]) ?? []);

    const { data: memberRolesData, error: memberRolesError } = await supabase
      .from("member_serving_roles")
      .select(
        `
        id,
        profile_id,
        serving_role_id,
        division_serving_roles (
          id,
          name
        )
      `
      )
      .eq("church_id", access.churchId)
      .eq("division_id", divisionData.id);

    if (memberRolesError) {
      setStatus(memberRolesError.message);
    }

    const mappedMemberServingRoles =
      memberRolesData?.map((item: any) => ({
        id: item.id,
        profile_id: item.profile_id,
        serving_role_id: item.serving_role_id,
        division_serving_roles: Array.isArray(item.division_serving_roles)
          ? item.division_serving_roles[0] ?? null
          : item.division_serving_roles,
      })) ?? [];

    setMemberServingRoles(mappedMemberServingRoles as MemberServingRole[]);

    setLoading(false);
  };

  useEffect(() => {
    if (!divisionParam || !tenantSlug) return;
    loadDivision();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [divisionParam, tenantSlug]);

  const getRolesForProfile = (profileId?: string) => {
    if (!profileId) return [];

    return memberServingRoles.filter((item) => item.profile_id === profileId);
  };

  const hasServingRole = (profileId: string, roleId: string) => {
    return memberServingRoles.some(
      (item) => item.profile_id === profileId && item.serving_role_id === roleId
    );
  };

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
      .eq("id", division.id)
      .eq("church_id", division.church_id);

    setSaving(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Divisi berhasil diperbarui.");
    await loadDivision();
  };

  const handleAddServingRole = async () => {
    if (!division) return;

    if (!canManageMembers) {
      setStatus("Anda tidak punya akses untuk menambahkan role pelayanan.");
      return;
    }

    if (!newServingRoleName.trim()) {
      setStatus("Nama serving role wajib diisi.");
      return;
    }

    setSaving(true);
    setStatus("Menambahkan serving role...");

    const { error } = await supabase.from("division_serving_roles").insert({
      church_id: division.church_id,
      division_id: division.id,
      name: newServingRoleName.trim(),
      description: newServingRoleDesc.trim() || null,
    });

    setSaving(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setNewServingRoleName("");
    setNewServingRoleDesc("");
    setStatus("Serving role berhasil ditambahkan.");
    await loadDivision();
  };

  const handleDeleteServingRole = async (roleId: string) => {
    if (!division) return;

    if (!canManageMembers) {
      setStatus("Anda tidak punya akses untuk menghapus serving role.");
      return;
    }

    const confirmed = window.confirm(
      "Hapus serving role ini? Role ini juga akan hilang dari semua member di divisi ini."
    );

    if (!confirmed) return;

    setSaving(true);
    setStatus("Menghapus serving role...");

    const { error } = await supabase
      .from("division_serving_roles")
      .delete()
      .eq("id", roleId)
      .eq("church_id", division.church_id)
      .eq("division_id", division.id);

    setSaving(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Serving role berhasil dihapus.");
    await loadDivision();
  };

  const handleAssignServingRole = async (
    profileId: string,
    servingRoleId: string
  ) => {
    if (!division) return;

    if (!canManageMembers) {
      setStatus("Anda tidak punya akses untuk assign role pelayanan.");
      return;
    }

    if (!servingRoleId) return;

    setSaving(true);
    setStatus("Assign role pelayanan...");

    const { error } = await supabase.from("member_serving_roles").upsert(
      {
        church_id: division.church_id,
        division_id: division.id,
        profile_id: profileId,
        serving_role_id: servingRoleId,
      },
      {
        onConflict: "division_id,profile_id,serving_role_id",
      }
    );

    setSaving(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Role pelayanan berhasil diberikan.");
    await loadDivision();
  };

  const handleRemoveServingRole = async (memberServingRoleId: string) => {
    if (!division) return;

    if (!canManageMembers) {
      setStatus("Anda tidak punya akses untuk menghapus role pelayanan.");
      return;
    }

    setSaving(true);
    setStatus("Menghapus role pelayanan dari member...");

    const { error } = await supabase
      .from("member_serving_roles")
      .delete()
      .eq("id", memberServingRoleId)
      .eq("church_id", division.church_id)
      .eq("division_id", division.id);

    setSaving(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Role pelayanan berhasil dihapus dari member.");
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

    let targetProfileId = existingProfile?.id;

    if (!targetProfileId) {
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

      targetProfileId = newProfile.id;
    }

    const { error: churchMemberError } = await supabase
      .from("church_members")
      .upsert(
        {
          church_id: division.church_id,
          profile_id: targetProfileId,
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
          profile_id: targetProfileId,
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
    if (!division) return;

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
      .eq("id", memberId)
      .eq("church_id", division.church_id)
      .eq("division_id", division.id);

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
      .eq("id", division.id)
      .eq("church_id", division.church_id);

    setSaving(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    window.location.href = `/church/${tenantSlug}/divisions`;
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
        <div className="mx-auto max-w-[1200px] px-8 py-24 md:px-14">
          <p className="text-lg font-bold text-slate-500">
            {redirecting ? "Redirecting..." : "Loading division..."}
          </p>
        </div>
      </main>
    );
  }

  if (!division) {
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
            Divisi tidak ditemukan.
          </h1>

          <p className="mt-5 text-lg text-slate-500">
            Link divisi mungkin salah, bukan milik church ini, atau sudah
            dihapus.
          </p>

          <a
            href={`/church/${tenantSlug}/divisions`}
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
        mode="church"
        tenantSlug={tenantSlug}
        isPlatformAdmin={isPlatformAdmin}
        churchRole={churchRole}
      />

      <section className="relative overflow-hidden px-8 pb-24 pt-16 md:px-14">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-indigo-950 to-blue-900" />
        <div className="absolute -left-[10%] top-[-20%] h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute right-[-8%] top-[8%] h-[560px] w-[560px] rounded-full bg-cyan-400/10 blur-[140px]" />

        <div className="relative z-10 mx-auto max-w-[1300px]">
          <a
            href={`/church/${tenantSlug}/divisions`}
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

          <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100/70">
            Kelola member divisi, role pelayanan, dan skill tiap pelayan Tuhan.
            Data ini nanti dipakai untuk rekomendasi nama saat membuat jadwal.
          </p>
        </div>
      </section>

      <section className="relative z-20 -mt-14 rounded-t-[3rem] bg-slate-50 px-8 py-14 md:px-14">
        <div className="mx-auto grid max-w-[1300px] gap-8 xl:grid-cols-[0.85fr_1.15fr] xl:items-start">
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

            <div className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/60 md:p-10">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
                Serving Roles
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-900">
                Role Pelayanan
              </h2>

              <p className="mt-4 text-sm leading-7 text-slate-500">
                Role pelayanan adalah skill/tugas yang bisa dilakukan member,
                misalnya ProPresenter, Resolume, Camera 1, Mixer, atau Worship
                Leader.
              </p>

              <div className="mt-8 grid gap-3">
                {servingRoles.length > 0 ? (
                  servingRoles.map((role) => (
                    <div
                      key={role.id}
                      className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4"
                    >
                      <div>
                        <p className="text-sm font-black text-slate-900">
                          {role.name}
                        </p>
                        {role.description && (
                          <p className="mt-1 text-xs text-slate-500">
                            {role.description}
                          </p>
                        )}
                      </div>

                      {canManageMembers && (
                        <button
                          type="button"
                          onClick={() => handleDeleteServingRole(role.id)}
                          disabled={saving}
                          className="rounded-full border border-red-200 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-60"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-sm font-bold text-slate-500">
                      Belum ada role pelayanan.
                    </p>
                  </div>
                )}
              </div>

              {canManageMembers && (
                <div className="mt-8 rounded-[2rem] border border-slate-100 bg-slate-50 p-5">
                  <Field label="Nama Role Baru">
                    <input
                      value={newServingRoleName}
                      onChange={(event) =>
                        setNewServingRoleName(event.target.value)
                      }
                      placeholder="Camera 1 / ProPresenter / Resolume"
                      className="input"
                    />
                  </Field>

                  <Field label="Deskripsi / Optional">
                    <input
                      value={newServingRoleDesc}
                      onChange={(event) =>
                        setNewServingRoleDesc(event.target.value)
                      }
                      placeholder="Catatan singkat role ini"
                      className="input"
                    />
                  </Field>

                  <button
                    type="button"
                    onClick={handleAddServingRole}
                    disabled={saving}
                    className="w-full rounded-full bg-slate-900 px-7 py-4 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-blue-600 disabled:opacity-60"
                  >
                    Add Serving Role →
                  </button>
                </div>
              )}
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
              servingRoles={servingRoles}
              getRolesForProfile={getRolesForProfile}
              hasServingRole={hasServingRole}
              canRemoveMember={canManageDivision}
              canManageServingRoles={canManageMembers}
              saving={saving}
              onRemoveMember={handleRemoveMember}
              onAssignServingRole={handleAssignServingRole}
              onRemoveServingRole={handleRemoveServingRole}
            />

            <MemberSection
              title="Daftar Pelayan Tuhan"
              subtitle="Servant / Member"
              members={servants}
              servingRoles={servingRoles}
              getRolesForProfile={getRolesForProfile}
              hasServingRole={hasServingRole}
              canRemoveMember={canManageMembers}
              canManageServingRoles={canManageMembers}
              saving={saving}
              onRemoveMember={handleRemoveMember}
              onAssignServingRole={handleAssignServingRole}
              onRemoveServingRole={handleRemoveServingRole}
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
  servingRoles,
  getRolesForProfile,
  hasServingRole,
  canRemoveMember,
  canManageServingRoles,
  saving,
  onRemoveMember,
  onAssignServingRole,
  onRemoveServingRole,
}: {
  title: string;
  subtitle: string;
  members: DivisionMember[];
  servingRoles: ServingRole[];
  getRolesForProfile: (profileId?: string) => MemberServingRole[];
  hasServingRole: (profileId: string, roleId: string) => boolean;
  canRemoveMember: boolean;
  canManageServingRoles: boolean;
  saving: boolean;
  onRemoveMember: (memberId: string, role: string) => void;
  onAssignServingRole: (profileId: string, servingRoleId: string) => void;
  onRemoveServingRole: (memberServingRoleId: string) => void;
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
          members.map((member) => {
            const profileId = member.profiles?.id;
            const assignedRoles = getRolesForProfile(profileId);

            return (
              <div key={member.id} className="rounded-[1.5rem] bg-slate-50 p-5">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div className="flex gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-200 text-sm font-black text-slate-500">
                      {member.profiles?.avatar_url ? (
                        <img
                          src={member.profiles.avatar_url}
                          alt={member.profiles?.name ?? "Avatar"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        (member.profiles?.name ??
                          member.profiles?.email ??
                          "?")
                          .slice(0, 2)
                          .toUpperCase()
                      )}
                    </div>

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
                  </div>

                  {canRemoveMember && (
                    <button
                      type="button"
                      onClick={() => onRemoveMember(member.id, member.role)}
                      disabled={saving}
                      className="w-fit rounded-full border border-red-200 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-60"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="mt-5 border-t border-slate-200 pt-5">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                    Role Pelayanan
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {assignedRoles.length > 0 ? (
                      assignedRoles.map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-slate-700"
                        >
                          {item.division_serving_roles?.name ?? "Role"}

                          {canManageServingRoles && (
                            <button
                              type="button"
                              onClick={() => onRemoveServingRole(item.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm font-bold text-slate-400">
                        Belum ada role pelayanan.
                      </span>
                    )}
                  </div>

                  {canManageServingRoles && profileId && (
                    <div className="mt-4">
                      <select
                        defaultValue=""
                        onChange={(event) => {
                          const selectedRoleId = event.target.value;
                          if (!selectedRoleId) return;

                          onAssignServingRole(profileId, selectedRoleId);
                          event.target.value = "";
                        }}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      >
                        <option value="">Assign role pelayanan</option>
                        {servingRoles.map((role) => (
                          <option
                            key={role.id}
                            value={role.id}
                            disabled={hasServingRole(profileId, role.id)}
                          >
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-[1.5rem] bg-slate-50 p-6">
            <p className="text-sm font-bold text-slate-500">Belum ada data.</p>
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