export type CharacterSheet = {
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
};

export const starterCharacters: CharacterSheet[] = [
  {
    id: "jake-von-kent",
    name: "Jake von Kent",
    race: "Human",
    career: "Gold Wizard",
    movement: 40,
    ws: 33,
    bs: 31,
    strength: 30,
    toughness: 50,
    initiative: 33,
    willpower: 35,
    fellowship: 28,
    magicPoints: 155,
    notes: "Aus dem importierten Sheet vorbelegt.",
  },
];

export function getCharacterById(id: string) {
  return starterCharacters.find((character) => character.id === id);
}

export function derivedCombat(character: CharacterSheet) {
  return {
    meleeFocus: Math.round((character.ws + character.strength) / 2),
    rangedFocus: Math.round((character.bs + character.initiative) / 2),
    resilience: Math.round((character.toughness + character.willpower) / 2),
  };
}
