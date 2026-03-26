"use client";

import { useEffect, useMemo, useState } from "react";
import type { Adventure, Session } from "@/lib/campaign";
import { ADVENTURES_KEY, SESSIONS_KEY, seedAdventures, seedSessions } from "@/lib/campaign";

function fmt(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return { h, m, s };
}

export function SessionOverviewClient() {
  const [adventures] = useState<Adventure[]>(() => {
    if (typeof window === "undefined") return seedAdventures;
    try {
      const raw = localStorage.getItem(ADVENTURES_KEY);
      if (!raw) return seedAdventures;
      return JSON.parse(raw) as Adventure[];
    } catch {
      return seedAdventures;
    }
  });
  const [sessions] = useState<Session[]>(() => {
    if (typeof window === "undefined") return seedSessions;
    try {
      const raw = localStorage.getItem(SESSIONS_KEY);
      if (!raw) return seedSessions;
      return JSON.parse(raw) as Session[];
    } catch {
      return seedSessions;
    }
  });
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const sorted = useMemo(
    () => [...sessions].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
    [sessions],
  );
  const nextSession = sorted.find((session) => new Date(session.startsAt).getTime() >= now) ?? null;
  const latestSession = [...sorted].reverse()[0] ?? null;
  const countdown = nextSession ? fmt(new Date(nextSession.startsAt).getTime() - now) : null;
  const nextAdventure = nextSession ? adventures.find((adventure) => adventure.id === nextSession.adventureId) : null;

  return (
    <section className="grid gap-5 lg:grid-cols-3">
      <article className="panel noble-card p-5">
        <h2 className="rune-title text-sm text-blue-900">Campaign Pulse</h2>
        <p className="mt-2 text-sm">Track adventures, sessions, and prep cadence.</p>
        <p className="mt-3 text-xs font-semibold text-blue-900">Adventures: {adventures.length} | Sessions: {sessions.length}</p>
      </article>
      <article className="panel noble-card p-5">
        <h2 className="rune-title text-sm text-blue-900">Latest Session</h2>
        <ul className="mt-2 space-y-1 text-sm">
          <li>Title: {latestSession?.title ?? "--"}</li>
          <li>Date: {latestSession ? new Date(latestSession.startsAt).toLocaleString() : "--"}</li>
          <li>Location: {latestSession?.location || "--"}</li>
          <li>Notes: {latestSession?.notes || "--"}</li>
        </ul>
      </article>
      <article className="panel noble-card relative overflow-hidden p-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(30,70,140,0.2),transparent_35%)]" />
        <div className="relative">
          <h2 className="rune-title text-sm text-blue-900">Next Session Countdown</h2>
          <ul className="mt-2 space-y-1 text-sm">
            <li>Title: {nextSession?.title ?? "--"}</li>
            <li>Adventure: {nextAdventure?.title ?? "--"}</li>
            <li>Date & Time: {nextSession ? new Date(nextSession.startsAt).toLocaleString() : "--"}</li>
            <li>Agenda: {nextSession?.agenda || "--"}</li>
          </ul>
          {countdown ? (
            <div className="mt-4 flex gap-2 text-center text-blue-950">
              <div className="rounded border bg-white/80 px-3 py-2"><p className="text-xl font-bold">{countdown.h}</p><p className="text-xs">hours</p></div>
              <div className="rounded border bg-white/80 px-3 py-2"><p className="text-xl font-bold">{countdown.m}</p><p className="text-xs">minutes</p></div>
              <div className="rounded border bg-white/80 px-3 py-2"><p className="text-xl font-bold">{countdown.s}</p><p className="text-xs">seconds</p></div>
            </div>
          ) : (
            <p className="mt-4 text-xs">No upcoming session scheduled.</p>
          )}
        </div>
      </article>
    </section>
  );
}
