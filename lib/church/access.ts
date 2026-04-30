import { supabase } from "@/lib/supabase/client";

export type ChurchAccess = {
  allowed: boolean;
  reason?: string;
  userEmail: string | null;
  profileId: string | null;
  churchId: string | null;
  churchName: string | null;
  churchSlug: string | null;
  churchRole: string | null;
  isPlatformAdmin: boolean;
};

export async function getChurchAccess(
  tenantSlug: string
): Promise<ChurchAccess> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return {
      allowed: false,
      reason: "NOT_LOGGED_IN",
      userEmail: null,
      profileId: null,
      churchId: null,
      churchName: null,
      churchSlug: tenantSlug,
      churchRole: null,
      isPlatformAdmin: false,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, name")
    .eq("email", user.email)
    .maybeSingle();

  if (!profile) {
    return {
      allowed: false,
      reason: "PROFILE_NOT_FOUND",
      userEmail: user.email,
      profileId: null,
      churchId: null,
      churchName: null,
      churchSlug: tenantSlug,
      churchRole: null,
      isPlatformAdmin: false,
    };
  }

  const { data: church } = await supabase
    .from("churches")
    .select("id, name, slug")
    .eq("slug", tenantSlug)
    .maybeSingle();

  if (!church) {
    return {
      allowed: false,
      reason: "CHURCH_NOT_FOUND",
      userEmail: user.email,
      profileId: profile.id,
      churchId: null,
      churchName: null,
      churchSlug: tenantSlug,
      churchRole: null,
      isPlatformAdmin: false,
    };
  }

  const { data: platformAdmin } = await supabase
    .from("platform_admins")
    .select("role")
    .eq("profile_id", profile.id)
    .maybeSingle();

  const isPlatformAdmin =
    platformAdmin?.role === "KIRASERVE_SUPER_ADMIN";

  if (isPlatformAdmin) {
    return {
      allowed: true,
      userEmail: user.email,
      profileId: profile.id,
      churchId: church.id,
      churchName: church.name,
      churchSlug: church.slug,
      churchRole: null,
      isPlatformAdmin: true,
    };
  }

  const { data: churchMember } = await supabase
    .from("church_members")
    .select("role")
    .eq("church_id", church.id)
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!churchMember) {
    return {
      allowed: false,
      reason: "NO_CHURCH_ACCESS",
      userEmail: user.email,
      profileId: profile.id,
      churchId: church.id,
      churchName: church.name,
      churchSlug: church.slug,
      churchRole: null,
      isPlatformAdmin: false,
    };
  }

  return {
    allowed: true,
    userEmail: user.email,
    profileId: profile.id,
    churchId: church.id,
    churchName: church.name,
    churchSlug: church.slug,
    churchRole: churchMember.role,
    isPlatformAdmin: false,
  };
}