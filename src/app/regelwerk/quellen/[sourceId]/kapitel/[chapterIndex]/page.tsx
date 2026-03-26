import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ sourceId: string; chapterIndex: string }>;
};

export default async function RuleChapterPage({ params }: Props) {
  const { sourceId } = await params;
  const sourceToViewerTab: Record<string, string> = {
    "warhammer-rules-main": "main",
    "travel-distances-empire": "travel",
    "lernen-buecher": "learning",
    "realm-slaves-darkness": "chaos",
  };
  redirect(`/regelwerk?source=${sourceToViewerTab[sourceId] ?? "main"}`);
}
