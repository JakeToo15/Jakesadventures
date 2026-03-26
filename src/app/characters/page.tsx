import { CharactersFromProfilesClient } from "@/components/characters/CharactersFromProfilesClient";

export default function CharactersPage() {
  return (
    <div className="space-y-6">
      <section className="panel noble-hero p-6">
        <h1 className="rune-title text-xl text-blue-900">Character Registry</h1>
        <p className="mt-2">Characters are generated from linked profiles.</p>
      </section>
      <CharactersFromProfilesClient />
    </div>
  );
}
