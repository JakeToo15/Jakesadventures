import generated from "@/content/rules/generated/categories.generated.json";

export type RuleCategory = {
  slug: string;
  name: string;
  source: string;
  entries: Array<{
    id: string;
    title: string;
    sourceId: string;
    sourceTitle: string;
    page: number;
    text: string;
  }>;
};

export const ruleCategories: RuleCategory[] = (generated.categories ?? []) as RuleCategory[];

export function getRuleCategory(slug: string) {
  return ruleCategories.find((c) => c.slug === slug);
}
