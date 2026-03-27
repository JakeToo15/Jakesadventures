"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

type UserRow = {
  user_id: string;
  email: string | null;
  display_name: string | null;
  is_admin: boolean;
  is_approved: boolean;
};

export function UsersAdminClient() {
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [adminEmail, setAdminEmail] = useState<string>("");
  const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);

  async function load() {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Supabase not configured.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("Not signed in.");

      setAdminEmail(user.email ?? "");

      const { data: meRow } = await supabase
        .from("account_profiles")
        .select("is_admin,is_approved")
        .eq("user_id", user.id)
        .maybeSingle<{ is_admin: boolean; is_approved: boolean }>();

      setIsAuthorizedAdmin(Boolean(meRow?.is_admin));
      if (!meRow?.is_admin) {
        setUsers([]);
        return;
      }

      const { data: rows, error: rowsError } = await supabase
        .from("account_profiles")
        .select("user_id,email,display_name,is_admin,is_approved")
        .order("user_id", { ascending: true });

      if (rowsError) throw rowsError;
      setUsers((rows ?? []) as UserRow[]);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to load users.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateUser(userId: string, patch: Partial<Pick<UserRow, "is_admin" | "is_approved">>) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    setBusyId(userId);
    setError(null);
    try {
      const { error: updError } = await supabase.from("account_profiles").update(patch).eq("user_id", userId);
      if (updError) throw updError;
      await load();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Update failed.";
      setError(message);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <div className="panel p-6">Loading…</div>;
  }

  if (!isAuthorizedAdmin) {
    return (
      <div className="panel p-6">
        <p className="text-sm">
          Not authorized. {adminEmail ? `Your account (${adminEmail})` : "You are"} are not an admin.
        </p>
      </div>
    );
  }

  return (
    <section className="panel p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm opacity-80">Manage registered accounts.</p>
          <p className="text-xs opacity-60 mt-1">Tip: grant admin also approves the user.</p>
        </div>
      </div>

      {error && <p className="text-xs text-red-700">{error}</p>}

      <div className="overflow-auto rounded border">
        <table className="w-full text-sm">
          <thead className="bg-stone-50">
            <tr className="text-left">
              <th className="p-3">User</th>
              <th className="p-3">Approved</th>
              <th className="p-3">Admin</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isBusy = busyId === u.user_id;
              const fullName = u.display_name?.trim() ? u.display_name : u.user_id;
              return (
                <tr key={u.user_id} className="border-t">
                  <td className="p-3">
                    <div className="font-semibold">{fullName}</div>
                    <div className="text-xs opacity-70">{u.email ?? "no-email"}</div>
                  </td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={u.is_approved}
                      disabled={isBusy}
                      onChange={(e) => updateUser(u.user_id, { is_approved: e.target.checked })}
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={u.is_admin}
                      disabled={isBusy}
                      onChange={(e) =>
                        updateUser(u.user_id, {
                          is_admin: e.target.checked,
                          is_approved: e.target.checked ? true : u.is_approved,
                        })
                      }
                    />
                  </td>
                  <td className="p-3">
                    <span className="text-xs opacity-70">{isBusy ? "Updating…" : "—"}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

