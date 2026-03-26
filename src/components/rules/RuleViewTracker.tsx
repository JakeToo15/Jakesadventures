"use client";

import { useEffect } from "react";

type Props = {
  sourceId: string;
  page: number;
};

const STORAGE_KEY = "rules_recent_pages";

export function RuleViewTracker({ sourceId, page }: Props) {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Array<{ sourceId: string; page: number; timestamp: number }>) : [];
      const next = [
        { sourceId, page, timestamp: Date.now() },
        ...parsed.filter((item) => !(item.sourceId === sourceId && item.page === page)),
      ].slice(0, 18);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore localStorage failures
    }
  }, [sourceId, page]);

  return null;
}
