import { UsersAdminClient } from "@/components/admin/UsersAdminClient";

export default function UsersAdminPage() {
  return (
    <div className="space-y-6">
      <section className="panel noble-hero p-6">
        <h1 className="rune-title text-xl text-blue-900">Admin: User Management</h1>
        <p className="mt-2 text-sm">
          Approve new accounts and grant admin rights.
        </p>
      </section>
      <UsersAdminClient />
    </div>
  );
}

