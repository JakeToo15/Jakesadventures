export type PaschTier = "schwach" | "stark" | "katastrophal";

export type PaschEntry = {
  min: number;
  max: number;
  title: string;
  effect: string;
};

export const paschManifestations: Record<PaschTier, PaschEntry[]> = {
  schwach: [
    { min: 1, max: 10, title: "Hexerei", effect: "Milch gerinnt, Wein wird sauer, Essen verdirbt." },
    { min: 11, max: 20, title: "Nasenbluten", effect: "Runde: evtl. 1 Wurf Nasenbluten." },
    { min: 21, max: 30, title: "Odem des Chaos", effect: "Unnatürlicher kalter Wind zieht auf." },
    { min: 31, max: 40, title: "Schreckenshauch", effect: "In 1W10 Runden frieren Berge im Blickfeld." },
    { min: 41, max: 50, title: "Irrlicht", effect: "Im Umkreis von 10 Schritt erscheint ein geisterhaftes Licht." },
    { min: 51, max: 60, title: "Unnatürliche Aura", effect: "Tiere werden aufgeschreckt; evtl. Flucht." },
    { min: 61, max: 70, title: "Spuk", effect: "Geisterhafte Stimmen hängen in der Luft." },
    { min: 71, max: 80, title: "Ätherock", effect: "Energien drücken auf den Zaubernden." },
    { min: 81, max: 90, title: "Zauberblock", effect: "Magieenergie kanalisiert, Magiewert sinkt kurzfristig." },
    { min: 91, max: 95, title: "Chaotischer Willkuer", effect: "SL wählt kurzzeitigen Effekt." },
    { min: 96, max: 100, title: "Pech gehabt", effect: "Eskalation auf starke Manifestation." },
  ],
  stark: [
    { min: 1, max: 10, title: "Hexenaugen", effect: "Pupillen blutrot bis zum Morgengrauen." },
    { min: 11, max: 20, title: "Mundtot", effect: "Stimme setzt fuer 1W10 Runden aus." },
    { min: 21, max: 30, title: "Ausladung", effect: "Vertraute Energien ueberladen und betaeuben." },
    { min: 31, max: 40, title: "Angstherren", effect: "Dunkle Gestalt taucht auf und verschwindet." },
    { min: 41, max: 50, title: "Blick ins Chaos", effect: "Kurzzeitiger Einblick in dunkles Wissen." },
    { min: 51, max: 60, title: "Aetherangriff", effect: "Kraftverlust unabhaengig von Ruestung." },
    { min: 61, max: 70, title: "Schwaeche", effect: "Widerstand sinkt fuer Minuten." },
    { min: 71, max: 80, title: "Gedankenleere", effect: "Magie sinkt fuer 2-4 Stunden." },
    { min: 81, max: 90, title: "Daemonische Besessenheit", effect: "Ein Daemon uebernimmt kurz Kontrolle." },
    { min: 91, max: 95, title: "Perverse Freude", effect: "SL waehlt Effekt nach Gutduenken." },
    { min: 96, max: 100, title: "Schicksalswuerfel", effect: "Eskalation auf katastrophale Manifestation." },
  ],
  katastrophal: [
    { min: 1, max: 10, title: "Wilde Magie", effect: "Kontrollverlust, alle in Reichweite verlieren Lebenspunkt." },
    { min: 11, max: 20, title: "Auge des Chaos", effect: "Widerstand sinkt stark, Schlaege summieren." },
    { min: 21, max: 30, title: "Tzeentchs Peitschenhiebe", effect: "Geistige Schlaege, hoher psychischer Druck." },
    { min: 31, max: 40, title: "Aetherischer Ansturm", effect: "Kritischer Treffer auf zufaelliges Ziel." },
    { min: 41, max: 50, title: "Haeretische Vision", effect: "Dunkle Lehre lockt, hoher Warp-Einsatz moeglich." },
    { min: 51, max: 60, title: "Hirnrand", effect: "INT sinkt und regeneriert langsam." },
    { min: 61, max: 70, title: "Ungebetene Geister", effect: "Daemonaura im Umkreis." },
    { min: 71, max: 80, title: "Daemonenpakt", effect: "Massiver Lebenspunktverlust und Siegel-Folgen." },
    { min: 81, max: 90, title: "In die Leere gerufen", effect: "Seele an das Chaos gebunden." },
    { min: 91, max: 100, title: "Finstere Inspiration", effect: "SL waehlt massiven Story-Effekt." },
  ],
};
