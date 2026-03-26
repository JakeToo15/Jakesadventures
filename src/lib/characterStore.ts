import { starterCharacters } from "@/lib/characters";
import jakeImported from "@/content/characters/jake-von-kent.json";
import jakeWorkbook from "@/content/characters/jake-workbook.generated.json";

export type ImportedCharacter = {
  id: string;
  name: string;
  race: string;
  career: string;
  movement: number;
  ws: number;
  bs: number;
  strength: number;
  toughness: number;
  initiative: number;
  willpower: number;
  fellowship: number;
  magicPoints: number;
  notes: string;
  source: "xlsx" | "seed";
  formulaCount: number;
  formulaPreview: Array<{ sheet: string; cell: string; formula: string }>;
};

export type ImportedWorkbook = {
  name: string;
  sheetCount: number;
  formulas: Array<{ sheet: string; cell: string; formula: string }>;
  sheets: Array<{ name: string; ref: string; rows: string[][] }>;
};

export function getAllCharacters(): ImportedCharacter[] {
  if (jakeImported) return [jakeImported as ImportedCharacter];
  return starterCharacters.map((character) => ({
    ...character,
    source: "seed" as const,
    formulaCount: 0,
    formulaPreview: [],
  }));
}

export function getCharacter(id: string): ImportedCharacter | undefined {
  return getAllCharacters().find((character) => character.id === id);
}

export function getCharacterWorkbook(id: string): ImportedWorkbook | null {
  if (id === "jake-von-kent") return jakeWorkbook as ImportedWorkbook;
  return null;
}
