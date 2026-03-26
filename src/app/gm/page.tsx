import { GamemasterClient } from "@/components/gm/GamemasterClient";

export default function GamemasterPage() {
  return (
    <div className="space-y-6">
      <section className="panel noble-hero p-6">
        <h1 className="rune-title text-xl text-blue-900">Gamemaster Command</h1>
        <p className="mt-2">
          Create adventures, schedule sessions, and maintain campaign notes. Landing page widgets update from here.
        </p>
      </section>
      <GamemasterClient />
    </div>
  );
}
