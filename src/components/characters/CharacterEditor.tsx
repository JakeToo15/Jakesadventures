"use client";

import { useMemo, useState } from "react";
import { derivedCombat, type CharacterSheet } from "@/lib/characters";
import { fromCharacterSheet } from "@/lib/sheets/formulaEngine";

type Props = {
  initial: CharacterSheet;
};

export function CharacterEditor({ initial }: Props) {
  const [sheet, setSheet] = useState<CharacterSheet>(initial);
  const [encCarried, setEncCarried] = useState(312);

  const derived = useMemo(() => derivedCombat(sheet), [sheet]);
  const formulas = useMemo(() => fromCharacterSheet(sheet, encCarried), [sheet, encCarried]);

  function update<K extends keyof CharacterSheet>(key: K, value: CharacterSheet[K]) {
    setSheet((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-4">
      <section className="panel grid gap-3 p-5 md:grid-cols-2">
        <label className="text-sm">
          Name
          <input className="mt-1 w-full rounded border px-2 py-1" value={sheet.name} onChange={(e) => update("name", e.target.value)} />
        </label>
        <label className="text-sm">
          Karriere
          <input className="mt-1 w-full rounded border px-2 py-1" value={sheet.career} onChange={(e) => update("career", e.target.value)} />
        </label>
        <label className="text-sm">
          Rasse
          <input className="mt-1 w-full rounded border px-2 py-1" value={sheet.race} onChange={(e) => update("race", e.target.value)} />
        </label>
        <label className="text-sm">
          MP
          <input className="mt-1 w-full rounded border px-2 py-1" type="number" value={sheet.magicPoints} onChange={(e) => update("magicPoints", Number(e.target.value))} />
        </label>
      </section>

      <section className="panel grid gap-3 p-5 md:grid-cols-4">
        {(
          [
            ["ws", "WS"],
            ["bs", "BS"],
            ["strength", "S"],
            ["toughness", "T"],
            ["initiative", "I"],
            ["willpower", "WP"],
            ["fellowship", "Fel"],
            ["movement", "M"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="text-sm">
            {label}
            <input
              className="mt-1 w-full rounded border px-2 py-1"
              type="number"
              value={sheet[key]}
              onChange={(e) => update(key, Number(e.target.value))}
            />
          </label>
        ))}
      </section>

      <section className="panel p-5">
        <h2 className="rune-title text-sm text-amber-900">Abgeleitete Werte</h2>
        <p className="mt-2 text-sm">Melee Fokus: {derived.meleeFocus}</p>
        <p className="text-sm">Ranged Fokus: {derived.rangedFocus}</p>
        <p className="text-sm">Resilience: {derived.resilience}</p>
      </section>

      <section className="panel p-5">
        <h2 className="rune-title text-sm text-amber-900">Formel-Engine (Schritt 2)</h2>
        <p className="mt-2 text-xs opacity-80">
          Replikation zentraler XLSX-Formeln: <code>J10</code>, <code>J13</code>, <code>L13</code>, <code>H9</code>, <code>E13</code>.
        </p>
        <label className="mt-3 block text-sm">
          Encumbrance Carried (H13)
          <input
            className="mt-1 w-full rounded border px-2 py-1"
            type="number"
            value={encCarried}
            onChange={(e) => setEncCarried(Number(e.target.value))}
          />
        </label>
        <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
          <p>Equivalent Strength (E13): <strong>{formulas.equivalentStrength}</strong></p>
          <p>Enc Available (J10): <strong>{formulas.encumbranceAvailable}</strong></p>
          <p>Enc Over (J13): <strong>{formulas.encumbranceOver}</strong></p>
          <p>Movement Penalty (L13): <strong>{formulas.movementPenalty}</strong></p>
          <p>Movement Current (H9): <strong>{formulas.movementCurrent}</strong></p>
        </div>
      </section>
    </div>
  );
}
