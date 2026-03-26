"use client";

import { useEffect, useMemo, useState } from "react";
import type { AccountProfile, LocalUser, SessionUser } from "@/lib/auth";
import { ACCOUNT_PROFILES_KEY, SESSION_KEY, USERS_KEY } from "@/lib/auth";
import {
  aosCareers,
  aosRaces,
  defaultPermissionsForRoles,
  PROFILES_KEY,
} from "@/lib/campaign";
import type { Profile, Role } from "@/lib/campaign";

type Props = { children: React.ReactNode };

export function AuthGate({ children }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [users, setUsers] = useState<LocalUser[]>([]);
  const [session, setSession] = useState<SessionUser | null>(null);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [title, setTitle] = useState("");
  const [race, setRace] = useState("");
  const [career, setCareer] = useState("");
  const [roles, setRoles] = useState<Role[]>(["player"]);
  const [sheetUrl, setSheetUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const savedUsers = JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]") as LocalUser[];
      const savedSessionRaw = localStorage.getItem(SESSION_KEY);
      const savedSession = savedSessionRaw ? (JSON.parse(savedSessionRaw) as SessionUser) : null;
      setUsers(savedUsers);
      setSession(savedSession);
    } catch {
      setUsers([]);
      setSession(null);
    } finally {
      setHydrated(true);
    }
  }, []);

  const knownUser = useMemo(
    () => users.find((user) => user.username.toLowerCase() === username.trim().toLowerCase()),
    [users, username],
  );

  function persistUsers(next: LocalUser[]) {
    setUsers(next);
    localStorage.setItem(USERS_KEY, JSON.stringify(next));
  }

  function persistProfile(next: Profile) {
    const profiles = JSON.parse(localStorage.getItem(PROFILES_KEY) ?? "[]") as Profile[];
    localStorage.setItem(PROFILES_KEY, JSON.stringify([next, ...profiles.filter((p) => p.id !== next.id)]));
  }

  function persistAccountProfile(next: AccountProfile) {
    const profiles = JSON.parse(localStorage.getItem(ACCOUNT_PROFILES_KEY) ?? "[]") as AccountProfile[];
    localStorage.setItem(
      ACCOUNT_PROFILES_KEY,
      JSON.stringify([next, ...profiles.filter((p) => p.username !== next.username)]),
    );
  }

  function login(user: LocalUser) {
    const nextSession: SessionUser = { username: user.username, loggedInAt: Date.now() };
    setSession(nextSession);
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    setError("");
    setPassword("");
  }

  function onSubmit() {
    const cleanName = username.trim();
    if (!cleanName || !password) {
      setError("Please enter username and password.");
      return;
    }
    if (mode === "register") {
      if (!displayName.trim() || !title.trim() || !race || !career.trim() || !sheetUrl.trim()) {
        setError("Please fill all required profile fields.");
        return;
      }
      if (knownUser) {
        setError("Username already exists.");
        return;
      }
      const newUser: LocalUser = { username: cleanName, password, createdAt: Date.now() };
      persistUsers([newUser, ...users]);
      const profile: Profile = {
        id: `profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        displayName: displayName.trim(),
        race,
        career: career.trim(),
        title: title.trim(),
        rank: "Recruit",
        roles,
        permissions: defaultPermissionsForRoles(roles),
        sheetUrl: sheetUrl.trim(),
        faction: "",
        tags: [],
        username: cleanName,
        createdAt: Date.now(),
      };
      persistProfile(profile);
      persistAccountProfile({
        username: cleanName,
        displayName: displayName.trim(),
        avatarUrl: "",
        faction: "",
        subfaction: "",
        homeland: "",
        tags: [],
        bio: "",
        favoriteRealm: "",
      });
      login(newUser);
      return;
    }
    if (!knownUser || knownUser.password !== password) {
      setError("Invalid username or password.");
      return;
    }
    login(knownUser);
  }

  function toggleRole(role: Role) {
    const has = roles.includes(role);
    const nextRoles: Role[] = has ? roles.filter((entry) => entry !== role) : [...roles, role];
    const normalized: Role[] = nextRoles.length ? nextRoles : ["player"];
    setRoles(normalized);
  }

  if (!hydrated) {
    return <div className="min-h-screen" />;
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <section className="panel noble-hero w-full max-w-2xl p-6">
          <p className="rune-title text-xs text-blue-900">Campaign Access</p>
          <h1 className="mt-2 text-2xl font-bold text-blue-950">
            {mode === "login" ? "Sign In" : "Register"}
          </h1>
          <p className="mt-2 text-sm">
            Local account only (username + password). Required to access the site.
          </p>
          <div className="mt-4 space-y-3">
            <input
              className="w-full rounded border px-3 py-2 text-sm"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              className="w-full rounded border px-3 py-2 text-sm"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {mode === "register" && (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <input className="rounded border px-3 py-2 text-sm" placeholder="Name (required)" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                  <input className="rounded border px-3 py-2 text-sm" placeholder="Title (required)" value={title} onChange={(e) => setTitle(e.target.value)} />
                  <select className="rounded border px-3 py-2 text-sm" value={race} onChange={(e) => setRace(e.target.value)}>
                    <option value="">Select Race</option>
                    {aosRaces.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
                  </select>
                  <div>
                    <input
                      className="w-full rounded border px-3 py-2 text-sm"
                      list="reg-careers"
                      placeholder="Career (required, searchable)"
                      value={career}
                      onChange={(e) => setCareer(e.target.value)}
                    />
                    <datalist id="reg-careers">
                      {aosCareers.map((entry) => <option key={entry} value={entry} />)}
                    </datalist>
                  </div>
                </div>
                <div className="rounded border bg-white/70 p-3">
                  <p className="text-xs font-semibold text-blue-900">Roles</p>
                  <div className="mt-2 flex gap-3 text-xs">
                    {(["player", "gamemaster"] as Role[]).map((role) => (
                      <label key={role} className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={roles.includes(role)} onChange={() => toggleRole(role)} />
                        {role}
                      </label>
                    ))}
                  </div>
                </div>
                <input
                  className="w-full rounded border px-3 py-2 text-sm"
                  placeholder="Character Sheet URL (required)"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                />
              </>
            )}
          </div>
          {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
          <button type="button" onClick={onSubmit} className="mt-4 btn-accent rounded px-4 py-2">
            {mode === "login" ? "Login" : "Create Account"}
          </button>
          <button
            type="button"
            onClick={() => setMode((prev) => (prev === "login" ? "register" : "login"))}
            className="mt-3 block text-xs text-link hover:underline"
          >
            {mode === "login" ? "Need an account? Register" : "Already have an account? Login"}
          </button>
        </section>
      </div>
    );
  }

  return <>{children}</>;
}
