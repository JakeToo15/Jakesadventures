import { MapViewerClient } from "@/components/maps/MapViewerClient";

export default function MapsPage() {
  return (
    <div className="space-y-6">
      <section className="panel noble-hero p-6">
        <h1 className="rune-title text-xl text-blue-900">World Maps</h1>
        <p className="mt-2">
          Pan and zoom your campaign map directly in the browser.
        </p>
      </section>
      <MapViewerClient />
    </div>
  );
}
