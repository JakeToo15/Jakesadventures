import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import type { CharacterSheet } from "@/lib/characters";

export type SheetFormula = {
  sheet: string;
  cell: string;
  formula: string;
};

export type ImportedCharacter = CharacterSheet & {
  source: "xlsx" | "seed";
  formulaCount: number;
  formulaPreview: SheetFormula[];
};

function getCellValue(ws: XLSX.WorkSheet, ref: string) {
  return ws[ref]?.v;
}

export function loadJakeFromXlsx(): ImportedCharacter | null {
  const filePath = path.join(process.cwd(), "data", "input", "jake-sheet.xlsx");
  if (!fs.existsSync(filePath)) return null;

  const workbook = XLSX.readFile(filePath, { cellFormula: true });
  const sheet = workbook.Sheets.Sheet;
  if (!sheet) return null;

  const formulas: SheetFormula[] = [];
  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    for (const key of Object.keys(ws)) {
      if (key.startsWith("!")) continue;
      const formula = ws[key]?.f;
      if (formula) {
        formulas.push({ sheet: sheetName, cell: key, formula });
      }
    }
  }

  return {
    id: "jake-von-kent",
    name: String(getCellValue(sheet, "B3") ?? "Jake von Kent"),
    race: String(getCellValue(sheet, "E3") ?? "Human"),
    career: String(getCellValue(sheet, "F5") ?? "Gold Wizard"),
    movement: Number(getCellValue(sheet, "E9") ?? 40),
    ws: Number(getCellValue(sheet, "E15") ?? 53),
    bs: Number(getCellValue(sheet, "E18") ?? 51),
    strength: Number(getCellValue(sheet, "E10") ?? 50),
    toughness: Number(getCellValue(sheet, "E11") ?? 100),
    initiative: Number(getCellValue(sheet, "E20") ?? 103),
    willpower: Number(getCellValue(sheet, "E25") ?? 95),
    fellowship: Number(getCellValue(sheet, "E31") ?? 58),
    magicPoints: Number(getCellValue(sheet, "E28") ?? 155),
    notes: `Import aus XLSX: ${String(getCellValue(sheet, "K5") ?? "")}, ${String(getCellValue(sheet, "L5") ?? "")}`,
    source: "xlsx",
    formulaCount: formulas.length,
    formulaPreview: formulas.slice(0, 20),
  };
}
