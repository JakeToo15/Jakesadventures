"use client";

import { useEffect, useMemo, useState } from "react";
import type { Profile, Role } from "@/lib/campaign";
import { normalizeProfile } from "@/lib/campaign";
import { getSupabaseClient } from "@/lib/supabaseClient";

type AdventureRow = {
  id: string;
  title: string;
  summary: string | null;
  status: "planned" | "active" | "done";
};

type SessionVM = {
  id: string;
  title: string;
  adventureId: string;
  location: string;
  agenda: string;
  startsAt: string;
  notes: string;
};

export function GamemasterClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);

  const [adventures, setAdventures] = useState<AdventureRow[]>([]);
  const [sessions, setSessions] = useState<SessionVM[]>([]);
  const [gmProfiles, setGmProfiles] = useState<Profile[]>([]);
  const [activeGmProfileId, setActiveGmProfileId] = useState<string>("");

  const [adventureDraft, setAdventureDraft] = useState({ title: "", summary: "", status: "planned" as AdventureRow["status"] });
  const [sessionDraft, setSessionDraft] = useState({
    title: "",
    location: "",
    agenda: "",
    startsAt: "",
    notes: "",
    adventureId: "",
    gmProfileId: "",
  });

  async function refresh() {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Supabase not configured.");
      setLoading(false);
      return;
    }

    setError(null);
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      setError("Not signed in.");
      setLoading(false);
      return;
    }
    setUid(user.id);

    const [{ data: campData, error: campError }, { data: advData, error: advError }, { data: sesData, error: sesError }] =
      await Promise.all([
        supabase.from("campaign_profiles").select("*").eq("owner_user_id", user.id),
        supabase.from("adventures").select("*").eq("created_by", user.id).order("created_at", { ascending: false }),
        supabase.from("sessions").select("*").eq("created_by", user.id).order("starts_at", { ascending: false }),
      ]);

    if (campError) {
      setError(campError.message);
      setLoading(false);
      return;
    }
    if (advError) {
      setError(advError.message);
      setLoading(false);
      return;
    }
    if (sesError) {
      setError(sesError.message);
      setLoading(false);
      return;
    }

    const normalizedProfiles: Profile[] = (campData ?? []).map((row) =>
      normalizeProfile(row as unknown as Parameters<typeof normalizeProfile>[0]),
    );

    const normalizedGm = normalizedProfiles.filter((p) => p.roles.includes("gamemaster") || p.permissions.includes("manage_adventures"));
    setGmProfiles(normalizedGm);

    setAdventures(
      (advData ?? []).map((row) => ({
        id: row.id as string,
        title: row.title as string,
        summary: row.summary as string | null,
        status: row.status as AdventureRow["status"],
      })),
    );

    setSessions(
      (sesData ?? []).map((row) => ({
        id: row.id as string,
        title: row.title as string,
        adventureId: row.adventure_id as string,
        location: row.location ?? "",
        agenda: row.agenda ?? "",
        startsAt: row.starts_at as string,
        notes: row.notes ?? "",
      })),
    );

    const gmDefault = normalizedGm[0]?.id ?? "";
    setActiveGmProfileId(gmDefault);
    setSessionDraft((prev) => ({
      ...prev,
      adventureId: prev.adventureId || (advData?.[0]?.id ?? ""),
      gmProfileId: prev.gmProfileId || gmDefault,
    }));

    setLoading(false);
  }

  useEffect(() => {
    refresh().catch((e: unknown) => {
      const msg = e instanceof Error ? e.message : "Failed to load GM data.";
      setError(msg);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addAdventure() {
    const supabase = getSupabaseClient();
    if (!supabase || !uid) return;
    if (!adventureDraft.title.trim()) return;
    if (!activeGmProfileId) {
      setError("Select an active GM profile first.");
      return;
    }

    setBusyState(true);
    setError(null);
    const { error: insError } = await supabase.from("adventures").insert({
      created_by: uid,
      gm_profile_id: activeGmProfileId,
      title: adventureDraft.title.trim(),
      summary: adventureDraft.summary.trim(),
      status: adventureDraft.status,
    });
    if (insError) {
      setError(insError.message);
    }
    setBusyState(false);
    await refresh();
    setAdventureDraft({ title: "", summary: "", status: "planned" });
  }

  const [busy, setBusyState] = useState(false);

  async function addSession() {
    const supabase = getSupabaseClient();
    if (!supabase || !uid) return;
    if (!sessionDraft.title.trim()) return;
    if (!sessionDraft.adventureId || !sessionDraft.startsAt) return;
    if (!sessionDraft.gmProfileId) return;

    setBusyState(true);
    setError(null);
    const { error: insError } = await supabase.from("sessions").insert({
      created_by: uid,
      gm_profile_id: sessionDraft.gmProfileId,
      adventure_id: sessionDraft.adventureId,
      title: sessionDraft.title.trim(),
      location: sessionDraft.location.trim(),
      agenda: sessionDraft.agenda.trim(),
      starts_at: new Date(sessionDraft.startsAt).toISOString(),
      notes: sessionDraft.notes.trim(),
    });
    if (insError) setError(insError.message);
    setBusyState(false);
    await refresh();
    setSessionDraft({
      title: "",
      location: "",
      agenda: "",
      startsAt: "",
      notes: "",
      adventureId: sessionDraft.adventureId,
      gmProfileId: sessionDraft.gmProfileId,
    });
  }

  async function deleteAdventure(id: string) {
    const supabase = getSupabaseClient();
    if (!supabase || !uid) return;
    setBusyState(true);
    const { error: delError } = await supabase.from("adventures").delete().eq("id", id);
    setBusyState(false);
    if (delError) setError(delError.message);
    await refresh();
  }

  async function deleteSession(id: string) {
    const supabase = getSupabaseClient();
    if (!supabase || !uid) return;
    setBusyState(true);
    const { error: delError } = await supabase.from("sessions").delete().eq("id", id);
    setBusyState(false);
    if (delError) setError(delError.message);
    await refresh();
  }

  if (loading) return <div className="min-h-[120px] text-sm opacity-80">Loading GM tools...</div>;
  if (error) return <div className="panel p-5 text-sm text-red-700">{error}</div>;

  return (
    <div className="space-y-6">
      <section className="panel p-5">
        <h2 className="rune-title text-sm text-blue-900">Create Adventure</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input
            className="rounded border px-3 py-2 text-sm"
            placeholder="Adventure title"
            value={adventureDraft.title}
            onChange={(e) => setAdventureDraft((prev) => ({ ...prev, title: e.target.value }))}
          />
          <select
            className="rounded border px-3 py-2 text-sm"
            value={adventureDraft.status}
            onChange={(e) => setAdventureDraft((prev) => ({ ...prev, status: e.target.value as AdventureRow["status"] }))}
          >
            <option value="planned">planned</option>
            <option value="active">active</option>
            <option value="done">done</option>
          </select>
          <textarea
            className="md:col-span-2 rounded border px-3 py-2 text-sm"
            placeholder="Summary"
            value={adventureDraft.summary}
            onChange={(e) => setAdventureDraft((prev) => ({ ...prev, summary: e.target.value }))}
          />
        </div>
        {gmProfiles.length > 0 && (
          <div className="mt-3">
            <label className="text-xs font-semibold text-blue-900">Active GM Profile</label>
            <select
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={activeGmProfileId}
              onChange={(e) => setActiveGmProfileId(e.target.value)}
            >
              {gmProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.displayName} ({p.roles.join(", ")})
                </option>
              ))}
            </select>
          </div>
        )}
        <button type="button" onClick={addAdventure} className="mt-3 btn-accent rounded px-4 py-2 disabled:opacity-60" disabled={busy}>
          {busy ? "Saving..." : "Save Adventure"}
        </button>
      </section>

      <section className="panel p-5">
        <h2 className="rune-title text-sm text-blue-900">Schedule Session</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input className="rounded border px-3 py-2 text-sm" placeholder="Session title" value={sessionDraft.title} onChange={(e) => setSessionDraft((prev) => ({ ...prev, title: e.target.value }))} />
          <input className="rounded border px-3 py-2 text-sm" type="datetime-local" value={sessionDraft.startsAt} onChange={(e) => setSessionDraft((prev) => ({ ...prev, startsAt: e.target.value }))} />
          <select className="rounded border px-3 py-2 text-sm" value={sessionDraft.adventureId} onChange={(e) => setSessionDraft((prev) => ({ ...prev, adventureId: e.target.value }))}>
            <option value="">Select adventure</option>
            {adventures.map((adventure) => (
              <option key={adventure.id} value={adventure.id}>
                {adventure.title}
              </option>
            ))}
          </select>
          <select className="rounded border px-3 py-2 text-sm" value={sessionDraft.gmProfileId} onChange={(e) => setSessionDraft((prev) => ({ ...prev, gmProfileId: e.target.value }))}>
            <option value="">Select GM profile</option>
            {gmProfiles.map((gm) => (
              <option key={gm.id} value={gm.id}>
                {gm.displayName}
              </option>
            ))}
          </select>
          <input className="rounded border px-3 py-2 text-sm" placeholder="Location" value={sessionDraft.location} onChange={(e) => setSessionDraft((prev) => ({ ...prev, location: e.target.value }))} />
          <input className="rounded border px-3 py-2 text-sm" placeholder="Agenda" value={sessionDraft.agenda} onChange={(e) => setSessionDraft((prev) => ({ ...prev, agenda: e.target.value }))} />
          <textarea className="md:col-span-2 rounded border px-3 py-2 text-sm" placeholder="Notes / prep checklist" value={sessionDraft.notes} onChange={(e) => setSessionDraft((prev) => ({ ...prev, notes: e.target.value }))} />
        </div>
        <button type="button" onClick={addSession} className="mt-3 btn-secondary rounded px-4 py-2 disabled:opacity-60" disabled={busy}>
          {busy ? "Saving..." : "Save Session"}
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="panel p-4">
          <h3 className="rune-title text-xs text-blue-900">Adventures</h3>
          <div className="mt-2 space-y-2 text-sm">
            {adventures.map((adventure) => (
              <div key={adventure.id} className="rounded border border-blue-900/20 bg-white/80 p-3">
                <p className="font-semibold">{adventure.title}</p>
                <p className="text-xs opacity-80">{adventure.status}</p>
                <p className="text-xs">{adventure.summary ?? ""}</p>
                <button type="button" onClick={() => deleteAdventure(adventure.id)} className="mt-2 rounded border border-red-700 px-2 py-1 text-xs text-red-700 disabled:opacity-60" disabled={busy}>
                  Delete
                </button>
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
                <button type="button" onClick={() => deleteSession(session.id)} className="mt-2 rounded border border-red-700 px-2 py-1 text-xs text-red-700 disabled:opacity-60" disabled={busy}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

