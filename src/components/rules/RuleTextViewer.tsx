"use client";

import { useState } from "react";

type Props = {
  text: string;
};

export function RuleTextViewer({ text }: Props) {
  const [mode, setMode] = useState<"compact" | "comfort">("comfort");

  return (
    <section className="panel p-5">
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMode("compact")}
          className={`rounded border px-3 py-1 text-xs ${mode === "compact" ? "bg-blue-900 text-blue-50" : "bg-white"}`}
        >
          Compact
        </button>
        <button
          type="button"
          onClick={() => setMode("comfort")}
          className={`rounded border px-3 py-1 text-xs ${mode === "comfort" ? "bg-blue-900 text-blue-50" : "bg-white"}`}
        >
          Comfort
        </button>
      </div>
      <pre className={mode === "compact" ? "rule-text-compact" : "rule-text-comfort"}>
        {text.trim() || "[This page has no readable extracted text]"}
      </pre>
    </section>
  );
}
