"use client";

import { useMemo, useState } from "react";
import type { AccountProfile, SessionUser } from "@/lib/auth";
import { ACCOUNT_PROFILES_KEY, SESSION_KEY } from "@/lib/auth";
import { aosCareers, aosFactions, aosRaces, defaultPermissionsForRoles, normalizeProfile, PROFILES_KEY } from "@/lib/campaign";
import type { Profile, Role } from "@/lib/campaign";

export function MyProfileClient() {
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
  const [profiles, setProfiles] = useState<AccountProfile[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(ACCOUNT_PROFILES_KEY) ?? "[]") as AccountProfile[];
    } catch {
      return [];
    }
  });
  const [campaignProfiles, setCampaignProfiles] = useState<Profile[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(PROFILES_KEY);
      if (!raw) return [];
      return (JSON.parse(raw) as Array<Partial<Profile>>).map((entry) => normalizeProfile(entry));
    } catch {
      return [];
    }
  });

  const current = useMemo(() => {
    if (!session) return null;
    return (
      profiles.find((profile) => profile.username === session.username) ?? {
        username: session.username,
        displayName: session.username,
        avatarUrl: "",
        faction: "",
        subfaction: "",
        homeland: "",
        tags: [],
        bio: "",
        favoriteRealm: "",
      }
    );
  }, [profiles, session]);
  const currentCampaignProfile = useMemo(() => {
    if (!session) return null;
    const byUser = campaignProfiles.find((profile) => profile.username === session.username);
    if (byUser) return byUser;
    return campaignProfiles.find((profile) => profile.displayName === current?.displayName) ?? null;
  }, [campaignProfiles, current?.displayName, session]);

  const [tagsInput, setTagsInput] = useState(current?.tags.join(", ") ?? "");
  if (!session || !current) return null;
  const currentUsername = session.username;

  function persist(next: AccountProfile[]) {
    setProfiles(next);
    localStorage.setItem(ACCOUNT_PROFILES_KEY, JSON.stringify(next));
  }
  function persistCampaign(next: Profile[]) {
    setCampaignProfiles(next);
    localStorage.setItem(PROFILES_KEY, JSON.stringify(next));
  }

  function updateField<K extends keyof AccountProfile>(key: K, value: AccountProfile[K]) {
    const updated = { ...current, [key]: value } as AccountProfile;
    const other = profiles.filter((profile) => profile.username !== currentUsername);
    persist([updated, ...other]);
  }

  function saveTags() {
    const tags = tagsInput.split(",").map((item) => item.trim()).filter(Boolean);
    updateField("tags", tags);
    if (currentCampaignProfile) {
      const next = campaignProfiles.map((profile) =>
        profile.id === currentCampaignProfile.id ? { ...profile, tags } : profile,
      );
      persistCampaign(next);
    }
  }

  function updateCampaignField<K extends keyof Profile>(key: K, value: Profile[K]) {
    if (!currentCampaignProfile) return;
    const next = campaignProfiles.map((profile) =>
      profile.id === currentCampaignProfile.id ? { ...profile, [key]: value } : profile,
    );
    persistCampaign(next);
  }

  function toggleRole(role: Role) {
    if (!currentCampaignProfile) return;
    const has = currentCampaignProfile.roles.includes(role);
    const roles: Role[] = has
      ? currentCampaignProfile.roles.filter((entry) => entry !== role)
      : [...currentCampaignProfile.roles, role];
    const normalized: Role[] = roles.length ? roles : ["player"];
    const permissions = defaultPermissionsForRoles(normalized);
    const next = campaignProfiles.map((profile) =>
      profile.id === currentCampaignProfile.id ? { ...profile, roles: normalized, permissions } : profile,
    );
    persistCampaign(next);
  }

  return (
    <div className="space-y-6">
      <section className="panel noble-hero p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-blue-900/30 bg-white/70">
            {current.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.avatarUrl} alt="avatar preview" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-2xl font-bold text-blue-900">
                {(current.displayName || session.username).slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-900">My Account</p>
            <h2 className="text-2xl font-bold text-blue-950">{current.displayName || session.username}</h2>
            <p className="text-sm opacity-80">@{session.username}</p>
            {currentCampaignProfile && (
              <p className="mt-1 text-xs">
                {currentCampaignProfile.race} - {currentCampaignProfile.career} | {currentCampaignProfile.title || "No title"}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="panel p-5 space-y-3">
          <h3 className="rune-title text-xs text-blue-900">Identity</h3>
          <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Display Name" value={current.displayName} onChange={(e) => updateField("displayName", e.target.value)} />
          <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Avatar URL (image link)" value={current.avatarUrl} onChange={(e) => updateField("avatarUrl", e.target.value)} />
          <textarea className="w-full rounded border px-3 py-2 text-sm" placeholder="Character / player bio" value={current.bio} onChange={(e) => updateField("bio", e.target.value)} />
          <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Homeland / Stronghold" value={current.homeland} onChange={(e) => updateField("homeland", e.target.value)} />
          <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Favorite Mortal Realm (Aqshy, Ghyran, etc.)" value={current.favoriteRealm} onChange={(e) => updateField("favoriteRealm", e.target.value)} />
        </article>

        <article className="panel p-5 space-y-3">
          <h3 className="rune-title text-xs text-blue-900">Warhammer Profile</h3>
          <select className="w-full rounded border px-3 py-2 text-sm" value={current.faction} onChange={(e) => updateField("faction", e.target.value)}>
            <option value="">Select Faction</option>
            {aosFactions.map((faction) => <option key={faction} value={faction}>{faction}</option>)}
          </select>
          <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Subfaction / Warband" value={current.subfaction} onChange={(e) => updateField("subfaction", e.target.value)} />
          {currentCampaignProfile && (
            <>
              <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Name" value={currentCampaignProfile.displayName} onChange={(e) => updateCampaignField("displayName", e.target.value)} />
              <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Title" value={currentCampaignProfile.title} onChange={(e) => updateCampaignField("title", e.target.value)} />
              <select className="w-full rounded border px-3 py-2 text-sm" value={currentCampaignProfile.race} onChange={(e) => updateCampaignField("race", e.target.value)}>
                <option value="">Select Race</option>
                {aosRaces.map((race) => <option key={race} value={race}>{race}</option>)}
              </select>
              <input className="w-full rounded border px-3 py-2 text-sm" list="me-careers" placeholder="Career (searchable)" value={currentCampaignProfile.career} onChange={(e) => updateCampaignField("career", e.target.value)} />
              <datalist id="me-careers">
                {aosCareers.map((career) => <option key={career} value={career} />)}
              </datalist>
              <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Character Sheet URL" value={currentCampaignProfile.sheetUrl} onChange={(e) => updateCampaignField("sheetUrl", e.target.value)} />
              <div className="rounded border bg-white/70 p-3">
                <p className="text-xs font-semibold text-blue-900">Roles</p>
                <div className="mt-2 flex gap-3 text-xs">
                  {(["player", "gamemaster"] as Role[]).map((role) => (
                    <label key={role} className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={currentCampaignProfile.roles.includes(role)} onChange={() => toggleRole(role)} />
                      {role}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
          <div className="space-y-2">
            <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Tags (comma separated)" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
            <button type="button" onClick={saveTags} className="rounded border px-3 py-1 text-xs">Save Tags</button>
          </div>
        </article>
      </section>
    </div>
  );
}
