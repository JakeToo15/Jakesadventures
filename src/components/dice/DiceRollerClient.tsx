"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { PaschTier } from "@/content/pasch/manifestations";
import { rollPasch, rollPool } from "@/lib/dice";

type HistoryType = "standard" | "pasch";
type HistoryFilter = "all" | HistoryType;

type DiceHistoryEntry = {
  id: string;
  type: HistoryType;
  config: string;
  result: string;
  createdAt: number;
};

const DICE_HISTORY_KEY = "dice_history_v2";

export function DiceRollerClient() {
  const [count, setCount] = useState(1);
  const [sides, setSides] = useState(100);
  const [customSides, setCustomSides] = useState(12);
  const [modifier, setModifier] = useState(0);
  const [history, setHistory] = useState<DiceHistoryEntry[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(DICE_HISTORY_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as DiceHistoryEntry[];
    } catch {
      return [];
    }
  });
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [tier, setTier] = useState<PaschTier>("schwach");
  const [paschResult, setPaschResult] = useState<ReturnType<typeof rollPasch> | null>(null);
  const [paschStepIndex, setPaschStepIndex] = useState(0);
  const [rollingStandard, setRollingStandard] = useState(false);
  const [rollingPasch, setRollingPasch] = useState(false);
  const [lastDice, setLastDice] = useState<number[]>([]);

  const mostRecentStandard = useMemo(
    () => history.find((entry) => entry.type === "standard"),
    [history],
  );
  const filteredHistory = useMemo(
    () => history.filter((entry) => historyFilter === "all" || entry.type === historyFilter),
    [history, historyFilter],
  );
  const activePaschStep = paschResult?.[paschStepIndex] ?? null;
  const overflow = Boolean(
    paschResult &&
      paschResult.length > 0 &&
      paschResult[paschResult.length - 1].tier === "katastrophal" &&
      paschResult[paschResult.length - 1].value >= 96,
  );

  function persistHistory(next: DiceHistoryEntry[]) {
    setHistory(next);
    localStorage.setItem(DICE_HISTORY_KEY, JSON.stringify(next));
  }

  function getCriticalTag(value: number) {
    if (value === 1) return "Critical Success (01)";
    if (value === 100) return "Critical Fail (100/00)";
    return null;
  }

  function onRollStandard() {
    const effectiveSides = sides === -1 ? Math.max(2, customSides) : sides;
    setRollingStandard(true);
    const result = rollPool(count, effectiveSides, modifier);
    setLastDice(result.results);

    const marker = count === 1 ? getCriticalTag(result.results[0]) : null;
    const breakdown = count > 1 ? `${result.results.join(" + ")} ${modifier ? `${modifier >= 0 ? "+" : "-"} ${Math.abs(modifier)}` : ""}` : "";
    const resultText =
      count > 1
        ? `Total ${result.total}${marker ? ` | ${marker}` : ""} (breakdown: ${breakdown.trim()})`
        : `Total ${result.total}${marker ? ` | ${marker}` : ""}`;
    const entry: DiceHistoryEntry = {
      id: `std-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: "standard",
      config: `${count} x d${effectiveSides}, modifier ${modifier >= 0 ? `+${modifier}` : modifier}`,
      result: resultText,
      createdAt: Date.now(),
    };
    persistHistory([entry, ...history].slice(0, 80));
    window.setTimeout(() => setRollingStandard(false), 420);
  }

  function onRollPasch() {
    setRollingPasch(true);
    const chain = rollPasch(tier);
    setPaschResult(chain);
    setPaschStepIndex(0);
    const hasOverflow =
      chain[chain.length - 1].tier === "katastrophal" &&
      chain[chain.length - 1].value >= 96;

    const last = chain[chain.length - 1];
    const entry: DiceHistoryEntry = {
      id: `pasch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: "pasch",
      config: `Tier ${tier}`,
      result: `Final: ${last.tier} ${last.value} - ${last.manifestation.title}${hasOverflow ? " | Overflow" : ""}`,
      createdAt: Date.now(),
    };
    persistHistory([entry, ...history].slice(0, 80));
    window.setTimeout(() => setRollingPasch(false), 620);
  }

  return (
    <div className="space-y-6">
      <section className="panel noble-card space-y-4 p-5">
        <h2 className="rune-title text-sm text-blue-900">Standard Roller</h2>
        <div className="flex flex-wrap gap-2 text-xs">
          {[4, 6, 10, 20, 100].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setSides(preset)}
              className={`rounded border px-3 py-1 ${sides === preset ? "bg-blue-900 text-blue-50" : "bg-white"}`}
            >
              D{preset}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSides(-1)}
            className={`rounded border px-3 py-1 ${sides === -1 ? "bg-blue-900 text-blue-50" : "bg-white"}`}
          >
            DX
          </button>
          {sides === -1 && (
            <input
              className="w-24 rounded border px-2 py-1"
              type="number"
              min={2}
              max={999}
              value={customSides}
              onChange={(e) => setCustomSides(Number(e.target.value))}
            />
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm sm:max-w-md">
          <label className="space-y-1">
            <span>Count</span>
            <input className="w-full rounded border px-2 py-1" type="number" min={1} max={12} value={count} onChange={(e) => setCount(Number(e.target.value))} />
          </label>
          <label className="space-y-1">
            <span>Modifier</span>
            <input className="w-full rounded border px-2 py-1" type="number" value={modifier} onChange={(e) => setModifier(Number(e.target.value))} />
          </label>
        </div>
        <button onClick={onRollStandard} className="btn-accent rounded px-4 py-2">
          Roll d{sides === -1 ? Math.max(2, customSides) : sides}
        </button>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {(lastDice.length ? lastDice : [100]).slice(0, 12).map((value, index) => (
            <motion.div
              key={`${value}-${index}`}
              animate={
                rollingStandard
                  ? { rotate: [0, 22, -18, 12, -6, 0], y: [0, -10, 0], scale: [1, 1.03, 1] }
                  : { rotate: 0, y: 0, scale: 1 }
              }
              transition={{ duration: 0.86, ease: "easeOut", delay: index * 0.04 }}
              className="die2d-wrap"
            >
              <div className="die2d-face">
                <span>{value === 100 ? "00" : value}</span>
              </div>
            </motion.div>
          ))}
        </div>
        {mostRecentStandard && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded border border-blue-900/30 bg-white/80 p-3 text-sm"
          >
            <p className="font-bold">{mostRecentStandard.config}</p>
            <p>{mostRecentStandard.result}</p>
          </motion.div>
        )}
      </section>

      <section className="panel noble-card relative space-y-4 overflow-hidden p-5">
        <div className="chaos-aura" />
        <h2 className="rune-title text-sm text-blue-900">Pasch Roller (Chaos)</h2>
        <label className="space-y-1 text-sm">
          <span>Tier</span>
          <select className="w-full rounded border px-2 py-1" value={tier} onChange={(e) => setTier(e.target.value as PaschTier)}>
            <option value="schwach">Weak</option>
            <option value="stark">Strong</option>
            <option value="katastrophal">Catastrophic</option>
          </select>
        </label>
        <button onClick={onRollPasch} className="btn-secondary rounded px-4 py-2">
          Invoke Chaos (d100)
        </button>
        {paschResult && activePaschStep && (
          <div className="space-y-3">
            <motion.article
              key={`${activePaschStep.tier}-${paschStepIndex}`}
              initial={{ opacity: 0.85, scale: 0.98, y: 3 }}
              animate={
                rollingPasch
                  ? { opacity: 1, scale: [1, 1.015, 1], y: [3, 0, 0] }
                  : { opacity: 1, scale: 1, y: 0 }
              }
              transition={{ duration: 0.38 }}
              className={`chaos-card rounded border p-4 text-sm ${
                activePaschStep.tier === "schwach"
                  ? "chaos-weak"
                  : activePaschStep.tier === "stark"
                    ? "chaos-strong"
                    : "chaos-cat"
              }`}
            >
              <p className="rune-title text-xs text-red-900">GM Narration / {activePaschStep.tier}</p>
              <p className="mt-1 text-base font-bold">
                Roll {activePaschStep.value}: {activePaschStep.manifestation.title}
              </p>
              <p className="mt-1">{activePaschStep.manifestation.effect}</p>
              {activePaschStep.value >= 96 && activePaschStep.tier !== "katastrophal" && (
                <p className="mt-2 text-xs font-semibold text-red-800">
                  The weave tears further. Escalate and roll on the next tier.
                </p>
              )}
            </motion.article>
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                className="rounded border px-3 py-1 disabled:opacity-40"
                disabled={paschStepIndex === 0}
                onClick={() => setPaschStepIndex((prev) => Math.max(prev - 1, 0))}
              >
                Previous Step
              </button>
              <p>
                Step {paschStepIndex + 1} / {paschResult.length}
              </p>
              <button
                type="button"
                className="rounded border px-3 py-1 disabled:opacity-40"
                disabled={paschStepIndex >= paschResult.length - 1}
                onClick={() => setPaschStepIndex((prev) => Math.min(prev + 1, paschResult.length - 1))}
              >
                Next Step
              </button>
            </div>
            {overflow && (
              <div className="rounded border border-red-950/50 bg-red-950 text-red-100 p-3 text-sm">
                <p className="font-semibold">Overflow Event</p>
                <p className="text-xs">
                  Catastrophic 96-100. Reality fractures beyond table definitions. GM may trigger a custom apocalyptic scene.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="panel noble-card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="rune-title text-sm text-blue-900">Roll History</h3>
          <button
            type="button"
            onClick={() => setHistoryFilter("all")}
            className={`rounded-full border px-3 py-1 text-xs ${historyFilter === "all" ? "bg-blue-900 text-blue-50" : "bg-white"}`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setHistoryFilter("standard")}
            className={`rounded-full border px-3 py-1 text-xs ${historyFilter === "standard" ? "bg-blue-900 text-blue-50" : "bg-white"}`}
          >
            Standard
          </button>
          <button
            type="button"
            onClick={() => setHistoryFilter("pasch")}
            className={`rounded-full border px-3 py-1 text-xs ${historyFilter === "pasch" ? "bg-blue-900 text-blue-50" : "bg-white"}`}
          >
            Pasch
          </button>
          <button
            type="button"
            className="ml-auto rounded border border-red-700 px-3 py-1 text-xs text-red-700"
            onClick={() => persistHistory([])}
          >
            Clear all
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {filteredHistory.map((item) => (
            <article key={item.id} className="rounded border border-blue-900/20 bg-white/80 p-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{item.type.toUpperCase()}</p>
                <button
                  type="button"
                  className="rounded border border-red-700 px-2 py-0.5 text-red-700"
                  onClick={() => persistHistory(history.filter((entry) => entry.id !== item.id))}
                >
                  delete
                </button>
              </div>
              <p className="mt-1">Config: {item.config}</p>
              <p>Result: {item.result}</p>
            </article>
          ))}
          {filteredHistory.length === 0 && <p className="text-xs opacity-70">No history entries for this filter.</p>}
        </div>
      </section>
    </div>
  );
}
