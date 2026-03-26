"use client";

import Link from "next/link";
import { useState } from "react";
import type { SessionUser } from "@/lib/auth";
import { SESSION_KEY } from "@/lib/auth";

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
  const [session] = useState<SessionUser | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as SessionUser;
    } catch {
      return null;
    }
  });

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.reload();
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
          {session && (
            <button
              type="button"
              onClick={logout}
              className="rounded border border-amber-300/40 px-2 py-1 text-xs text-amber-100/90 hover:text-amber-300"
            >
              Logout ({session.username})
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
