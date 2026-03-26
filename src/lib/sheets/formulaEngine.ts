import type { CharacterSheet } from "@/lib/characters";

export type CoreFormulaInput = {
  movementBase: number;
  strengthCurrent: number;
  toughnessCurrent: number;
  willpowerCurrent: number;
  encCarried: number;
};

export type CoreFormulaOutput = {
  equivalentStrength: number;
  encumbranceAvailable: number;
  encumbranceOver: number;
  movementPenalty: number;
  movementCurrent: number;
};

// Mirrors key formulas from the spreadsheet:
// J10 = Strength * 10
// J13 = IF(J10 < H13, H13 - J10, 0)
// L13 = IF(J13 = 0, 0, FLOOR(J13 / 50, 1))
// H9  = E9 - L13*10
// E13 = E10 + E11 + E12
export function evaluateCoreFormulas(
  input: CoreFormulaInput,
): CoreFormulaOutput {
  const equivalentStrength = input.strengthCurrent + input.toughnessCurrent + input.willpowerCurrent;
  const encumbranceAvailable = input.strengthCurrent * 10;
  const encumbranceOver = encumbranceAvailable < input.encCarried ? input.encCarried - encumbranceAvailable : 0;
  const movementPenalty = encumbranceOver === 0 ? 0 : Math.floor(encumbranceOver / 50);
  const movementCurrent = input.movementBase - movementPenalty * 10;

  return {
    equivalentStrength,
    encumbranceAvailable,
    encumbranceOver,
    movementPenalty,
    movementCurrent,
  };
}

export function fromCharacterSheet(character: CharacterSheet, encCarried: number) {
  return evaluateCoreFormulas({
    movementBase: character.movement,
    strengthCurrent: character.strength,
    toughnessCurrent: character.toughness,
    willpowerCurrent: character.willpower,
    encCarried,
  });
}
