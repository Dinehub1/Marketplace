import type { Metadata } from "next";
import Link from "next/link";
import { AD_SDKS, APPS, APPS_WITH_ADS, PUBLISHER } from "../catalog";

/**
 * apps.dropby.co.in/privacy — the policy that must exist before an ad SDK ships.
 *
 * AdMob, Play and the App Store each require a reachable privacy policy URL, and the
 * research is blunt that a missing or vague one is a finding rather than a formality.
 * It is written to be *checkable* against what the apps actually do, so it names the ad
 * SDK, separates the apps that use one from the apps that do not, and states plainly
 * what happens if a user declines consent.
 *
 * Sections marked with the ad disclosure are the ones a reviewer looks for. They are
 * last-updated by hand; the app list is not, because it comes from the same catalogue
 * the developer home page renders.
 */

export const metadata: Metadata = {
  title: `Privacy Policy — ${PUBLISHER.name}`,
  description: `How ${PUBLISHER.name} apps handle data, including advertising, consent and your choices.`,
  alternates: { canonical: `${PUBLISHER.site}/privacy` },
};

const LAST_UPDATED = "19 September 2026";

export default function DeveloperPrivacy() {
  const adApps = APPS.filter((a) => APPS_WITH_ADS.includes(a.bundleId));

  return (
    <main className="section">
      <div className="container-narrow">
        <span className="badge badge-info">Legal</span>
        <h1 className="heading-xl mt-4">Privacy Policy</h1>
        <p className="text-ink-3 mt-2 text-sm">Last updated: {LAST_UPDATED}</p>

        <p className="text-ink-2 mt-5">
          This policy covers every mobile application published by {PUBLISHER.name} under the
          developer account that links to {PUBLISHER.site}, and this website itself. It explains
          what is collected, why, who it is shared with, and what you can do about it.
        </p>

        <h2 className="heading-md mt-10 mb-3">1. The short version</h2>
        <ul className="text-ink-2" style={{ lineHeight: 1.7 }}>
          <li>Most of our apps do their work <strong>on your device</strong>. Files you choose are not uploaded unless the app says so before you start.</li>
          <li>Some apps are free and supported by <strong>advertising</strong>. Those apps are listed in section 4.</li>
          <li>We do not sell your personal information.</li>
          <li>You can use every app without an account. There is no sign-up for the tools and games.</li>
        </ul>

        <h2 className="heading-md mt-10 mb-3">2. What we collect</h2>
        <p className="text-ink-2">
          <strong>Information you give us.</strong> When you use a tool that processes a file, the
          file is sent to our server only if the app tells you it will be, and it is deleted after
          the job. When you submit a form — for example an enquiry to a business listed in the
          Indore directory — we receive what you typed: your name, phone number and message.
        </p>
        <p className="text-ink-2 mt-3">
          <strong>Information created by using an app.</strong> Apps that keep progress (a
          breathing streak, a game score, a saved business) store it on your device. Where a
          feature syncs, the app assigns your installation a random identifier so it can tell your
          records apart from another person&rsquo;s; it is not linked to your name, phone number or
          any account, and we cannot use it to identify you.
        </p>
        <p className="text-ink-2 mt-3">
          <strong>Diagnostic information.</strong> When an app talks to our server, our server
          records technical detail about the request — the type of job, whether it succeeded, and
          error codes. This is used to fix faults and is not used to build a profile of you.
        </p>

        <h2 className="heading-md mt-10 mb-3">3. What we do not collect</h2>
        <ul className="text-ink-2" style={{ lineHeight: 1.7 }}>
          <li>We do not ask for or store your contacts, your calendar, or your SMS messages.</li>
          <li>We do not access your camera, microphone, photos or files unless you choose a feature that needs it, and only for that feature.</li>
          <li>We do not collect precise location. The directory apps sort by what you search for, not by where you are.</li>
          <li>We do not create accounts, and we do not ask for a password anywhere.</li>
        </ul>

        <h2 className="heading-md mt-10 mb-3">4. Advertising</h2>
        <p className="text-ink-2">
          Some of our apps are free to use and supported by advertising. In those apps the{" "}
          <strong>Google AdMob SDK</strong> may collect and process:
        </p>
        <ul className="text-ink-2" style={{ lineHeight: 1.7 }}>
          <li>your device&rsquo;s advertising identifier (Android Advertising ID / iOS IDFA), where you have allowed it;</li>
          <li>approximate, non-precise information such as device model, operating-system version, language and general region;</li>
          <li>which ads were shown and interacted with, so that advertisers can measure and we can be paid.</li>
        </ul>
        <p className="text-ink-2 mt-3">
          This is used to select and measure advertising. It is not used by us to identify you
          personally, and we never see your name attached to it.
        </p>

        <table className="card mt-4" style={{ width: "100%", padding: "1rem", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", paddingBottom: 6 }}>SDK</th>
              <th style={{ textAlign: "left", paddingBottom: 6 }}>Used for</th>
              <th style={{ textAlign: "left", paddingBottom: 6 }}>Their policy</th>
            </tr>
          </thead>
          <tbody>
            {AD_SDKS.map((sdk) => (
              <tr key={sdk.name}>
                <td style={{ paddingTop: 4 }}>{sdk.name}</td>
                <td style={{ paddingTop: 4 }}>{sdk.purpose}</td>
                <td style={{ paddingTop: 4 }}>
                  <a href={sdk.policy} style={{ textDecoration: "underline" }} rel="noreferrer noopener" target="_blank">
                    Open
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className="heading-sm mt-6 mb-2">Your choices about advertising</h3>
        <ul className="text-ink-2" style={{ lineHeight: 1.7 }}>
          <li>Where the law requires it, the app asks for your consent <strong>before</strong> any personalised advertising, and you may refuse.</li>
          <li>On iOS, the app asks for tracking permission. Declining means you get non-personalised ads; the app continues to work fully.</li>
          <li>You can reset or delete your advertising identifier at any time in your device settings (Android: Settings → Privacy → Ads; iOS: Settings → Privacy &amp; Security → Tracking).</li>
          <li>Free apps always offer a paid alternative, so you are never forced to watch an advertisement to use the app.</li>
        </ul>
        <p className="text-ink-2 mt-3">
          Apps in this catalogue that currently include an advertising SDK:{" "}
          {adApps.length > 0 ? adApps.map((a) => a.name).join(", ") : "none at this time"}. The
          remaining apps — including the wellness app and the directory apps — contain no
          advertising SDK.
        </p>

        <h2 className="heading-md mt-10 mb-3">5. Sharing</h2>
        <p className="text-ink-2">
          We share information only in these cases: with the advertising provider named in section 4,
          where an app shows ads; with our hosting and infrastructure providers, who process data on
          our instructions; and where we are legally required to. We do not sell personal
          information, and we do not share your phone number with anyone other than the business you
          chose to contact.
        </p>

        <h2 className="heading-md mt-10 mb-3">6. Children</h2>
        <p className="text-ink-2">
          Our apps are not directed at children. We do not knowingly collect personal information
          from children. If you believe a child has provided us with personal information, contact us
          and we will delete it. Apps in this catalogue do not participate in the Google Play
          Families programme and are not designed for use by children.
        </p>

        <h2 className="heading-md mt-10 mb-3">7. Security and retention</h2>
        <p className="text-ink-2">
          Files sent for processing are removed from our server after the job completes. Records of
          jobs are kept without the file itself, so we can answer &ldquo;did this run&rdquo; and
          &ldquo;what did it cost&rdquo;. Directory enquiries are kept for as long as needed to
          connect you with the business and to keep the listing accurate. Data in transit is
          encrypted. No system is perfectly secure, and we cannot promise absolute security.
        </p>

        <h2 className="heading-md mt-10 mb-3">8. Your rights</h2>
        <p className="text-ink-2">
          You may ask us what personal information we hold about you, ask for a copy, ask us to
          correct it, or ask us to delete it. Write to{" "}
          <a href={`mailto:${PUBLISHER.contactEmail}`} style={{ textDecoration: "underline" }}>
            {PUBLISHER.contactEmail}
          </a>{" "}
          and we will respond within 30 days. If you are in a region with a data-protection law —
          for example the GDPR in Europe or the DPDP Act in India — you have the rights that law
          gives you, and we will honour a request made in the same way.
        </p>

        <h2 className="heading-md mt-10 mb-3">9. Changes</h2>
        <p className="text-ink-2">
          If this policy changes, the date at the top changes with it. Material changes will be
          reflected in the affected app&rsquo;s store listing.
        </p>

        <h2 className="heading-md mt-10 mb-3">10. Contact</h2>
        <p className="text-ink-2">
          {PUBLISHER.name}, {PUBLISHER.jurisdiction}. Email{" "}
          <a href={`mailto:${PUBLISHER.contactEmail}`} style={{ textDecoration: "underline" }}>
            {PUBLISHER.contactEmail}
          </a>
          .
        </p>

        <p className="text-ink-3 text-sm mt-10">
          <Link href="/" style={{ textDecoration: "underline" }}>
            ← All apps by {PUBLISHER.name}
          </Link>
        </p>
      </div>
    </main>
  );
}
