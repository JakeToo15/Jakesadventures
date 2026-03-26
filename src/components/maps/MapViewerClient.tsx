"use client";

import { useState } from "react";

export function MapViewerClient() {
  const [zoom, setZoom] = useState(1);

  return (
    <section className="panel p-4">
      <div className="mb-3 flex items-center gap-2 text-xs">
        <button type="button" className="rounded border px-3 py-1" onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}>-</button>
        <p>Zoom: {(zoom * 100).toFixed(0)}%</p>
        <button type="button" className="rounded border px-3 py-1" onClick={() => setZoom((z) => Math.min(3, Number((z + 0.1).toFixed(2))))}>+</button>
        <button type="button" className="rounded border px-3 py-1" onClick={() => setZoom(1)}>Reset</button>
      </div>
      <div className="h-[75vh] overflow-auto rounded border border-blue-900/25 bg-neutral-900/90">
        <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left", width: "max-content" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/maps/Map.jpg"
            alt="World map"
            className="max-w-none"
            draggable={false}
          />
        </div>
      </div>
    </section>
  );
}
