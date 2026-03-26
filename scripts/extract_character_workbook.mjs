import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";

const root = process.cwd();
const inputPath = path.join(root, "data", "input", "jake-sheet.xlsx");
const outWorkbook = path.join(root, "src", "content", "characters", "jake-workbook.generated.json");
const outProfile = path.join(root, "src", "content", "characters", "jake-von-kent.json");

const wb = XLSX.readFile(inputPath, { cellFormula: true });

const formulas = [];
const sheets = wb.SheetNames.map((name) => {
  const ws = wb.Sheets[name];
  const ref = ws["!ref"] || "A1:A1";
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  const compactRows = rows.map((r) => r.map((cell) => (cell == null ? "" : String(cell))));

  for (const key of Object.keys(ws)) {
    if (key.startsWith("!")) continue;
    const f = ws[key] && ws[key].f;
    if (f) formulas.push({ sheet: name, cell: key, formula: f });
  }

  return { name, ref, rows: compactRows };
});

const main = wb.Sheets.Sheet;
const profile = {
  id: "jake-von-kent",
  name: String(main.B3?.v || "Jake von Kent"),
  race: String(main.E3?.v || "Human"),
  career: String(main.F5?.v || "Gold Wizard"),
  movement: Number(main.E9?.v || 40),
  ws: Number(main.E15?.v || 53),
  bs: Number(main.E18?.v || 51),
  strength: Number(main.E10?.v || 50),
  toughness: Number(main.E11?.v || 100),
  initiative: Number(main.E20?.v || 103),
  willpower: Number(main.E25?.v || 95),
  fellowship: Number(main.E31?.v || 58),
  magicPoints: Number(main.E28?.v || 155),
  notes: "Import aus Copy of Halbgott Jake Warhammer Character Sheet.xlsx",
  source: "xlsx",
  formulaCount: formulas.length,
  formulaPreview: formulas.slice(0, 20),
};

const workbookPayload = {
  name: "Copy of Halbgott Jake Warhammer Character Sheet.xlsx",
  sheetCount: wb.SheetNames.length,
  formulas,
  sheets,
};

fs.writeFileSync(outWorkbook, JSON.stringify(workbookPayload));
fs.writeFileSync(outProfile, JSON.stringify(profile));
console.log(`Wrote ${outWorkbook}`);
console.log(`Wrote ${outProfile}`);
