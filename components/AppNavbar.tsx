"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type AppNavbarProps = {
  isPlatformAdmin?: boolean;
  churchRole?: string | null;
  mode?: "central" | "church";
  tenantSlug?: string;
};

export default function AppNavbar({
  isPlatformAdmin = false,
  churchRole = null,
  mode = "central",
  tenantSlug = "gsjs",
}: AppNavbarProps) {
  const [email, setEmail] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement | null>(null);

  const mainLinks =
    mode === "church"
      ? [
          { href: "/dashboard", label: "Home" },
          { href: `/church/${tenantSlug}/divisions`, label: "Divisions" },
          { href: `/church/${tenantSlug}/schedules`, label: "Schedules" },
        ]
      : [{ href: "/dashboard", label: "Home" }];

  const moreLinks =
    mode === "church"
      ? [
          {
            href: `/church/${tenantSlug}/invite-codes`,
            label: "Invite Codes",
          },
          { href: `/church/${tenantSlug}/join`, label: "Join Code" },
          {
            href: `/church/${tenantSlug}/settings`,
            label: "Church Settings",
          },
        ]
      : [{ href: "/church/request", label: "Request Church" }];

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setEmail(user?.email ?? null);
    };

    loadUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const roleLabel = isPlatformAdmin
    ? "Super Admin"
    : churchRole === "CHURCH_ADMIN"
    ? "Church Admin"
    : email
    ? "Member"
    : "Guest";

  const desktopMoreLinks = isPlatformAdmin
    ? [...moreLinks, { href: "/admin", label: "Admin" }]
    : moreLinks;

  const mobileLinks = isPlatformAdmin
    ? [...mainLinks, ...moreLinks, { href: "/admin", label: "Admin" }]
    : [...mainLinks, ...moreLinks];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-6 md:px-10">
        <Link
          href="/dashboard"
          className="text-2xl font-black tracking-[-0.06em] text-slate-900"
          onClick={() => {
            setMoreOpen(false);
            setMobileOpen(false);
          }}
        >
          KiraServe
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {mainLinks.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {email && (
            <span className="rounded-full bg-slate-100 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              {roleLabel}
            </span>
          )}

          <div className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((prev) => !prev)}
              className="rounded-full border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-600 transition hover:border-blue-600 hover:text-blue-600"
            >
              More
            </button>

            {moreOpen && (
              <div className="absolute right-0 top-14 w-64 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/10">
                {desktopMoreLinks.map((item) => (
                  <DropdownLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    onClick={() => setMoreOpen(false)}
                  />
                ))}
              </div>
            )}
          </div>

          {email ? (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-slate-900 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-red-600"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-slate-900 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-blue-600"
            >
              Login
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white lg:hidden"
          aria-label="Open menu"
        >
          <span className="grid gap-1.5">
            <span className="block h-0.5 w-5 rounded-full bg-white" />
            <span className="block h-0.5 w-5 rounded-full bg-white" />
            <span className="block h-0.5 w-5 rounded-full bg-white" />
          </span>
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-6 py-5 lg:hidden">
          <div className="mx-auto grid max-w-[1400px] gap-2">
            {email && (
              <div className="mb-3 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                  Signed in as
                </p>
                <p className="mt-2 break-all text-sm font-black text-slate-900">
                  {email}
                </p>
                <p className="mt-1 text-xs font-bold text-blue-600">
                  {roleLabel}
                </p>
              </div>
            )}

            {mobileLinks.map((item) => (
              <MobileLink
                key={item.href}
                href={item.href}
                label={item.label}
                onClick={() => setMobileOpen(false)}
              />
            ))}

            <div className="mt-3 border-t border-slate-100 pt-4">
              {email ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-full bg-slate-900 px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-red-600"
                >
                  Logout
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex w-full justify-center rounded-full bg-slate-900 px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-blue-600"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      prefetch
      className="rounded-full px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 transition hover:bg-slate-100 hover:text-blue-600"
    >
      {label}
    </Link>
  );
}

function DropdownLink({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      prefetch
      onClick={onClick}
      className="block rounded-2xl px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 hover:text-blue-600"
    >
      {label}
    </Link>
  );
}

function MobileLink({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      prefetch
      onClick={onClick}
      className="flex items-center justify-between rounded-2xl bg-slate-50 px-5 py-4 text-sm font-black text-slate-700 transition hover:bg-blue-50 hover:text-blue-600"
    >
      {label}
      <span>→</span>
    </Link>
  );
}