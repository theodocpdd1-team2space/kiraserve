"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type AppNavbarProps = {
  isPlatformAdmin?: boolean;
  churchRole?: string | null;
};

export default function AppNavbar({
  isPlatformAdmin = false,
  churchRole = null,
}: AppNavbarProps) {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setEmail(user?.email ?? null);
    };

    loadUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-6 md:px-10">
        <a
          href="/dashboard"
          className="text-2xl font-black tracking-[-0.05em] text-slate-900"
        >
          KiraServe
        </a>

        <nav className="hidden items-center gap-2 md:flex">
          <NavLink href="/dashboard" label="Dashboard" />
          <NavLink href="/divisions" label="Divisions" />
          <NavLink href="/schedules" label="Schedules" />
          <NavLink href="/invite-codes" label="Invite Codes" />
          <NavLink href="/join" label="Join" />
          <NavLink href="/settings" label="Settings" />

          {isPlatformAdmin && <NavLink href="/admin" label="Admin" />}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden rounded-full bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500 md:inline-flex">
            {isPlatformAdmin
              ? "Super Admin"
              : churchRole === "CHURCH_ADMIN"
              ? "Church Admin"
              : email
              ? "Member"
              : "Guest"}
          </span>

          {email ? (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-slate-900 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-red-600"
            >
              Logout
            </button>
          ) : (
            <a
              href="/login"
              className="rounded-full bg-slate-900 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-blue-600"
            >
              Login
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="rounded-full px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500 transition hover:bg-slate-100 hover:text-blue-600"
    >
      {label}
    </a>
  );
}