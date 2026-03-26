"use client";

import Link from "next/link";
import { useState } from "react";
import { getRulebook } from "@/lib/rules";

type ViewedItem = {
  sourceId: string;
  page: number;
  timestamp: number;
};

const STORAGE_KEY = "rules_recent_pages";

export function RulesRecentlyViewedClient() {
  const [items] = useState<ViewedItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as ViewedItem[];
      return parsed.slice(0, 6);
    } catch {
      return [];
    }
  });

  return (
    <section className="panel p-5">
      <h2 className="rune-title text-sm text-blue-900">Featured Rules (Latest Viewed)</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {items.length === 0 && (
          <p className="text-sm opacity-80">No viewed rule pages yet. Open a source page to populate this feed.</p>
        )}
        {items.map((item) => {
          const source = getRulebook(item.sourceId);
          if (!source) return null;
          return (
            <Link
              key={`${item.sourceId}-${item.page}-${item.timestamp}`}
              href={`/regelwerk/quellen/${item.sourceId}/page/${item.page}`}
              className="rounded border border-blue-900/30 bg-white/75 p-3 text-sm hover:bg-blue-50"
            >
              <p className="font-semibold text-blue-950">{source.title}</p>
              <p className="text-xs">Page {item.page}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
