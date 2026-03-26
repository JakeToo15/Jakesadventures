import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const rulebooksPath = path.join(root, "src", "content", "rules", "generated", "rulebooks.generated.json");
const outPath = path.join(root, "src", "content", "rules", "generated", "categories.generated.json");

const payload = JSON.parse(fs.readFileSync(rulebooksPath, "utf8"));

const categories = [
  { slug: "charaktere-attribute", name: "Characters & Attributes", source: "All Sources", entries: [] },
  { slug: "wuerfel-tests-modifikatoren", name: "Dice, Tests & Modifiers", source: "All Sources", entries: [] },
  { slug: "kampf", name: "Combat", source: "All Sources", entries: [] },
  { slug: "magie", name: "Magic", source: "All Sources", entries: [] },
  { slug: "reisen-distanzen", name: "Travel & Distances", source: "All Sources", entries: [] },
  { slug: "lernen-buecher", name: "Learning & Books", source: "All Sources", entries: [] },
  { slug: "chaos-manifestationen", name: "Chaos & Manifestations", source: "All Sources", entries: [] },
];

const keywordMap = [
  { slug: "magie", re: /\b(spell|magic|wizard|mps|casting|channel|aether)\b/i },
  { slug: "kampf", re: /\b(combat|weapon|ws\b|bs\b|attack|damage|armour|wounds)\b/i },
  { slug: "reisen-distanzen", re: /\b(miles|road|river|sea|travel|route|distance)\b/i },
  { slug: "lernen-buecher", re: /\b(lernen|buch|book|reading|skill|exppts|talent)\b/i },
  { slug: "chaos-manifestationen", re: /\b(chaos|daemonic|daemon|manifestation|pasch|tzeentch)\b/i },
  { slug: "wuerfel-tests-modifikatoren", re: /\b(d100|d20|d10|dice|roll|modifier|test)\b/i },
  { slug: "charaktere-attribute", re: /\b(character|characteristic|movement|initiative|fellowship|int|wp)\b/i },
];

function classifyText(text) {
  for (const item of keywordMap) {
    if (item.re.test(text)) return item.slug;
  }
  return "charaktere-attribute";
}

for (const book of payload.rulebooks) {
  if (!book.available) continue;
  for (const page of book.pages) {
    const text = String(page.text || "").trim();
    if (!text) continue;
    const slug = classifyText(text);
    const category = categories.find((c) => c.slug === slug);
    if (!category) continue;
    category.entries.push({
      id: `${book.id}-${page.page}`,
      title: `${book.title} - Page ${page.page}`,
      sourceId: book.id,
      sourceTitle: book.title,
      page: page.page,
      text,
    });
  }
}

fs.writeFileSync(outPath, JSON.stringify({ categories }));
console.log(`Wrote ${outPath}`);
