"use client";

import { useEffect, useMemo, useState } from "react";
import type { ImportedCharacter, ImportedWorkbook } from "@/lib/characterStore";

type TabId =
  | "overview"
  | "attributes"
  | "gear"
  | "gems_loot"
  | "books_learning"
  | "notes_people_places"
  | "properties_factions"
  | "workbook_inspector";

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "attributes", label: "Attributes" },
  { id: "gear", label: "Gear" },
  { id: "gems_loot", label: "Gems / Loot" },
  { id: "books_learning", label: "Books / Learning" },
  { id: "notes_people_places", label: "Notes / People / Places" },
  { id: "properties_factions", label: "Properties / Factions" },
  { id: "workbook_inspector", label: "Workbook Inspector" },
];

type Props = {
  character: ImportedCharacter;
  workbook: ImportedWorkbook | null;
};

function getSheet(workbook: ImportedWorkbook | null, name: string) {
  return workbook?.sheets.find((sheet) => sheet.name === name) ?? null;
}

function rowValues(row: string[] | undefined) {
  return (row ?? []).map((cell) => String(cell ?? "").trim());
}

function cleanedRows(rows: string[][]) {
  return rows.filter((row) => row.some((cell) => String(cell ?? "").trim().length > 0));
}

function pickRows(rows: string[][], from: number, to: number) {
  return rows.slice(from - 1, to).map((row, index) => ({ rowNumber: from + index, row }));
}

export function CharacterWorkbenchClient({ character, workbook }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [editing, setEditing] = useState(false);
  const storageKey = `character_draft_${character.id}`;
  const [draft, setDraft] = useState(() => {
    if (typeof window === "undefined") return character;
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? ({ ...character, ...JSON.parse(raw) } as ImportedCharacter) : character;
    } catch {
      return character;
    }
  });
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    if (!editing) return;
    const timer = window.setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(draft));
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 800);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [draft, editing, storageKey]);

  const mainSheet = getSheet(workbook, "Sheet");
  const notesSheet = getSheet(workbook, "Notes");
  const peoplePlacesSheet = getSheet(workbook, "People  Places");
  const jakesHouseSheet = getSheet(workbook, "Jakes House Altdorf");
  const bankSheet = getSheet(workbook, "Bank of Altdorf Treasury");
  const arcaneSheet = getSheet(workbook, "The Arcane Circle");
  const aetherSheet = getSheet(workbook, "Aether Weaving");

  const attributesRows = useMemo(() => (mainSheet ? pickRows(mainSheet.rows, 8, 32) : []), [mainSheet]);
  const magicGearRows = useMemo(() => (mainSheet ? pickRows(mainSheet.rows, 36, 58) : []), [mainSheet]);
  const gemsRows = useMemo(() => (mainSheet ? pickRows(mainSheet.rows, 60, 93) : []), [mainSheet]);
  const booksRows = useMemo(() => (mainSheet ? pickRows(mainSheet.rows, 98, 140) : []), [mainSheet]);

  function update<K extends keyof ImportedCharacter>(key: K, value: ImportedCharacter[K]) {
    if (!editing) return;
    setSaveState("saving");
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-4">
      <section className="panel noble-hero p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-900">Noble Record Sheet</p>
            <h2 className="mt-1 text-2xl font-bold text-blue-950">{draft.name}</h2>
            <p className="text-sm">
              {draft.race} - {draft.career}
            </p>
            <p className="mt-1 text-xs opacity-80">
              Source of truth: XLSX ({workbook?.sheetCount ?? 0} sheets) | Formulas: {character.formulaCount}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`rounded border px-3 py-1 text-xs ${editing ? "bg-blue-900 text-blue-50" : "bg-white"}`}
              onClick={() => setEditing((prev) => !prev)}
            >
              {editing ? "Editing Enabled" : "View Mode"}
            </button>
            <button
              type="button"
              className="rounded border px-3 py-1 text-xs"
              onClick={() => {
                localStorage.removeItem(storageKey);
                setDraft(character);
              }}
            >
              Reset Draft
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-6">
          {[
            ["M", draft.movement],
            ["S", draft.strength],
            ["T", draft.toughness],
            ["W", draft.willpower],
            ["I", draft.initiative],
            ["INT", (mainSheet?.rows?.[22]?.[3] ?? "-") as string | number],
          ].map(([label, value]) => (
            <article key={label} className="rounded border border-blue-900/25 bg-white/80 p-2 text-center">
              <p className="text-xs uppercase tracking-wide text-blue-900">{label}</p>
              <p className="text-xl font-bold text-blue-950">{value}</p>
            </article>
          ))}
        </div>
        <p className="mt-3 text-xs opacity-80">
          Autosave: {editing ? (saveState === "saving" ? "saving..." : saveState === "saved" ? "saved" : "idle") : "disabled in view mode"}
        </p>
      </section>

      <nav className="panel p-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`rounded-md border px-3 py-1 text-xs ${activeTab === tab.id ? "bg-blue-900 text-blue-50" : "bg-white"}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {activeTab === "overview" && (
        <section className="panel p-5">
          <h3 className="rune-title text-sm text-blue-900">Overview</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              Name
              <input className="mt-1 w-full rounded border px-2 py-1" value={draft.name} onChange={(e) => update("name", e.target.value)} />
            </label>
            <label className="text-sm">
              Career
              <input className="mt-1 w-full rounded border px-2 py-1" value={draft.career} onChange={(e) => update("career", e.target.value)} />
            </label>
            <label className="text-sm">
              Race
              <input className="mt-1 w-full rounded border px-2 py-1" value={draft.race} onChange={(e) => update("race", e.target.value)} />
            </label>
            <label className="text-sm">
              Magic Points
              <input className="mt-1 w-full rounded border px-2 py-1" type="number" value={draft.magicPoints} onChange={(e) => update("magicPoints", Number(e.target.value))} />
            </label>
          </div>
        </section>
      )}

      {activeTab === "attributes" && (
        <section className="panel p-5">
          <h3 className="rune-title text-sm text-blue-900">Attributes & Derived</h3>
          <div className="mt-3 overflow-auto rounded border border-blue-900/25 bg-white/80">
            <table className="min-w-full text-xs">
              <tbody>
                {attributesRows.map((entry) => (
                  <tr key={`attr-${entry.rowNumber}`} className="border-b border-blue-900/10">
                    <td className="px-2 py-1 font-semibold text-blue-900">{entry.rowNumber}</td>
                    {entry.row.map((cell, idx) => (
                      <td key={`attr-${entry.rowNumber}-${idx}`} className="px-2 py-1 whitespace-pre-wrap">
                        {String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "gear" && (
        <section className="panel p-5">
          <h3 className="rune-title text-sm text-blue-900">Gear & Encumbrance</h3>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <article className="rounded border border-blue-900/20 bg-white/80 p-3">
              <p className="text-xs uppercase tracking-wide text-blue-900">Magic Gear (left table)</p>
              <div className="mt-2 space-y-1 text-xs">
                {magicGearRows.map(({ rowNumber, row }) => {
                  const values = rowValues(row);
                  const left = [values[1], values[2], values[5], values[7]].filter(Boolean).join(" | ");
                  return left ? <p key={`gear-left-${rowNumber}`}>{left}</p> : null;
                })}
              </div>
            </article>
            <article className="rounded border border-blue-900/20 bg-white/80 p-3">
              <p className="text-xs uppercase tracking-wide text-blue-900">Trappings (right table)</p>
              <div className="mt-2 space-y-1 text-xs">
                {magicGearRows.map(({ rowNumber, row }) => {
                  const values = rowValues(row);
                  const right = [values[9], values[10], values[11], values[12]].filter(Boolean).join(" | ");
                  return right ? <p key={`gear-right-${rowNumber}`}>{right}</p> : null;
                })}
              </div>
            </article>
          </div>
        </section>
      )}

      {activeTab === "gems_loot" && (
        <section className="panel p-5">
          <h3 className="rune-title text-sm text-blue-900">Gems / Loot</h3>
          <div className="mt-3 overflow-auto rounded border border-blue-900/20 bg-white/80">
            <table className="min-w-full text-xs">
              <tbody>
                {gemsRows.map(({ rowNumber, row }) => (
                  <tr key={`gem-${rowNumber}`} className="border-b border-blue-900/10">
                    <td className="px-2 py-1 font-semibold text-blue-900">{rowNumber}</td>
                    {row.map((cell, idx) => (
                      <td key={`gem-${rowNumber}-${idx}`} className="px-2 py-1 whitespace-pre-wrap">
                        {String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "books_learning" && (
        <section className="panel p-5">
          <h3 className="rune-title text-sm text-blue-900">Books / Learning</h3>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <article className="rounded border border-blue-900/20 bg-white/80 p-3">
              <p className="text-xs uppercase tracking-wide text-blue-900">Books Segment (main sheet)</p>
              <div className="mt-2 space-y-1 text-xs">
                {booksRows.map(({ rowNumber, row }) => {
                  const text = rowValues(row).filter(Boolean).join(" | ");
                  return text ? <p key={`books-main-${rowNumber}`}>{text}</p> : null;
                })}
              </div>
            </article>
            <article className="rounded border border-blue-900/20 bg-white/80 p-3">
              <p className="text-xs uppercase tracking-wide text-blue-900">Aether Weaving</p>
              <div className="mt-2 space-y-1 text-xs">
                {cleanedRows(aetherSheet?.rows ?? []).slice(0, 120).map((row, idx) => (
                  <p key={`aether-${idx}`}>{rowValues(row).filter(Boolean).join(" | ")}</p>
                ))}
              </div>
            </article>
          </div>
        </section>
      )}

      {activeTab === "notes_people_places" && (
        <section className="panel p-5">
          <h3 className="rune-title text-sm text-blue-900">Notes / People / Places</h3>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <article className="rounded border border-blue-900/20 bg-white/80 p-3">
              <p className="text-xs uppercase tracking-wide text-blue-900">Notes</p>
              <div className="mt-2 space-y-1 text-xs">
                {cleanedRows(notesSheet?.rows ?? []).slice(0, 180).map((row, idx) => (
                  <p key={`notes-${idx}`}>{rowValues(row).filter(Boolean).join(" | ")}</p>
                ))}
              </div>
            </article>
            <article className="rounded border border-blue-900/20 bg-white/80 p-3">
              <p className="text-xs uppercase tracking-wide text-blue-900">People / Places</p>
              <div className="mt-2 space-y-1 text-xs">
                {cleanedRows(peoplePlacesSheet?.rows ?? []).slice(0, 180).map((row, idx) => (
                  <p key={`people-${idx}`}>{rowValues(row).filter(Boolean).join(" | ")}</p>
                ))}
              </div>
            </article>
          </div>
        </section>
      )}

      {activeTab === "properties_factions" && (
        <section className="panel p-5">
          <h3 className="rune-title text-sm text-blue-900">Properties / Factions</h3>
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <article className="rounded border border-blue-900/20 bg-white/80 p-3">
              <p className="text-xs uppercase tracking-wide text-blue-900">Jake&apos;s House Altdorf</p>
              <div className="mt-2 space-y-1 text-xs">
                {cleanedRows(jakesHouseSheet?.rows ?? []).slice(0, 120).map((row, idx) => (
                  <p key={`house-${idx}`}>{rowValues(row).filter(Boolean).join(" | ")}</p>
                ))}
              </div>
            </article>
            <article className="rounded border border-blue-900/20 bg-white/80 p-3">
              <p className="text-xs uppercase tracking-wide text-blue-900">Bank of Altdorf Treasury</p>
              <div className="mt-2 space-y-1 text-xs">
                {cleanedRows(bankSheet?.rows ?? []).slice(0, 120).map((row, idx) => (
                  <p key={`bank-${idx}`}>{rowValues(row).filter(Boolean).join(" | ")}</p>
                ))}
              </div>
            </article>
            <article className="rounded border border-blue-900/20 bg-white/80 p-3">
              <p className="text-xs uppercase tracking-wide text-blue-900">The Arcane Circle</p>
              <div className="mt-2 space-y-1 text-xs">
                {cleanedRows(arcaneSheet?.rows ?? []).slice(0, 120).map((row, idx) => (
                  <p key={`arcane-${idx}`}>{rowValues(row).filter(Boolean).join(" | ")}</p>
                ))}
              </div>
            </article>
          </div>
        </section>
      )}

      {activeTab === "workbook_inspector" && (
        <section className="panel p-5">
          <h3 className="rune-title text-sm text-blue-900">Workbook Inspector (Structured All Tabs)</h3>
          <div className="mt-3 space-y-3">
            {(workbook?.sheets ?? []).map((sheet) => (
              <article key={sheet.name} className="rounded border border-blue-900/20 bg-white/80 p-3">
                <h4 className="text-sm font-bold text-blue-950">{sheet.name}</h4>
                <p className="text-xs opacity-80">Range: {sheet.ref} | Rows: {sheet.rows.length}</p>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {cleanedRows(sheet.rows)
                    .slice(0, 24)
                    .map((row, idx) => (
                      <p key={`${sheet.name}-${idx}`} className="text-xs">
                        {rowValues(row).filter(Boolean).join(" | ")}
                      </p>
                    ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
