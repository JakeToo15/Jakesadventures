import { MyProfileClient } from "@/components/profiles/MyProfileClient";

export default function MyProfilePage() {
  return (
    <div className="space-y-6">
      <section className="panel noble-hero p-6">
        <h1 className="rune-title text-xl text-blue-900">My Profile</h1>
        <p className="mt-2">
          Manage your account profile, avatar, faction identity, and personal campaign tags.
        </p>
      </section>
      <MyProfileClient />
    </div>
  );
}
