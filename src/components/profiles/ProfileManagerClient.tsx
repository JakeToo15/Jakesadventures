"use client";

import { useMemo, useState } from "react";
import type { Permission, Profile, Rank, Role } from "@/lib/campaign";
import {
  aosCareers,
  aosFactions,
  aosRaces,
  defaultPermissionsForRoles,
  normalizeProfile,
  permissionLabels,
  PROFILES_KEY,
} from "@/lib/campaign";

function createId() {
  return `profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const rankOptions: Rank[] = ["Recruit", "Veteran", "Champion", "Lord"];
const permissionOptions = Object.keys(permissionLabels) as Permission[];

export function ProfileManagerClient() {
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(PROFILES_KEY);
      if (!raw) return [];
      return (JSON.parse(raw) as Array<Partial<Profile>>).map((entry) => normalizeProfile(entry));
    } catch {
      return [];
    }
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    displayName: "",
    race: "",
    career: "",
    title: "",
    rank: "Recruit" as Rank,
    roles: ["player"] as Role[],
    permissions: defaultPermissionsForRoles(["player"]),
    sheetUrl: "",
    faction: "",
    tagsInput: "",
  });
  const [careerQuery, setCareerQuery] = useState("");

  function persist(next: Profile[]) {
    setProfiles(next);
    localStorage.setItem(PROFILES_KEY, JSON.stringify(next));
  }

  const editingProfile = useMemo(
    () => profiles.find((profile) => profile.id === editingId) ?? null,
    [profiles, editingId],
  );

  function startCreate() {
    setEditingId(null);
    setDraft({
      displayName: "",
      race: "",
      career: "",
      title: "",
      rank: "Recruit",
      roles: ["player"],
      permissions: defaultPermissionsForRoles(["player"]),
      sheetUrl: "",
      faction: "",
      tagsInput: "",
    });
  }

  function startEdit(profile: Profile) {
    setEditingId(profile.id);
    setDraft({
      displayName: profile.displayName,
      race: profile.race,
      career: profile.career,
      title: profile.title,
      rank: profile.rank,
      roles: profile.roles,
      permissions: profile.permissions,
      sheetUrl: profile.sheetUrl,
      faction: profile.faction,
      tagsInput: profile.tags.join(", "),
    });
    setCareerQuery(profile.career);
  }

  function togglePermission(permission: Permission) {
    setDraft((prev) => {
      const has = prev.permissions.includes(permission);
      const nextPermissions = has
        ? prev.permissions.filter((item) => item !== permission)
        : [...prev.permissions, permission];
      return {
        ...prev,
        permissions: nextPermissions.length ? nextPermissions : defaultPermissionsForRoles(prev.roles),
      };
    });
  }

  function toggleRole(role: Role) {
    setDraft((prev) => {
      const has = prev.roles.includes(role);
      const roles = has ? prev.roles.filter((item) => item !== role) : [...prev.roles, role];
      const normalizedRoles: Role[] = roles.length ? roles : ["player"];
      const required = defaultPermissionsForRoles(normalizedRoles);
      const merged = Array.from(new Set([...required, ...prev.permissions]));
      return { ...prev, roles: normalizedRoles, permissions: merged };
    });
  }

  function saveProfile() {
    if (!draft.displayName.trim() || !draft.race.trim() || !draft.career.trim() || !draft.sheetUrl.trim()) return;
    const tags = draft.tagsInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (editingProfile) {
      const next = profiles.map((profile) =>
        profile.id === editingProfile.id
          ? {
              ...profile,
              displayName: draft.displayName.trim(),
              race: draft.race.trim(),
              career: draft.career.trim(),
              title: draft.title.trim(),
              rank: draft.rank,
              roles: draft.roles,
              permissions: draft.permissions,
              sheetUrl: draft.sheetUrl.trim(),
              faction: draft.faction.trim(),
              tags,
            }
          : profile,
      );
      persist(next);
      return;
    }
    const newProfile: Profile = {
      id: createId(),
      username: "",
      displayName: draft.displayName.trim(),
      race: draft.race.trim(),
      career: draft.career.trim(),
      title: draft.title.trim(),
      rank: draft.rank,
      roles: draft.roles,
      permissions: draft.permissions,
      sheetUrl: draft.sheetUrl.trim(),
      faction: draft.faction.trim(),
      tags,
      createdAt: Date.now(),
    };
    persist([newProfile, ...profiles]);
    startCreate();
  }

  function deleteProfile(id: string) {
    persist(profiles.filter((profile) => profile.id !== id));
    if (editingId === id) startCreate();
  }

  return (
    <div className="space-y-5">
      <section className="panel p-5">
        <div className="flex items-center justify-between">
          <h2 className="rune-title text-sm text-blue-900">Profile Forge</h2>
          <button type="button" className="rounded border px-3 py-1 text-xs" onClick={startCreate}>
            New Profile
          </button>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input className="rounded border px-3 py-2 text-sm" placeholder="Name" value={draft.displayName} onChange={(e) => setDraft((prev) => ({ ...prev, displayName: e.target.value }))} />
          <input className="rounded border px-3 py-2 text-sm" placeholder="Title (optional)" value={draft.title} onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))} />
          <select className="rounded border px-3 py-2 text-sm" value={draft.race} onChange={(e) => setDraft((prev) => ({ ...prev, race: e.target.value }))}>
            <option value="">Select Race</option>
            {aosRaces.map((race) => <option key={race} value={race}>{race}</option>)}
          </select>
          <div className="space-y-2">
            <input
              className="w-full rounded border px-3 py-2 text-sm"
              list="aos-careers"
              placeholder="Career (type to search)"
              value={careerQuery}
              onChange={(e) => {
                setCareerQuery(e.target.value);
                setDraft((prev) => ({ ...prev, career: e.target.value }));
              }}
            />
            <datalist id="aos-careers">
              {aosCareers.map((career) => <option key={career} value={career} />)}
            </datalist>
          </div>
          <select className="rounded border px-3 py-2 text-sm" value={draft.rank} onChange={(e) => setDraft((prev) => ({ ...prev, rank: e.target.value as Rank }))}>
            {rankOptions.map((rank) => <option key={rank} value={rank}>{rank}</option>)}
          </select>
          <select className="rounded border px-3 py-2 text-sm" value={draft.faction} onChange={(e) => setDraft((prev) => ({ ...prev, faction: e.target.value }))}>
            <option value="">Select Faction</option>
            {aosFactions.map((faction) => <option key={faction} value={faction}>{faction}</option>)}
          </select>
          <input className="rounded border px-3 py-2 text-sm" placeholder="Tags (comma separated)" value={draft.tagsInput} onChange={(e) => setDraft((prev) => ({ ...prev, tagsInput: e.target.value }))} />
          <input className="md:col-span-2 rounded border px-3 py-2 text-sm" placeholder="Google Sheet URL" value={draft.sheetUrl} onChange={(e) => setDraft((prev) => ({ ...prev, sheetUrl: e.target.value }))} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <p className="w-full text-xs font-semibold text-blue-900">Roles</p>
          {(["player", "gamemaster"] as Role[]).map((role) => (
            <label key={role} className="inline-flex items-center gap-2 rounded border bg-white px-3 py-1 text-xs">
              <input
                type="checkbox"
                checked={draft.roles.includes(role)}
                onChange={() => toggleRole(role)}
              />
              {role}
            </label>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <p className="w-full text-xs font-semibold text-blue-900">Permissions</p>
          {permissionOptions.map((permission) => (
            <label
              key={permission}
              className={`inline-flex items-center gap-2 rounded border px-3 py-1 text-xs ${draft.permissions.includes(permission) ? "bg-blue-900 text-blue-50" : "bg-white"}`}
            >
              <input type="checkbox" checked={draft.permissions.includes(permission)} onChange={() => togglePermission(permission)} />
              {permissionLabels[permission]}
            </label>
          ))}
        </div>
        <button type="button" onClick={saveProfile} className="mt-4 btn-accent rounded px-4 py-2">
          {editingProfile ? "Save Changes" : "Create Profile"}
        </button>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {profiles.map((profile) => (
          <article key={profile.id} className="panel noble-card p-4">
            <p className="text-xs uppercase tracking-wide text-blue-900">{profile.rank}</p>
            <h3 className="text-lg font-bold text-blue-950">{profile.displayName}</h3>
            <p className="text-sm">{profile.race} - {profile.career}</p>
            <p className="mt-1 text-xs opacity-80">Roles: {profile.roles.join(", ")} {profile.title ? `| ${profile.title}` : ""}</p>
            <p className="mt-1 text-xs">Faction: {profile.faction || "-"}</p>
            <p className="mt-1 text-xs">Tags: {profile.tags.join(", ") || "-"}</p>
            <div className="mt-3 flex gap-2 text-xs">
              <button type="button" onClick={() => startEdit(profile)} className="rounded border px-2 py-1">Edit</button>
              <button type="button" onClick={() => deleteProfile(profile.id)} className="rounded border border-red-700 px-2 py-1 text-red-700">Delete</button>
              <a href={profile.sheetUrl} target="_blank" rel="noopener noreferrer" className="rounded border px-2 py-1">Open Sheet</a>
            </div>
          </article>
        ))}
        {profiles.length === 0 && (
          <article className="panel p-4 text-sm">
            No profiles yet. Create your first profile and link a character sheet.
          </article>
        )}
      </section>
    </div>
  );
}
