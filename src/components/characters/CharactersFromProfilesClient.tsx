"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { Profile } from "@/lib/campaign";
import { normalizeProfile } from "@/lib/campaign";

type CharacterVM = {
  id: string;
  displayName: string;
  race: string;
  career: string;
  rank: Profile["rank"];
  roles: Profile["roles"];
  sheetUrl: string;
  title?: string;
};

export function CharactersFromProfilesClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [characters, setCharacters] = useState<CharacterVM[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setError("Supabase not configured.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        if (!cancelled) {
          setError("Not signed in.");
          setLoading(false);
        }
        return;
      }

      const { data, error: qError } = await supabase
        .from("campaign_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (qError) {
        if (!cancelled) setError(qError.message);
        setLoading(false);
        return;
      }

      const mapped: CharacterVM[] = (data ?? [])
        .map((row) => normalizeProfile(row as unknown as Parameters<typeof normalizeProfile>[0]))
        .filter((p) => Boolean(p.sheetUrl))
        .map((p) => ({
          id: p.id,
          displayName: p.displayName,
          race: p.race,
          career: p.career,
          rank: p.rank,
          roles: p.roles,
          sheetUrl: p.sheetUrl,
          title: p.title,
        }));

      if (!cancelled) setCharacters(mapped);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const subtitle = useMemo(() => `Loaded ${characters.length} character sheets`, [characters.length]);

  if (loading) return <div className="min-h-[120px] text-sm opacity-80">Loading characters...</div>;
  if (error) return <div className="panel p-5 text-sm text-red-700">{error}</div>;

  return (
    <section className="space-y-4">
      <div className="text-xs opacity-80">{subtitle}</div>
      <div className="grid gap-4 md:grid-cols-2">
        {characters.map((character) => (
          <a
            key={character.id}
            href={character.sheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="panel noble-card block p-5"
          >
            <p className="text-xs uppercase tracking-wide text-blue-900">{character.rank}</p>
            <h2 className="text-lg font-bold text-blue-950">{character.displayName}</h2>
            <p className="text-sm">{character.race} - {character.career}</p>
            <p className="mt-1 text-xs opacity-80">{character.roles.join(", ")}</p>
            <p className="mt-2 text-xs font-semibold text-blue-900">Open linked Character Sheet</p>
          </a>
        ))}
        {characters.length === 0 && (
          <article className="panel p-5 text-sm">
            No character sheets found yet. Create a profile via registration.
          </article>
        )}
      </div>
    </section>
  );
}

