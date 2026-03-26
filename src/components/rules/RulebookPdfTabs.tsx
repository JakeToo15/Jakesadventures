"use client";

import { useState } from "react";

type RulebookTab = {
  id: string;
  label: string;
  file: string;
};

const rulebookTabs: RulebookTab[] = [
  { id: "main", label: "Main Rules", file: "/rulebooks/warhammer-rules.pdf" },
  { id: "travel", label: "Travel Distances", file: "/rulebooks/travel-distances.pdf" },
  { id: "learning", label: "Learning & Books", file: "/rulebooks/lernen-buecher.pdf" },
  { id: "chaos", label: "Slaves to Darkness", file: "/rulebooks/slaves-to-darkness.pdf" },
];

type Props = {
  initialSource?: string;
};

export function RulebookPdfTabs({ initialSource }: Props) {
  const requested = initialSource;
  const hasRequested = requested && rulebookTabs.some((tab) => tab.id === requested);
  const [activeId, setActiveId] = useState(hasRequested ? requested! : rulebookTabs[0].id);
  const active = rulebookTabs.find((tab) => tab.id === activeId) ?? rulebookTabs[0];

  return (
    <section className="panel p-4">
      <div className="flex flex-wrap gap-2">
        {rulebookTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveId(tab.id)}
            className={`rounded-md border px-3 py-1 text-xs ${active.id === tab.id ? "bg-blue-900 text-blue-50" : "bg-white"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-3 h-[78vh] min-h-[560px] overflow-hidden rounded border border-blue-900/25 bg-white">
        <iframe
          key={active.file}
          src={active.file}
          title={`PDF viewer ${active.label}`}
          className="h-full w-full"
        />
      </div>
    </section>
  );
}
