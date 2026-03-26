"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { rulebooks, searchRules } from "@/lib/rules";
const sourceToViewerTab: Record<string, string> = {
  "warhammer-rules-main": "main",
  "travel-distances-empire": "travel",
  "lernen-buecher": "learning",
  "realm-slaves-darkness": "chaos",
};


const SEARCH_HISTORY_KEY = "rules_search_history";

function highlightSnippet(text: string, query: string) {
  const normalized = text.replace(/\s+/g, " ");
  if (!query.trim()) return normalized.slice(0, 220);
  const idx = normalized.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return normalized.slice(0, 220);
  const start = Math.max(0, idx - 80);
  const end = Math.min(normalized.length, idx + query.length + 120);
  return normalized.slice(start, end);
}

function renderHighlighted(text: string, query: string) {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={`${part}-${index}`} className="rounded bg-amber-200 px-0.5">
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  );
}

export function RulesSearchClient() {
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  });
  const results = useMemo(() => searchRules(query), [query]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const timer = window.setTimeout(() => {
      setHistory((prev) => {
        const next = [q, ...prev.filter((entry) => entry.toLowerCase() !== q.toLowerCase())].slice(0, 10);
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
        return next;
      });
    }, 450);
    return () => window.clearTimeout(timer);
  }, [query]);

  return (
    <section className="panel noble-card p-5">
      <h2 className="rune-title text-sm text-blue-900">Universal Rule Search (All PDFs)</h2>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search across all loaded sources..."
        className="mt-3 w-full rounded-md border border-blue-900/30 bg-white px-3 py-2 text-sm"
      />
      {!query.trim() && (
        <p className="mt-2 text-xs opacity-80">
          Loaded sources: {rulebooks.length}. Results display unmodified PDF page text.
        </p>
      )}
      {history.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {history.map((entry) => (
            <button
              key={entry}
              type="button"
              onClick={() => setQuery(entry)}
              className="rounded-full border border-blue-900/25 bg-blue-50 px-3 py-1 text-xs text-blue-900"
            >
              {entry}
            </button>
          ))}
        </div>
      )}
      <div className="mt-3 space-y-2">
        {results.map((result) => (
          <Link
            key={`${result.sourceId}-${result.page}`}
            href={`/regelwerk?source=${sourceToViewerTab[result.sourceId] ?? "main"}`}
            className="block rounded border border-blue-900/25 bg-white/80 p-3 text-sm hover:bg-blue-50/70"
          >
            <p className="font-semibold">
              {result.sourceTitle} - Page {result.page}
            </p>
            <p className="mt-1 line-clamp-3 text-xs opacity-90">
              {renderHighlighted(highlightSnippet(result.text, query), query)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
