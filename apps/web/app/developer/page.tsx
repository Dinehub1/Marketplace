import type { Metadata } from "next";
import Link from "next/link";
import { APPS, PUBLISHER } from "./catalog";

/**
 * apps.dropby.co.in — the developer website Play Console and AdMob both point at.
 *
 * This is the page a Play reviewer opens from the developer profile and the page AdMob
 * crawls for `app-ads.txt`. Both need the same three things, so they are stated plainly
 * rather than buried: who publishes these apps, that they show ads, and where the
 * privacy policy lives.
 */
export const metadata: Metadata = {
  title: `${PUBLISHER.name} — Apps`,
  description: `${APPS.length} Android and iOS apps published by ${PUBLISHER.name}, including a wellness app, document and photo tools, an Indore business directory, and puzzle games.`,
  alternates: { canonical: PUBLISHER.site },
};

export default function DeveloperHome() {
  const products = APPS.filter((a) => !["sarkarhealth", "sarkarmarketplace", "sarkarcars", "tap-sprint", "word-duel", "block-clear", "merge-tiles"].includes(a.id));
  const directory = APPS.filter((a) => ["sarkarhealth", "sarkarmarketplace", "sarkarcars"].includes(a.id));
  const games = APPS.filter((a) => ["tap-sprint", "word-duel", "block-clear", "merge-tiles"].includes(a.id));

  const groups = [
    { title: "Everyday tools", apps: products },
    { title: "Indore directory", apps: directory },
    { title: "Puzzle games", apps: games },
  ];

  return (
    <main className="section">
      <div className="container-narrow">
        <span className="badge badge-info">Developer</span>
        <h1 className="heading-xl mt-4">{PUBLISHER.name}</h1>
        <p className="text-ink-2 mt-3" style={{ maxWidth: "60ch" }}>
          We build small, offline-first apps for phones — tools that do one job properly,
          a directory of local businesses in Indore, and a few puzzle games. Based in{" "}
          {PUBLISHER.jurisdiction}.
        </p>

        <p className="text-ink-2 mt-3" style={{ maxWidth: "60ch" }}>
          <strong>{APPS.length} apps</strong> are published under this account. Some of them are
          supported by advertising, and every one of them says so in its store listing and in
          its own privacy policy.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/privacy" className="badge badge-brand">
            Privacy policy
          </Link>
          <a href="/app-ads.txt" className="badge badge-neutral">
            app-ads.txt
          </a>
          <a href={`mailto:${PUBLISHER.contactEmail}`} className="badge badge-neutral">
            {PUBLISHER.contactEmail}
          </a>
        </div>
      </div>

      <div className="container-narrow mt-12">
        {groups.map((group) => (
          <section key={group.title} className="mb-10">
            <h2 className="heading-md mb-4">{group.title}</h2>
            <ul className="grid gap-3" style={{ listStyle: "none", padding: 0 }}>
              {group.apps.map((app) => (
                <li key={app.id} className="card" style={{ padding: "1rem 1.25rem" }}>
                  <p className="font-[580]">{app.name}</p>
                  <p className="text-ink-2 text-sm mt-1">{app.blurb}</p>
                  <p className="text-ink-3 text-xs mt-2" style={{ fontFamily: "var(--font-mono, monospace)" }}>
                    {app.bundleId} · {app.platform}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="container-narrow mt-6">
        <div className="card" style={{ padding: "1.25rem" }}>
          <h2 className="heading-sm mb-2">About advertising in these apps</h2>
          <p className="text-ink-2 text-sm">
            Some apps in this catalogue are free and supported by ads. Those apps use the Google
            AdMob SDK, which may collect a device advertising identifier and approximate
            information in order to select and measure ads. Where local law requires it, the app
            asks for consent before any personalised advertising, and you can decline and keep
            using the app. Paid options are always available as an alternative.
          </p>
          <p className="text-ink-2 text-sm mt-3">
            Full detail, including what each app does and does not collect, is in the{" "}
            <Link href="/privacy" style={{ textDecoration: "underline" }}>
              privacy policy
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
