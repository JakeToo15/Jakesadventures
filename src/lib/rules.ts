import data from "@/content/rules/generated/rulebooks.generated.json";

export type RulePage = { page: number; text: string };
export type Rulebook = {
  id: string;
  title: string;
  path: string;
  primary: boolean;
  available: boolean;
  pages: RulePage[];
};
export type RuleChapter = {
  index: number;
  title: string;
  startPage: number;
  endPage: number;
  pages: number[];
};

export const rulebooks = data.rulebooks as Rulebook[];

export function getRulebook(id: string) {
  return rulebooks.find((book) => book.id === id);
}

export function nonEmptyPageCount(book: Rulebook) {
  return book.pages.filter((p) => p.text.trim().length > 0).length;
}

function extractChapterMarker(text: string): string | null {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (/^(CHAPTER|CH\.)\s*[0-9IVX]+/i.test(line)) return line;
    if (/^CHAPTER\s+[0-9IVX]+:/i.test(line)) return line;
  }

  for (const line of lines.slice(0, 8)) {
    if (line.length > 7 && line.length < 80 && /^[A-Z0-9 :'.\-]+$/.test(line)) {
      return line;
    }
  }

  return null;
}

export function getRulebookChapters(sourceId: string): RuleChapter[] {
  const source = getRulebook(sourceId);
  if (!source) return [];

  const nonEmptyPages = source.pages.filter((p) => p.text.trim());
  if (nonEmptyPages.length === 0) return [];

  const markers: Array<{ page: number; title: string }> = [];
  for (const page of nonEmptyPages) {
    const marker = extractChapterMarker(page.text);
    if (marker) markers.push({ page: page.page, title: marker });
  }

  const normalizedMarkers = markers.length
    ? markers
    : [{ page: nonEmptyPages[0].page, title: "Full Source Text" }];

  const chapters: RuleChapter[] = normalizedMarkers.map((marker, index) => {
    const next = normalizedMarkers[index + 1];
    const startPage = marker.page;
    const endPage = next ? next.page - 1 : source.pages[source.pages.length - 1].page;
    const pages = source.pages
      .filter((p) => p.page >= startPage && p.page <= endPage)
      .map((p) => p.page);
    return {
      index,
      title: marker.title,
      startPage,
      endPage,
      pages,
    };
  });

  return chapters;
}

export function getRuleChapter(sourceId: string, chapterIndex: number): RuleChapter | null {
  const chapters = getRulebookChapters(sourceId);
  return chapters[chapterIndex] ?? null;
}

export function searchRules(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: Array<{ sourceId: string; sourceTitle: string; page: number; text: string }> = [];
  for (const book of rulebooks) {
    for (const p of book.pages) {
      if (!p.text) continue;
      if (p.text.toLowerCase().includes(q)) {
        results.push({
          sourceId: book.id,
          sourceTitle: book.title,
          page: p.page,
          text: p.text,
        });
      }
    }
  }

  return results.slice(0, 120);
}
