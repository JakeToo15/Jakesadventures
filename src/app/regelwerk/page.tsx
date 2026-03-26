import { RulebookPdfTabs } from "@/components/rules/RulebookPdfTabs";
import { RulesSearchClient } from "@/components/rules/RulesSearchClient";

type Props = {
  searchParams: Promise<{ source?: string }>;
};

export default async function RegelwerkPage({ searchParams }: Props) {
  const { source } = await searchParams;
  return (
    <div className="space-y-6">
      <section className="panel noble-hero p-6">
        <h1 className="rune-title text-xl text-blue-900">Rules Library</h1>
        <p className="mt-2">
          Read the full rulebooks directly in tabs. Original PDF layout and graphics are preserved in the embedded viewer.
        </p>
      </section>

      <RulebookPdfTabs initialSource={source} />
      <RulesSearchClient />
    </div>
  );
}
