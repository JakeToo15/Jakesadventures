import Link from "next/link";
import { SessionOverviewClient } from "@/components/home/SessionOverviewClient";
import { LandingAmbient } from "@/components/landing/LandingAmbient";

export default function Home() {
  return (
    <div className="space-y-7">
      <section className="panel noble-hero relative overflow-hidden p-8 sm:p-12">
        <LandingAmbient />
        <div className="relative z-10">
          <p className="rune-title text-sm text-blue-950">Jakes Adventures</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-blue-950 sm:text-5xl">
            Helden von La Maisontaal
          </h1>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/characters" className="btn-accent rounded-md px-5 py-2">
              Open Character Sheets
            </Link>
            <Link href="/me" className="rounded-md border border-blue-900/40 bg-white px-5 py-2 text-blue-900">
              Open My Profile
            </Link>
            <Link href="/gm" className="rounded-md border border-blue-900/40 bg-blue-100 px-5 py-2 text-blue-900">
              Open GM Tools
            </Link>
            <Link href="/regelwerk" className="rounded-md border border-blue-900/40 bg-blue-950 px-5 py-2 text-blue-50">
              Open Rules
            </Link>
            <Link href="/dice" className="rounded-md border border-blue-900/40 bg-white px-5 py-2 text-blue-900">
              Open Dice
            </Link>
          </div>
        </div>
      </section>

      <SessionOverviewClient />
    </div>
  );
}
