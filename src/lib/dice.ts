import type { PaschEntry, PaschTier } from "@/content/pasch/manifestations";
import { paschManifestations } from "@/content/pasch/manifestations";

export function rollDie(sides: number) {
  return Math.floor(Math.random() * sides) + 1;
}

export function rollPool(count: number, sides: number, modifier: number) {
  const results = Array.from({ length: count }, () => rollDie(sides));
  const total = results.reduce((acc, value) => acc + value, 0) + modifier;
  return { results, total };
}

function getManifestation(tier: PaschTier, value: number): PaschEntry {
  const entry = paschManifestations[tier].find((item) => value >= item.min && value <= item.max);
  return entry ?? paschManifestations[tier][paschManifestations[tier].length - 1];
}

export function rollPasch(initialTier: PaschTier) {
  const chain: { tier: PaschTier; value: number; manifestation: PaschEntry }[] = [];
  let tier: PaschTier = initialTier;

  while (true) {
    const value = rollDie(100);
    const manifestation = getManifestation(tier, value);
    chain.push({ tier, value, manifestation });

    if (value < 96) break;
    if (tier === "schwach") {
      tier = "stark";
      continue;
    }
    if (tier === "stark") {
      tier = "katastrophal";
      continue;
    }
    break;
  }

  return chain;
}
