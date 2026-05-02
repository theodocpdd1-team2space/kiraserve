"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppNavbar from "@/components/AppNavbar";
import { supabase } from "@/lib/supabase/client";
import { getChurchAccess } from "@/lib/church/access";

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

type InviteCode = {
  id: string;
  code: string;
  role_to_assign: string;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  churches: {
    name: string;
  } | null;
  divisions: {
    name: string;
  } | null;
};

function getJoinLink(tenantSlug: string, code: string) {
  if (typeof window === "undefined") {
    return `/church/${tenantSlug}/join?code=${encodeURIComponent(code)}`;
  }

  return `${window.location.origin}/church/${tenantSlug}/join?code=${encodeURIComponent(
    code
  )}`;
}

export default function InviteCodesPage() {
  const params = useParams();
  const tenantSlug = String(params.tenantSlug);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [church, setChurch] = useState<Church | null>(null);
  const [churchRole, setChurchRole] = useState<string | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [coordinatorDivisions, setCoordinatorDivisions] = useState<Division[]>(
    []
  );

  const [divisions, setDivisions] = useState<Division[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);

  const [divisionId, setDivisionId] = useState("");
  const [roleToAssign, setRoleToAssign] = useState("SERVANT");
  const [maxUses, setMaxUses] = useState("20");
  const [validDays, setValidDays] = useState("7");
  const [status, setStatus] = useState("");

  const loadData = async () => {
    setLoading(true);

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

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, name")
      .eq("id", access.profileId)
      .maybeSingle();

    if (profileError) {
      console.log("Profile error:", profileError);
    }

    if (!profileData) {
      setRedirecting(true);
      window.location.href = "/dashboard";
      return;
    }

    setProfile(profileData);

    const { data: churchData, error: churchError } = await supabase
      .from("churches")
      .select("id, name, slug")
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

    setChurch(churchData);

    const { data: coordinatorData, error: coordinatorError } = await supabase
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
      .eq("profile_id", access.profileId)
      .eq("role", "DIVISION_COORDINATOR");

    if (coordinatorError) {
      console.log("Coordinator divisions error:", coordinatorError);
    }

    const mappedCoordinatorDivisions =
      coordinatorData
        ?.map((item: any) =>
          Array.isArray(item.divisions)
            ? item.divisions[0] ?? null
            : item.divisions
        )
        .filter(Boolean) ?? [];

    setCoordinatorDivisions(mappedCoordinatorDivisions as Division[]);

    const canCreateInvite =
      access.isPlatformAdmin ||
      access.churchRole === "CHURCH_ADMIN" ||
      mappedCoordinatorDivisions.length > 0;

    if (!canCreateInvite) {
      setRedirecting(true);
      window.location.href = `/church/${tenantSlug}/dashboard`;
      return;
    }

    const { data: divisionsData, error: divisionsError } = await supabase
      .from("divisions")
      .select("id, name, slug")
      .eq("church_id", churchData.id)
      .order("name");

    if (divisionsError) {
      console.log("Divisions error:", divisionsError);
    }

    setDivisions((divisionsData as Division[]) ?? []);

    const { data: codesData, error: codesError } = await supabase
      .from("invite_codes")
      .select(
        `
        id,
        code,
        role_to_assign,
        max_uses,
        used_count,
        expires_at,
        is_active,
        created_at,
        churches (
          name
        ),
        divisions (
          name
        )
      `
      )
      .eq("church_id", churchData.id)
      .order("created_at", { ascending: false });

    if (codesError) {
      console.log("Invite codes error:", codesError);
    }

    const mappedInviteCodes =
      codesData?.map((item: any) => ({
        id: item.id,
        code: item.code,
        role_to_assign: item.role_to_assign,
        max_uses: item.max_uses,
        used_count: item.used_count,
        expires_at: item.expires_at,
        is_active: item.is_active,
        created_at: item.created_at,
        churches: Array.isArray(item.churches)
          ? item.churches[0] ?? null
          : item.churches,
        divisions: Array.isArray(item.divisions)
          ? item.divisions[0] ?? null
          : item.divisions,
      })) ?? [];

    setInviteCodes(mappedInviteCodes as InviteCode[]);
    setLoading(false);
  };

  useEffect(() => {
    if (tenantSlug) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug]);

  const canCreateCoordinatorCode =
    isPlatformAdmin || churchRole === "CHURCH_ADMIN";

  const canCreateServantCode =
    isPlatformAdmin ||
    churchRole === "CHURCH_ADMIN" ||
    coordinatorDivisions.length > 0;

  const selectableDivisions =
    isPlatformAdmin || churchRole === "CHURCH_ADMIN"
      ? divisions
      : coordinatorDivisions;

  const generateCode = () => {
    const prefix =
      roleToAssign === "DIVISION_COORDINATOR" ? "COORD" : "SERVANT";

    const divisionName =
      divisions.find((division) => division.id === divisionId)?.slug ??
      church?.slug ??
      "church";

    const random = Math.random().toString(36).slice(2, 8).toUpperCase();

    return `${divisionName}-${prefix}-${random}`.toUpperCase();
  };

  const handleCreateCode = async () => {
    if (!church || !profile) {
      setStatus("Anda belum login atau data gereja tidak ditemukan.");
      return;
    }

    if (!canCreateServantCode) {
      setStatus("Anda tidak punya akses untuk membuat invite code.");
      return;
    }

    if (roleToAssign === "DIVISION_COORDINATOR" && !canCreateCoordinatorCode) {
      setStatus("Hanya Church Admin yang bisa membuat kode koordinator.");
      return;
    }

    if (roleToAssign === "DIVISION_COORDINATOR" && !divisionId) {
      setStatus("Kode koordinator harus memilih divisi.");
      return;
    }

    if (
      roleToAssign === "SERVANT" &&
      churchRole !== "CHURCH_ADMIN" &&
      !isPlatformAdmin &&
      coordinatorDivisions.length > 0 &&
      !divisionId
    ) {
      setStatus("Koordinator harus memilih divisi untuk kode servant.");
      return;
    }

    if (
      roleToAssign === "SERVANT" &&
      churchRole !== "CHURCH_ADMIN" &&
      !isPlatformAdmin &&
      divisionId &&
      !coordinatorDivisions.some((division) => division.id === divisionId)
    ) {
      setStatus("Koordinator hanya bisa membuat kode untuk divisinya sendiri.");
      return;
    }

    setSaving(true);
    setStatus("Membuat invite code...");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(validDays || 7));

    const code = generateCode();

    const { error } = await supabase.from("invite_codes").insert({
      church_id: church.id,
      division_id: divisionId || null,
      code,
      role_to_assign: roleToAssign,
      max_uses: Number(maxUses || 1),
      used_count: 0,
      expires_at: expiresAt.toISOString(),
      is_active: true,
      created_by: profile.id,
    });

    setSaving(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus(`Invite code berhasil dibuat: ${code}`);
    setDivisionId("");
    setRoleToAssign("SERVANT");
    setMaxUses("20");
    setValidDays("7");
    await loadData();
  };

  const handleDeactivateCode = async (id: string) => {
    if (!church) return;

    const confirmed = window.confirm("Nonaktifkan invite code ini?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("invite_codes")
      .update({ is_active: false })
      .eq("id", id)
      .eq("church_id", church.id);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Invite code berhasil dinonaktifkan.");
    await loadData();
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setStatus(`Kode ${code} berhasil dicopy.`);
    } catch {
      setStatus("Gagal copy kode.");
    }
  };

  const copyJoinLink = async (code: string) => {
    const link = getJoinLink(tenantSlug, code);

    try {
      await navigator.clipboard.writeText(link);
      setStatus(`Join link untuk ${code} berhasil dicopy.`);
    } catch {
      setStatus("Gagal copy join link.");
    }
  };

  const copyWhatsappText = async (item: InviteCode) => {
    const link = getJoinLink(tenantSlug, item.code);
    const divisionName = item.divisions?.name ?? "Church Level";

    const text = `Shalom, silakan join KiraServe untuk ${church?.name ?? "church"}.

Divisi: ${divisionName}
Kode: ${item.code}

Klik link ini untuk join:
${link}`;

    try {
      await navigator.clipboard.writeText(text);
      setStatus(`Text WhatsApp untuk ${item.code} berhasil dicopy.`);
    } catch {
      setStatus("Gagal copy text WhatsApp.");
    }
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

        <div className="mx-auto max-w-[1400px] px-8 py-24 md:px-14">
          <p className="text-lg font-bold text-slate-500">
            {redirecting ? "Redirecting..." : "Loading invite codes..."}
          </p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800">
        <AppNavbar mode="central" />

        <div className="mx-auto max-w-[900px] px-8 py-24 text-center md:px-14">
          <h1 className="text-5xl font-black tracking-[-0.05em] text-slate-900">
            Anda belum login.
          </h1>

          <p className="mt-5 text-lg text-slate-500">
            Login terlebih dahulu untuk membuat atau melihat invite code.
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

        <div className="relative z-10 mx-auto max-w-[1400px]">
          <a
            href={`/church/${tenantSlug}/dashboard`}
            className="mb-8 inline-flex rounded-full border border-white/15 bg-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/70 backdrop-blur-md transition hover:bg-white/20 hover:text-white"
          >
            ← Church Dashboard
          </a>

          <p className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-100 backdrop-blur-md">
            Invite Codes
          </p>

          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <h1 className="max-w-5xl text-5xl font-black leading-[0.95] tracking-[-0.05em] text-white md:text-7xl">
                Kode Join.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100/70">
                Generate kode atau link join supaya member bisa masuk ke church
                dan divisi tanpa assign email satu per satu.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <p className="text-sm font-bold text-blue-100/70">
                Current Church
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-white">
                {church?.name ?? "No Church"}
              </h2>

              <p className="mt-2 text-sm text-blue-100/60">
                Login sebagai {profile.email}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-20 -mt-14 rounded-t-[3rem] bg-slate-50 px-8 py-14 md:px-14">
        <div className="mx-auto grid max-w-[1400px] gap-8 xl:grid-cols-[0.85fr_1.15fr] xl:items-start">
          <div className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/60 md:p-10">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
              Generate Code
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-900">
              Buat kode baru
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-500">
              Pilih divisi bila kode ini hanya untuk divisi tertentu. Serving
              role tetap diatur dari halaman division/member list.
            </p>

            {!canCreateServantCode ? (
              <div className="mt-8 rounded-[2rem] border border-red-100 bg-red-50 p-6">
                <p className="text-sm font-bold leading-7 text-red-700">
                  Anda belum punya akses untuk membuat invite code.
                </p>
              </div>
            ) : (
              <div className="mt-8">
                <Field label="Role yang diberikan">
                  <select
                    value={roleToAssign}
                    onChange={(event) => setRoleToAssign(event.target.value)}
                    className="input"
                  >
                    <option value="SERVANT">Servant / Member</option>
                    {canCreateCoordinatorCode && (
                      <option value="DIVISION_COORDINATOR">
                        Division Coordinator
                      </option>
                    )}
                  </select>
                </Field>

                <Field label="Divisi">
                  <select
                    value={divisionId}
                    onChange={(event) => setDivisionId(event.target.value)}
                    className="input"
                  >
                    <option value="">Church level / Tanpa divisi</option>
                    {selectableDivisions.map((division) => (
                      <option key={division.id} value={division.id}>
                        {division.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Max Uses">
                    <input
                      value={maxUses}
                      onChange={(event) => setMaxUses(event.target.value)}
                      type="number"
                      min="1"
                      className="input"
                    />
                  </Field>

                  <Field label="Valid Days">
                    <input
                      value={validDays}
                      onChange={(event) => setValidDays(event.target.value)}
                      type="number"
                      min="1"
                      className="input"
                    />
                  </Field>
                </div>

                <button
                  type="button"
                  onClick={handleCreateCode}
                  disabled={saving}
                  className="mt-2 w-full rounded-full bg-blue-600 px-8 py-5 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-blue-500 disabled:opacity-60"
                >
                  {saving ? "Creating..." : "Generate Invite Code →"}
                </button>
              </div>
            )}

            {status && (
              <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <p className="text-sm font-bold leading-7 text-blue-700">
                  {status}
                </p>
              </div>
            )}
          </div>

          <div className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/60 md:p-10">
            <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
                  Active Codes
                </p>

                <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-900">
                  Daftar Kode
                </h2>
              </div>

              <a
                href={`/church/${tenantSlug}/join`}
                className="w-fit rounded-full border border-slate-200 px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-600 transition hover:border-blue-600 hover:text-blue-600"
              >
                Test Join Page
              </a>
            </div>

            <div className="grid gap-4">
              {inviteCodes.length > 0 ? (
                inviteCodes.map((item) => (
                  <InviteCodeCard
                    key={item.id}
                    item={item}
                    tenantSlug={tenantSlug}
                    onCopy={copyCode}
                    onCopyJoinLink={copyJoinLink}
                    onCopyWhatsappText={copyWhatsappText}
                    onDeactivate={handleDeactivateCode}
                  />
                ))
              ) : (
                <div className="rounded-[2rem] bg-slate-50 p-8 text-center">
                  <h3 className="text-3xl font-black tracking-[-0.05em] text-slate-900">
                    Belum ada kode.
                  </h3>

                  <p className="mt-3 text-slate-500">
                    Generate kode pertama untuk mulai onboarding.
                  </p>
                </div>
              )}
            </div>
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

function InviteCodeCard({
  item,
  tenantSlug,
  onCopy,
  onCopyJoinLink,
  onCopyWhatsappText,
  onDeactivate,
}: {
  item: InviteCode;
  tenantSlug: string;
  onCopy: (code: string) => void;
  onCopyJoinLink: (code: string) => void;
  onCopyWhatsappText: (item: InviteCode) => void;
  onDeactivate: (id: string) => void;
}) {
  const expired = item.expires_at
    ? new Date(item.expires_at).getTime() < Date.now()
    : false;

  const usedUp = item.used_count >= item.max_uses;
  const active = item.is_active && !expired && !usedUp;
  const joinLink = getJoinLink(tenantSlug, item.code);

  return (
    <article className="rounded-[2rem] border border-slate-100 bg-slate-50 p-6">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600">
            {item.divisions?.name ?? "Church Level"}
          </p>

          <h3 className="mt-3 break-all text-3xl font-black tracking-[-0.05em] text-slate-900">
            {item.code}
          </h3>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Role: <b>{item.role_to_assign}</b> • Used: {item.used_count}/
            {item.max_uses}
          </p>

          <p className="mt-1 text-sm leading-6 text-slate-400">
            Expired:{" "}
            {item.expires_at
              ? new Date(item.expires_at).toLocaleDateString("id-ID")
              : "-"}
          </p>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Join Link
            </p>

            <p className="mt-2 break-all text-xs font-bold leading-5 text-slate-500">
              {joinLink}
            </p>
          </div>
        </div>

        <span
          className={`w-fit rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em] ${
            active
              ? "bg-emerald-50 text-emerald-600"
              : "bg-red-50 text-red-600"
          }`}
        >
          {active ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onCopy(item.code)}
          className="rounded-full bg-slate-900 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-blue-600"
        >
          Copy Code
        </button>

        <button
          type="button"
          onClick={() => onCopyJoinLink(item.code)}
          className="rounded-full border border-blue-200 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-blue-600 transition hover:bg-blue-600 hover:text-white"
        >
          Copy Join Link
        </button>

        <button
          type="button"
          onClick={() => onCopyWhatsappText(item)}
          className="rounded-full border border-emerald-200 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-emerald-600 transition hover:bg-emerald-600 hover:text-white"
        >
          Copy WA Text
        </button>

        {item.is_active && (
          <button
            type="button"
            onClick={() => onDeactivate(item.id)}
            className="rounded-full border border-red-200 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-red-600 transition hover:bg-red-600 hover:text-white"
          >
            Deactivate
          </button>
        )}
      </div>
    </article>
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