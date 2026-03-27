"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

type AdventureRow = {
  id: string;
  title: string;
};

type SessionRow = {
  id: string;
  title: string;
  adventure_id: string;
  starts_at: string;
  location: string | null;
  agenda: string | null;
  notes: string | null;
};

function fmt(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return { h, m, s };
}

export function SessionOverviewClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adventures, setAdventures] = useState<AdventureRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setError("Supabase not configured.");
        setLoading(false);
        return;
      }

      setError(null);
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setError("Not signed in.");
        setLoading(false);
        return;
      }

      const { data: advData, error: advError } = await supabase
        .from("adventures")
        .select("id,title")
        .order("created_at", { ascending: false })
        .limit(50);
      if (advError) {
        if (!cancelled) setError(advError.message);
        setLoading(false);
        return;
      }

      const { data: sesData, error: sesError } = await supabase
        .from("sessions")
        .select("id,title,adventure_id,starts_at,location,agenda,notes")
        .order("starts_at", { ascending: true })
        .limit(200);
      if (sesError) {
        if (!cancelled) setError(sesError.message);
        setLoading(false);
        return;
      }

      if (cancelled) return;
      setAdventures((advData ?? []) as AdventureRow[]);
      setSessions((sesData ?? []) as SessionRow[]);
      setLoading(false);
    }

    load().catch((e) => {
      setError(e instanceof Error ? e.message : "Failed to load session data.");
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = useMemo(() => {
    return [...sessions].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [sessions]);

  const nextSession = useMemo(() => {
    const t = now;
    return sorted.find((s) => new Date(s.starts_at).getTime() >= t) ?? null;
  }, [now, sorted]);

  const latestSession = useMemo(() => {
    const rev = [...sorted].reverse();
    return rev[0] ?? null;
  }, [sorted]);

  const nextAdventure = useMemo(() => {
    if (!nextSession) return null;
    return adventures.find((a) => a.id === nextSession.adventure_id) ?? null;
  }, [adventures, nextSession]);

  const countdown = nextSession ? fmt(new Date(nextSession.starts_at).getTime() - now) : null;

  if (loading) return <section className="grid gap-5 lg:grid-cols-3"><article className="panel p-5" /></section>;
  if (error) return <section className="panel p-5 text-sm text-red-700">{error}</section>;

  return (
    <section className="grid gap-5 lg:grid-cols-3">
      <article className="panel noble-card p-5">
        <h2 className="rune-title text-sm text-blue-900">Campaign Pulse</h2>
        <p className="mt-2 text-sm">Track adventures, sessions, and prep cadence.</p>
        <p className="mt-3 text-xs font-semibold text-blue-900">
          Adventures: {adventures.length} | Sessions: {sessions.length}
        </p>
      </article>

      <article className="panel noble-card p-5">
        <h2 className="rune-title text-sm text-blue-900">Latest Session</h2>
        <ul className="mt-2 space-y-1 text-sm">
          <li>Title: {latestSession?.title ?? "--"}</li>
          <li>Date: {latestSession ? new Date(latestSession.starts_at).toLocaleString() : "--"}</li>
          <li>Location: {latestSession?.location ?? "--"}</li>
          <li>Notes: {latestSession?.notes ?? "--"}</li>
        </ul>
      </article>

      <article className="panel noble-card relative overflow-hidden p-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(30,70,140,0.2),transparent_35%)]" />
        <div className="relative">
          <h2 className="rune-title text-sm text-blue-900">Next Session Countdown</h2>
          <ul className="mt-2 space-y-1 text-sm">
            <li>Title: {nextSession?.title ?? "--"}</li>
            <li>Adventure: {nextAdventure?.title ?? "--"}</li>
            <li>Date & Time: {nextSession ? new Date(nextSession.starts_at).toLocaleString() : "--"}</li>
            <li>Agenda: {nextSession?.agenda ?? "--"}</li>
          </ul>
          {countdown ? (
            <div className="mt-4 flex gap-2 text-center text-blue-950">
              <div className="rounded border bg-white/80 px-3 py-2">
                <p className="text-xl font-bold">{countdown.h}</p>
                <p className="text-xs">hours</p>
              </div>
              <div className="rounded border bg-white/80 px-3 py-2">
                <p className="text-xl font-bold">{countdown.m}</p>
                <p className="text-xs">minutes</p>
              </div>
              <div className="rounded border bg-white/80 px-3 py-2">
                <p className="text-xl font-bold">{countdown.s}</p>
                <p className="text-xs">seconds</p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-xs">No upcoming session scheduled.</p>
          )}
        </div>
      </article>
    </section>
  );
}

