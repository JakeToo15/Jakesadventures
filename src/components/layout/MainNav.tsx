"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

const links = [
  { href: "/", label: "Start" },
  { href: "/regelwerk", label: "Regelwerk" },
  { href: "/dice", label: "Dice Roller" },
  { href: "/characters", label: "Charaktere" },
  { href: "/me", label: "My Profile" },
  { href: "/gm", label: "Gamemaster" },
  { href: "/maps", label: "Maps" },
];

export function MainNav() {
  const [authUser, setAuthUser] = useState<{ id: string; email?: string | null } | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setAuthUser(data.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setAuthUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const username = authUser?.email?.split("@")?.[0] ?? null;

  function logout() {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    supabase.auth.signOut().catch(() => window.location.reload());
  }

  return (
    <header className="border-b border-amber-950/50 bg-stone-950/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="rune-title text-sm text-amber-300 sm:text-lg">
          Jakes Adventures
        </Link>
        <nav className="flex items-center gap-3 sm:gap-5">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-amber-100/90 hover:text-amber-300"
            >
              {link.label}
            </Link>
          ))}
          {authUser && (
            <button
              type="button"
              onClick={logout}
              className="rounded border border-amber-300/40 px-2 py-1 text-xs text-amber-100/90 hover:text-amber-300"
            >
              Logout ({username ?? "user"})
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
