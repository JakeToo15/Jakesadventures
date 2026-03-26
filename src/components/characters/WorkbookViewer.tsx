"use client";

import { useMemo, useState } from "react";

type WorkbookSheet = {
  name: string;
  ref: string;
  rows: string[][];
};

type Props = {
  sheets: WorkbookSheet[];
};

export function WorkbookViewer({ sheets }: Props) {
  const [activeSheet, setActiveSheet] = useState(sheets[0]?.name ?? "");
  const [filter, setFilter] = useState("");

  const current = useMemo(() => {
    const selected = sheets.find((s) => s.name === activeSheet) ?? sheets[0];
    if (!selected) return null;
    if (!filter.trim()) return selected;

    const q = filter.toLowerCase();
    const filteredRows = selected.rows.filter((row) =>
      row.some((cell) => cell.toLowerCase().includes(q)),
    );
    return { ...selected, rows: filteredRows };
  }, [sheets, activeSheet, filter]);

  if (!current) return null;

  return (
    <section className="panel p-4">
      <h2 className="rune-title text-sm text-amber-900">Vollständiges Workbook</h2>
      <p className="mt-1 text-xs opacity-80">
        Alle Tabs aus dem XLSX sind eingebunden. Anzeige zeigt Originalwerte tabellarisch.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {sheets.map((sheet) => (
          <button
            key={sheet.name}
            type="button"
            onClick={() => setActiveSheet(sheet.name)}
            className={`rounded-md border px-3 py-1 text-xs ${
              sheet.name === current.name ? "bg-amber-900 text-amber-50" : "bg-amber-50"
            }`}
          >
            {sheet.name}
          </button>
        ))}
      </div>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Im aktuellen Tab suchen..."
        className="mt-3 w-full rounded border border-amber-900/30 px-3 py-2 text-sm"
      />

      <div className="mt-3 overflow-auto rounded border border-amber-900/30 bg-amber-50/70">
        <table className="min-w-full border-collapse text-xs">
          <tbody>
            {current.rows.map((row, rowIndex) => (
              <tr key={`${current.name}-${rowIndex}`} className="border-b border-amber-900/15">
                <td className="sticky left-0 z-10 border-r border-amber-900/20 bg-amber-100 px-2 py-1 font-semibold">
                  {rowIndex + 1}
                </td>
                {row.map((cell, colIndex) => (
                  <td key={`${rowIndex}-${colIndex}`} className="max-w-[18rem] px-2 py-1 align-top whitespace-pre-wrap">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
