"use client";

import { useEffect, useState } from "react";
import type { Role } from "@/lib/campaign";
import { aosCareers, aosRaces, defaultPermissionsForRoles } from "@/lib/campaign";
import { getSupabaseClient } from "@/lib/supabaseClient";

type Props = { children: React.ReactNode };

export function AuthGate({ children }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [authUser, setAuthUser] = useState<{ id: string; email?: string | null } | null>(null);
  const [accountApproval, setAccountApproval] = useState<{ isApproved: boolean; isAdmin: boolean } | null>(null);
  const [approvalBusy, setApprovalBusy] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Registration-only fields
  const [displayName, setDisplayName] = useState("");
  const [title, setTitle] = useState("");
  const [race, setRace] = useState("");
  const [career, setCareer] = useState("");
  const [roles, setRoles] = useState<Role[]>(["player"]);
  const [sheetUrl, setSheetUrl] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setHydrated(true);
      setError(
        "Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
      );
      return;
    }

    let cancelled = false;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        setAuthUser(data.session?.user ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setAuthUser(null);
      })
      .finally(() => {
        if (cancelled) return;
        setHydrated(true);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authUser) {
      setAccountApproval(null);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return;
    const supa = supabase;
    const uid = authUser.id;

    let cancelled = false;
    setApprovalBusy(true);

    async function loadApproval() {
      try {
        const { data, error } = await supa
          .from("account_profiles")
          .select("is_approved,is_admin")
          .eq("user_id", uid)
          .maybeSingle<{ is_approved: boolean; is_admin: boolean }>();

        if (cancelled) return;
        if (error) {
          setAccountApproval({ isApproved: false, isAdmin: false });
          return;
        }

        setAccountApproval({
          isApproved: Boolean(data?.is_approved),
          isAdmin: Boolean(data?.is_admin),
        });
      } catch {
        if (cancelled) return;
        setAccountApproval({ isApproved: false, isAdmin: false });
      } finally {
        if (cancelled) return;
        setApprovalBusy(false);
      }
    }

    loadApproval();

    return () => {
      cancelled = true;
    };
  }, [authUser]);

  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminCommand, setAdminCommand] = useState("");
  const [adminCommandError, setAdminCommandError] = useState<string | null>(null);

  async function grantAdminByCommand() {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    if (!adminCommand.trim()) return;

    setAdminCommandError(null);
    setBusy(true);
    try {
      const { error: rpcError } = await supabase.rpc("grant_admin_if_code", { p_code: adminCommand.trim() });
      if (rpcError) throw rpcError;
      setAdminModalOpen(false);
      setAdminCommand("");
      setAccountApproval({ isApproved: true, isAdmin: true });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Admin command failed.";
      setAdminCommandError(message);
    } finally {
      setBusy(false);
    }
  }

  function toggleRole(role: Role) {
    const has = roles.includes(role);
    const nextRoles: Role[] = has ? roles.filter((entry) => entry !== role) : [...roles, role];
    const normalized: Role[] = nextRoles.length ? nextRoles : ["player"];
    setRoles(normalized);
  }

  async function onSubmit() {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const cleanName = username.trim();
    if (!email.trim() || !password) {
      setError("Please enter email and password.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      if (mode === "register") {
        if (!displayName.trim() || !title.trim() || !race || !career.trim() || !sheetUrl.trim()) {
          setError("Please fill all required profile fields.");
          return;
        }

        if (!cleanName) {
          setError("Please enter username.");
          return;
        }

        const { error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password });
        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          setError("Account created but session not available. Check email confirmation settings.");
          return;
        }

        const user = userData.user;
        const permissions = defaultPermissionsForRoles(roles);

        const { error: accError } = await supabase.from("account_profiles").insert({
          user_id: user.id,
          email: email.trim(),
          display_name: displayName.trim(),
          avatar_url: "",
          faction: "",
          subfaction: "",
          homeland: "",
          tags: [],
          bio: "",
          favorite_realm: "",
          is_admin: false,
          is_approved: false,
        });
        if (accError) {
          setError(accError.message);
          return;
        }

        const { error: campError } = await supabase.from("campaign_profiles").insert({
          owner_user_id: user.id,
          username: cleanName,
          display_name: displayName.trim(),
          rank: "Recruit",
          roles,
          permissions,
          race,
          career: career.trim(),
          title: title.trim(),
          sheet_url: sheetUrl.trim(),
          faction: "",
          tags: [],
        });
        if (campError) {
          setError(campError.message);
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          setError(signInError.message);
          return;
        }
      }
    } finally {
      setBusy(false);
    }
  }

  if (!hydrated) {
    return <div className="min-h-screen" />;
  }

  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <section className="panel noble-hero w-full max-w-2xl p-6">
          <p className="rune-title text-xs text-blue-900">Campaign Access</p>
          <h1 className="mt-2 text-2xl font-bold text-blue-950">{mode === "login" ? "Sign In" : "Register"}</h1>
          <p className="mt-2 text-sm">
            Use email + password. New accounts need admin confirmation before accessing the site.
          </p>

          <div className="mt-4 space-y-3">
            {mode === "register" && (
              <input
                className="w-full rounded border px-3 py-2 text-sm"
                placeholder="Username (required)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            )}
            <input
              className="w-full rounded border px-3 py-2 text-sm"
              placeholder="Email (required)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                  <input
                    className="rounded border px-3 py-2 text-sm"
                    placeholder="Name (required)"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                  <input
                    className="rounded border px-3 py-2 text-sm"
                    placeholder="Title (required)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <select
                    className="rounded border px-3 py-2 text-sm"
                    value={race}
                    onChange={(e) => setRace(e.target.value)}
                  >
                    <option value="">Select Race</option>
                    {aosRaces.map((entry) => (
                      <option key={entry} value={entry}>
                        {entry}
                      </option>
                    ))}
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
                      {aosCareers.map((entry) => (
                        <option key={entry} value={entry} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="rounded border bg-white/70 p-3">
                  <p className="text-xs font-semibold text-blue-900">Roles</p>
                  <div className="mt-2 flex gap-3 text-xs">
                    {(["player", "gamemaster"] as Role[]).map((role) => (
                      <label key={role} className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={roles.includes(role)}
                          onChange={() => toggleRole(role)}
                        />
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

          <button
            type="button"
            onClick={onSubmit}
            className="mt-4 btn-accent rounded px-4 py-2 disabled:opacity-60"
            disabled={busy}
          >
            {busy ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
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

  if (approvalBusy || !accountApproval) {
    return <div className="min-h-screen flex items-center justify-center p-4">Checking your access…</div>;
  }

  if (!accountApproval.isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <section className="panel noble-hero w-full max-w-md p-6">
          <p className="rune-title text-xs text-blue-900">Access Pending</p>
          <h1 className="mt-2 text-2xl font-bold text-blue-950">Waiting for admin confirmation</h1>
          <p className="mt-2 text-sm">
            Your account is registered, but an admin must approve it before you can use the site.
          </p>

          <button
            type="button"
            className="mt-4 btn-secondary rounded px-4 py-2 w-full"
            onClick={() => {
              setAdminModalOpen(true);
              setAdminCommand("");
              setAdminCommandError(null);
            }}
          >
            Admin Command
          </button>

          {adminModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded border border-blue-900/25 bg-white p-4 shadow-lg">
                <div className="flex items-center justify-between gap-3">
                  <p className="rune-title text-sm text-blue-900">Administrator Console</p>
                  <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => setAdminModalOpen(false)}>
                    Close
                  </button>
                </div>
                <p className="mt-2 text-xs opacity-80">
                  Type <span className="font-semibold">Over9000</span> to grant admin + approval for this account.
                </p>
                <div className="mt-3 rounded border bg-neutral-950 p-3">
                  <label className="block text-xs opacity-80 text-neutral-200">Command</label>
                  <input
                    className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-2 text-sm text-neutral-100"
                    value={adminCommand}
                    onChange={(e) => setAdminCommand(e.target.value)}
                    placeholder="Over9000"
                  />
                </div>
                {adminCommandError && <p className="mt-2 text-xs text-red-700">{adminCommandError}</p>}
                <div className="mt-3 flex gap-2">
                  <button type="button" className="btn-accent rounded px-4 py-2 flex-1" onClick={grantAdminByCommand} disabled={busy}>
                    {busy ? "Working…" : "Run"}
                  </button>
                  <button type="button" className="rounded border px-4 py-2 flex-1" onClick={() => setAdminModalOpen(false)} disabled={busy}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    );
  }

  return <>{children}</>;
}

