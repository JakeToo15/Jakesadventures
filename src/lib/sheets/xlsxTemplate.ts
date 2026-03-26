import type { CharacterSheet } from "@/lib/characters";

export type FormulaMap = {
  field: keyof CharacterSheet;
  source: string;
  description: string;
};

export const xlsxMappingNotes: FormulaMap[] = [
  { field: "name", source: "Notes!A3", description: "Charaktername aus Kopfbereich." },
  { field: "race", source: "Notes!E3", description: "Rasse aus Stammdatenblock." },
  { field: "career", source: "Notes!E5", description: "Karrierebezeichnung." },
  { field: "movement", source: "Notes!E9", description: "Aktuelle Bewegung." },
  { field: "ws", source: "Notes!B15", description: "Weapon Skill." },
  { field: "bs", source: "Notes!B18", description: "Ballistic Skill." },
  { field: "magicPoints", source: "Notes!B28", description: "Aktuelle MP." },
];

export function explainImportPipeline() {
  return [
    "1) XLSX wird geparst und relevante Tabs/Felder extrahiert.",
    "2) Formeln werden als Mapping dokumentiert und in TS-Funktionen gespiegelt.",
    "3) Werte werden in CharacterSheet normalisiert.",
    "4) Bearbeitung in der Web-UI schreibt nur normalisierte Daten.",
    "5) Optionaler Export zurueck in ein Austauschformat.",
  ];
}
