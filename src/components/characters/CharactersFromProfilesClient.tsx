"use client";

import { useState } from "react";
import type { Profile } from "@/lib/campaign";
import { normalizeProfile, PROFILES_KEY } from "@/lib/campaign";

export function CharactersFromProfilesClient() {
  const [profiles] = useState<Profile[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(PROFILES_KEY);
      if (!raw) return [];
      return (JSON.parse(raw) as Array<Partial<Profile>>).map((entry) => normalizeProfile(entry));
    } catch {
      return [];
    }
  });

  return (
    <section className="grid gap-4 md:grid-cols-2">
      {profiles.map((profile) => (
        <a
          key={profile.id}
          href={profile.sheetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="panel noble-card block p-5"
        >
          <p className="text-xs uppercase tracking-wide text-blue-900">{profile.rank}</p>
          <h2 className="text-lg font-bold text-blue-950">{profile.displayName}</h2>
          <p className="text-sm">{profile.race} - {profile.career}</p>
          <p className="mt-1 text-xs opacity-80">Roles: {profile.roles.join(", ")}</p>
          <p className="mt-2 text-xs font-semibold text-blue-900">Open linked Character Sheet</p>
        </a>
      ))}
      {profiles.length === 0 && (
        <article className="panel p-5 text-sm">
          No characters yet. Create profiles in `/profiles` and they will show up here automatically.
        </article>
      )}
    </section>
  );
}
