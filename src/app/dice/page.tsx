import { DiceRollerClient } from "@/components/dice/DiceRollerClient";

export default function DicePage() {
  return (
    <div className="space-y-6">
      <section className="panel noble-hero p-6">
        <h1 className="rune-title text-xl text-blue-900">Dice Chamber</h1>
        <p className="mt-2">
          Noble-themed rolling workflow with d100 defaults, persistent history, and chaos escalation handling.
        </p>
      </section>
      <DiceRollerClient />
    </div>
  );
}
