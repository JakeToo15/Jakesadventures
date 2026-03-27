/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import type { AccountProfile } from "@/lib/auth";
import type { Profile, Role } from "@/lib/campaign";
import { aosCareers, aosRaces, defaultPermissionsForRoles, normalizeProfile } from "@/lib/campaign";
import { getSupabaseClient as getSupa } from "@/lib/supabaseClient";

type AccountRow = {
  user_id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  faction: string | null;
  subfaction: string | null;
  homeland: string | null;
  tags: string[] | null;
  bio: string | null;
  favorite_realm: string | null;
  is_admin: boolean | null;
  is_approved: boolean | null;
};

type CampaignRow = Partial<Profile> & {
  id?: string;
  display_name?: string | null;
  sheet_url?: string | null;
  created_at?: string | null;
  owner_user_id?: string;
};

function toAccountRow(profile: AccountRow): AccountProfile {
  return {
    username: profile.user_id,
    email: profile.email ?? "",
    displayName: profile.display_name ?? "",
    avatarUrl: profile.avatar_url ?? "",
    faction: profile.faction ?? "",
    subfaction: profile.subfaction ?? "",
    homeland: profile.homeland ?? "",
    tags: profile.tags ?? [],
    bio: profile.bio ?? "",
    favoriteRealm: profile.favorite_realm ?? "",
    isAdmin: profile.is_admin ?? false,
    isApproved: profile.is_approved ?? false,
  };
}

export function MyProfileClient() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [account, setAccount] = useState<AccountProfile | null>(null);
  const [campaign, setCampaign] = useState<Profile | null>(null);

  const [tagsInput, setTagsInput] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = getSupa();
      if (!supabase) {
        setError("Supabase not configured (set NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        if (!cancelled) setError("Not signed in.");
        setLoading(false);
        return;
      }

      const { data: accData, error: accError } = await supabase
        .from("account_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle<AccountRow>();

      if (accError) {
        if (!cancelled) setError(accError.message);
        setLoading(false);
        return;
      }

      if (!accData) {
        if (!cancelled) setError("Account profile missing. Register again or check RLS/SQL.");
        setLoading(false);
        return;
      }

      const mappedAccount = toAccountRow(accData);

      const { data: campaignData, error: campError } = await supabase
        .from("campaign_profiles")
        .select("*")
        .eq("owner_user_id", user.id)
        .maybeSingle<CampaignRow>();

      if (campError) {
        if (!cancelled) setError(campError.message);
        setLoading(false);
        return;
      }

      if (!campaignData) {
        if (!cancelled) setError("Campaign profile missing. Register again or check RLS/SQL.");
        setLoading(false);
        return;
      }

      const normalized = normalizeProfile(campaignData as any);

      if (cancelled) return;
      setAccount(mappedAccount);
      setCampaign(normalized);
      setTagsInput((mappedAccount.tags ?? []).join(", "));
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const currentTags = useMemo(() => {
    return tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }, [tagsInput]);

  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminCommand, setAdminCommand] = useState("");
  const [adminCommandError, setAdminCommandError] = useState<string | null>(null);

  async function grantAdminByCommand() {
    const supabase = getSupa();
    if (!supabase) return;
    if (!adminCommand.trim()) return;

    setAdminCommandError(null);
    setBusy(true);
    try {
      const { error: rpcError } = await supabase.rpc("grant_admin_if_code", {
        p_code: adminCommand.trim(),
      });
      if (rpcError) throw rpcError;
      setAdminModalOpen(false);
      setAdminCommand("");
      setAdminCommandError(null);
      setReloadKey((k) => k + 1);
    } catch (e: any) {
      setAdminCommandError(e?.message ?? "Admin command failed.");
    } finally {
      setBusy(false);
    }
  }

  async function updateAccountField<K extends keyof AccountRow>(key: K, value: AccountRow[K]) {
    if (!account) return;
    const supabase = getSupa();
    if (!supabase) return;
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;

    setBusy(true);
    setError(null);
    try {
      const dbKeyMap: Record<string, keyof AccountRow> = {
        display_name: "display_name",
        avatar_url: "avatar_url",
        faction: "faction",
        subfaction: "subfaction",
        homeland: "homeland",
        tags: "tags",
        bio: "bio",
        favorite_realm: "favorite_realm",
      };
      const actualKey = dbKeyMap[String(key)] ?? key;

      const { error: updError } = await supabase.from("account_profiles").update({ [actualKey]: value }).eq("user_id", user.id);
      if (updError) throw updError;

      // optimistic local update
      setAccount((prev) => {
        if (!prev) return prev;
        const next: AccountProfile = { ...prev, [String(actualKey) as any]: value } as any;
        // fix camelCase mapping
        return {
          ...prev,
          displayName: actualKey === "display_name" ? (value as any) ?? "" : prev.displayName,
          avatarUrl: actualKey === "avatar_url" ? (value as any) ?? "" : prev.avatarUrl,
          faction: actualKey === "faction" ? (value as any) ?? "" : prev.faction,
          subfaction: actualKey === "subfaction" ? (value as any) ?? "" : prev.subfaction,
          homeland: actualKey === "homeland" ? (value as any) ?? "" : prev.homeland,
          tags: actualKey === "tags" ? ((value as any) ?? []) : prev.tags,
          bio: actualKey === "bio" ? (value as any) ?? "" : prev.bio,
          favoriteRealm: actualKey === "favorite_realm" ? (value as any) ?? "" : prev.favoriteRealm,
        };
      });
    } catch (e: any) {
      setError(e?.message ?? "Update failed.");
    } finally {
      setBusy(false);
    }
  }

  async function saveTags() {
    const supabase = getSupa();
    if (!supabase || !account) return;
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;

    setBusy(true);
    setError(null);
    try {
      const { error: updError } = await supabase
        .from("account_profiles")
        .update({ tags: currentTags })
        .eq("user_id", user.id);
      if (updError) throw updError;
      setAccount((prev) => (prev ? { ...prev, tags: currentTags } : prev));
    } catch (e: any) {
      setError(e?.message ?? "Failed to save tags.");
    } finally {
      setBusy(false);
    }
  }

  async function updateCampaignField<K extends keyof CampaignRow>(key: K, value: CampaignRow[K]) {
    if (!campaign) return;
    const supabase = getSupa();
    if (!supabase) return;
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;

    setBusy(true);
    setError(null);
    try {
      const { error: updError } = await supabase
        .from("campaign_profiles")
        .update({ [key as string]: value } as any)
        .eq("owner_user_id", user.id);
      if (updError) throw updError;

      // refetch minimal fields could be expensive; optimistic update:
      setCampaign((prev) => {
        if (!prev) return prev;
        const next = { ...prev } as any;
        if (key === "display_name") next.displayName = value ?? "";
        if (key === "race") next.race = value ?? "";
        if (key === "career") next.career = value ?? "";
        if (key === "title") next.title = value ?? "";
        if (key === "sheet_url") next.sheetUrl = value ?? "";
        if (key === "faction") next.faction = value ?? "";
        if (key === "tags") next.tags = value ?? [];
        return next as Profile;
      });
    } catch (e: any) {
      setError(e?.message ?? "Campaign update failed.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="min-h-[40vh]" />;
  if (!account || !campaign) return <div className="panel p-5">Profile not available.</div>;

  return (
    <div className="space-y-6">
      <section className="panel noble-hero p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-blue-900/30 bg-white/70">
            {account.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={account.avatarUrl} alt="avatar preview" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-2xl font-bold text-blue-900">
                {(account.displayName || account.username).slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-900">My Account</p>
            <h1 className="text-2xl font-bold text-blue-950">{account.displayName || account.username}</h1>
            <p className="text-sm opacity-80">@{campaign.username || account.username}</p>
            <p className="mt-1 text-xs">
              {campaign.race} - {campaign.career} | {campaign.title || "No title"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="panel p-5 space-y-3">
          <h3 className="rune-title text-xs text-blue-900">Identity</h3>
          {error && <p className="text-xs text-red-700">{error}</p>}
          <input
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="Display Name"
            value={account.displayName}
            onChange={(e) => setAccount((prev) => (prev ? { ...prev, displayName: e.target.value } : prev))}
            onBlur={(e) => updateAccountField("display_name", e.target.value)}
          />
          <input
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="Avatar URL (image link)"
            value={account.avatarUrl}
            onChange={(e) => setAccount((prev) => (prev ? { ...prev, avatarUrl: e.target.value } : prev))}
            onBlur={(e) => updateAccountField("avatar_url", e.target.value)}
          />
          <textarea
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="Bio"
            value={account.bio}
            onChange={(e) => setAccount((prev) => (prev ? { ...prev, bio: e.target.value } : prev))}
            onBlur={(e) => updateAccountField("bio", e.target.value)}
          />
          <input
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="Homeland / Stronghold"
            value={account.homeland}
            onChange={(e) => setAccount((prev) => (prev ? { ...prev, homeland: e.target.value } : prev))}
            onBlur={(e) => updateAccountField("homeland", e.target.value)}
          />
          <input
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="Favorite Realm"
            value={account.favoriteRealm}
            onChange={(e) => setAccount((prev) => (prev ? { ...prev, favoriteRealm: e.target.value } : prev))}
            onBlur={(e) => updateAccountField("favorite_realm", e.target.value)}
          />

          <div className="space-y-2">
            <input
              className="w-full rounded border px-3 py-2 text-sm"
              placeholder="Tags (comma separated)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
            <button type="button" onClick={saveTags} disabled={busy} className="rounded border px-3 py-1 text-xs">
              {busy ? "Saving..." : "Save Tags"}
            </button>
          </div>
        </article>

        <article className="panel p-5 space-y-3">
          <h3 className="rune-title text-xs text-blue-900">Warhammer Profile</h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="w-full rounded border px-3 py-2 text-sm"
              placeholder="Name"
              value={campaign.displayName}
              onChange={(e) => setCampaign((prev) => (prev ? { ...prev, displayName: e.target.value } : prev))}
              onBlur={(e) => updateCampaignField("display_name", e.target.value)}
            />
            <input
              className="w-full rounded border px-3 py-2 text-sm"
              placeholder="Title"
              value={campaign.title}
              onChange={(e) => setCampaign((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
              onBlur={(e) => updateCampaignField("title", e.target.value)}
            />
          </div>

          <select
            className="w-full rounded border px-3 py-2 text-sm"
            value={campaign.race}
            onChange={(e) => updateCampaignField("race", e.target.value)}
          >
            <option value="">Select Race</option>
            {aosRaces.map((race) => (
              <option key={race} value={race}>
                {race}
              </option>
            ))}
          </select>

          <input
            className="w-full rounded border px-3 py-2 text-sm"
            list="me-careers"
            placeholder="Career (searchable)"
            value={campaign.career}
            onChange={(e) => setCampaign((prev) => (prev ? { ...prev, career: e.target.value } : prev))}
            onBlur={(e) => updateCampaignField("career", e.target.value)}
          />
          <datalist id="me-careers">
            {aosCareers.map((career) => (
              <option key={career} value={career} />
            ))}
          </datalist>

          <input
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="Character Sheet URL"
            value={campaign.sheetUrl}
            onChange={(e) => setCampaign((prev) => (prev ? { ...prev, sheetUrl: e.target.value } : prev))}
            onBlur={(e) => updateCampaignField("sheet_url", e.target.value)}
          />

          <div className="space-y-2">
            <input
              className="w-full rounded border px-3 py-2 text-sm"
              placeholder="Faction"
              value={campaign.faction ?? ""}
              onChange={(e) => setCampaign((prev) => (prev ? { ...prev, faction: e.target.value } : prev))}
              onBlur={(e) => updateCampaignField("faction", e.target.value)}
            />
          </div>

          <div className="rounded border bg-white/60 p-3">
            <p className="text-xs font-semibold text-blue-900">Roles</p>
            <div className="mt-2 flex gap-3 text-xs">
              {(["player", "gamemaster"] as Role[]).map((role) => (
                <label key={role} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={campaign.roles.includes(role)}
                    onChange={() => {
                      const has = campaign.roles.includes(role);
                      const nextRoles: Role[] = has
                        ? campaign.roles.filter((r) => r !== role)
                        : [...campaign.roles, role];
                      const normalized: Role[] = nextRoles.length ? nextRoles : ["player"];
                      const perms = defaultPermissionsForRoles(normalized);
                      updateCampaignField("roles", normalized);
                      updateCampaignField("permissions", perms as any);
                    }}
                  />
                  {role}
                </label>
              ))}
            </div>
          </div>

          <div className="pt-3">
            {!account.isAdmin ? (
              <button
                type="button"
                className="btn-secondary rounded px-4 py-2 text-sm"
                onClick={() => {
                  setAdminModalOpen(true);
                  setAdminCommandError(null);
                  setAdminCommand("");
                }}
                disabled={busy}
              >
                Admin Command
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-green-900">Admin access granted.</p>
                <a
                  href="/admin/users"
                  className="block text-xs font-semibold text-blue-900 underline underline-offset-2 hover:text-blue-950"
                >
                  User Management
                </a>
              </div>
            )}
          </div>
        </article>
      </section>

      {adminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded border border-blue-900/25 bg-white p-4 shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <p className="rune-title text-sm text-blue-900">Administrator Console</p>
              <button
                type="button"
                className="rounded border px-2 py-1 text-xs"
                onClick={() => setAdminModalOpen(false)}
              >
                Close
              </button>
            </div>
            <p className="mt-2 text-xs opacity-80">
              Enter the admin code. Example: <span className="font-semibold">Over9000</span>
            </p>
            <div className="mt-3 rounded border bg-neutral-950 p-3 text-sm text-neutral-100">
              <label className="block text-xs opacity-80">Command</label>
              <input
                className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-2 text-sm"
                value={adminCommand}
                onChange={(e) => setAdminCommand(e.target.value)}
                placeholder="Over9000"
              />
            </div>
            {adminCommandError && <p className="mt-2 text-xs text-red-700">{adminCommandError}</p>}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="btn-accent rounded px-4 py-2 text-sm flex-1"
                onClick={grantAdminByCommand}
                disabled={busy}
              >
                Run
              </button>
              <button
                type="button"
                className="rounded border px-4 py-2 text-sm flex-1"
                onClick={() => setAdminModalOpen(false)}
                disabled={busy}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

