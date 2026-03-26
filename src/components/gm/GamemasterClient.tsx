"use client";

import { useMemo, useState } from "react";
import type { Adventure, Profile, Session } from "@/lib/campaign";
import {
  ADVENTURES_KEY,
  normalizeProfile,
  PROFILES_KEY,
  SESSIONS_KEY,
  seedAdventures,
  seedSessions,
} from "@/lib/campaign";

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function GamemasterClient() {
  const [adventures, setAdventures] = useState<Adventure[]>(() => {
    if (typeof window === "undefined") return seedAdventures;
    try {
      const raw = localStorage.getItem(ADVENTURES_KEY);
      if (!raw) return seedAdventures;
      return JSON.parse(raw) as Adventure[];
    } catch {
      return seedAdventures;
    }
  });
  const [sessions, setSessions] = useState<Session[]>(() => {
    if (typeof window === "undefined") return seedSessions;
    try {
      const raw = localStorage.getItem(SESSIONS_KEY);
      if (!raw) return seedSessions;
      return JSON.parse(raw) as Session[];
    } catch {
      return seedSessions;
    }
  });
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
  const gmProfiles = useMemo(
    () =>
      profiles.filter(
        (profile) =>
          profile.roles.includes("gamemaster") || profile.permissions.includes("manage_adventures"),
      ),
    [profiles],
  );

  const [adventureDraft, setAdventureDraft] = useState({ title: "", summary: "", status: "planned" as Adventure["status"] });
  const [sessionDraft, setSessionDraft] = useState({
    title: "",
    location: "",
    agenda: "",
    startsAt: "",
    notes: "",
    adventureId: "",
    gmProfileId: "",
  });

  function persistAdventures(next: Adventure[]) {
    setAdventures(next);
    localStorage.setItem(ADVENTURES_KEY, JSON.stringify(next));
  }
  function persistSessions(next: Session[]) {
    setSessions(next);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(next));
  }

  function addAdventure() {
    if (!adventureDraft.title.trim()) return;
    const next: Adventure[] = [
      { id: createId("adv"), title: adventureDraft.title.trim(), summary: adventureDraft.summary.trim(), status: adventureDraft.status },
      ...adventures,
    ];
    persistAdventures(next);
    setAdventureDraft({ title: "", summary: "", status: "planned" });
  }

  function addSession() {
    if (!sessionDraft.title.trim() || !sessionDraft.startsAt || !sessionDraft.adventureId) return;
    const next: Session[] = [
      {
        id: createId("ses"),
        title: sessionDraft.title.trim(),
        location: sessionDraft.location.trim(),
        agenda: sessionDraft.agenda.trim(),
        startsAt: new Date(sessionDraft.startsAt).toISOString(),
        notes: sessionDraft.notes.trim(),
        adventureId: sessionDraft.adventureId,
        gmProfileId: sessionDraft.gmProfileId,
      },
      ...sessions,
    ];
    persistSessions(next);
    setSessionDraft({ title: "", location: "", agenda: "", startsAt: "", notes: "", adventureId: "", gmProfileId: "" });
  }

  function deleteAdventure(id: string) {
    persistAdventures(adventures.filter((a) => a.id !== id));
  }
  function deleteSession(id: string) {
    persistSessions(sessions.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-6">
      <section className="panel p-5">
        <h2 className="rune-title text-sm text-blue-900">Create Adventure</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input className="rounded border px-3 py-2 text-sm" placeholder="Adventure title" value={adventureDraft.title} onChange={(e) => setAdventureDraft((prev) => ({ ...prev, title: e.target.value }))} />
          <select className="rounded border px-3 py-2 text-sm" value={adventureDraft.status} onChange={(e) => setAdventureDraft((prev) => ({ ...prev, status: e.target.value as Adventure["status"] }))}>
            <option value="planned">planned</option>
            <option value="active">active</option>
            <option value="done">done</option>
          </select>
          <textarea className="md:col-span-2 rounded border px-3 py-2 text-sm" placeholder="Summary" value={adventureDraft.summary} onChange={(e) => setAdventureDraft((prev) => ({ ...prev, summary: e.target.value }))} />
        </div>
        <button type="button" onClick={addAdventure} className="mt-3 btn-accent rounded px-4 py-2">Save Adventure</button>
      </section>

      <section className="panel p-5">
        <h2 className="rune-title text-sm text-blue-900">Schedule Session</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input className="rounded border px-3 py-2 text-sm" placeholder="Session title" value={sessionDraft.title} onChange={(e) => setSessionDraft((prev) => ({ ...prev, title: e.target.value }))} />
          <input className="rounded border px-3 py-2 text-sm" type="datetime-local" value={sessionDraft.startsAt} onChange={(e) => setSessionDraft((prev) => ({ ...prev, startsAt: e.target.value }))} />
          <select className="rounded border px-3 py-2 text-sm" value={sessionDraft.adventureId} onChange={(e) => setSessionDraft((prev) => ({ ...prev, adventureId: e.target.value }))}>
            <option value="">Select adventure</option>
            {adventures.map((adventure) => <option key={adventure.id} value={adventure.id}>{adventure.title}</option>)}
          </select>
          <select className="rounded border px-3 py-2 text-sm" value={sessionDraft.gmProfileId} onChange={(e) => setSessionDraft((prev) => ({ ...prev, gmProfileId: e.target.value }))}>
            <option value="">Select GM profile</option>
            {gmProfiles.map((gm) => <option key={gm.id} value={gm.id}>{gm.displayName}</option>)}
          </select>
          <input className="rounded border px-3 py-2 text-sm" placeholder="Location" value={sessionDraft.location} onChange={(e) => setSessionDraft((prev) => ({ ...prev, location: e.target.value }))} />
          <input className="rounded border px-3 py-2 text-sm" placeholder="Agenda" value={sessionDraft.agenda} onChange={(e) => setSessionDraft((prev) => ({ ...prev, agenda: e.target.value }))} />
          <textarea className="md:col-span-2 rounded border px-3 py-2 text-sm" placeholder="Notes / prep checklist" value={sessionDraft.notes} onChange={(e) => setSessionDraft((prev) => ({ ...prev, notes: e.target.value }))} />
        </div>
        <button type="button" onClick={addSession} className="mt-3 btn-secondary rounded px-4 py-2">Save Session</button>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="panel p-4">
          <h3 className="rune-title text-xs text-blue-900">Adventures</h3>
          <div className="mt-2 space-y-2 text-sm">
            {adventures.map((adventure) => (
              <div key={adventure.id} className="rounded border border-blue-900/20 bg-white/80 p-3">
                <p className="font-semibold">{adventure.title}</p>
                <p className="text-xs opacity-80">{adventure.status}</p>
                <p className="text-xs">{adventure.summary}</p>
                <button type="button" onClick={() => deleteAdventure(adventure.id)} className="mt-2 rounded border border-red-700 px-2 py-1 text-xs text-red-700">Delete</button>
              </div>
            ))}
          </div>
        </article>
        <article className="panel p-4">
          <h3 className="rune-title text-xs text-blue-900">Sessions</h3>
          <div className="mt-2 space-y-2 text-sm">
            {sessions.map((session) => (
              <div key={session.id} className="rounded border border-blue-900/20 bg-white/80 p-3">
                <p className="font-semibold">{session.title}</p>
                <p className="text-xs opacity-80">{new Date(session.startsAt).toLocaleString()}</p>
                <p className="text-xs">Location: {session.location || "-"}</p>
                <p className="text-xs">Agenda: {session.agenda || "-"}</p>
                <button type="button" onClick={() => deleteSession(session.id)} className="mt-2 rounded border border-red-700 px-2 py-1 text-xs text-red-700">Delete</button>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
