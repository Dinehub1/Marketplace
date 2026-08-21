import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { THEME_BOOT_SCRIPT } from "@/components/theme-toggle";

/* Inter replaces Geist as the UI face. It ships a genuine variable weight axis
   (100–900), so the type scale in globals.css can ask for 540 / 620 / 760 and
   get exactly that rather than snapping to the nearest static cut — which is
   what makes the hierarchy read as designed instead of approximated.
   `cv11` (single-storey g/l disambiguation) and `ss01` are enabled on body. */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"], // optical sizing: display cuts tighten automatically
});

/* Mono is reserved for figures that must align in columns — prices, counts,
   dashboard stats — not for code. */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SarkarDash — One Platform",
  description: "All Sarkar brands on one multi-tenant platform.",
};

export const viewport: Viewport = {
  // Two values so the browser chrome (address bar, status bar) matches the page
  // in both themes instead of staying light behind a dark document.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfd" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0d" },
  ],
  colorScheme: "light dark",
  // The chrome is a translucent material that content scrolls beneath, so the
  // page must extend under the notch/home indicator rather than stopping at it.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      /* The boot script below stamps data-theme on this element before React
         hydrates, which is the whole point — anything later is a visible
         light-to-dark flash. React sees the attribute it did not render and
         warns; this tells it the difference is intentional. It suppresses the
         warning for this element's attributes only, not for its subtree. */
      suppressHydrationWarning
    >
      <head>
        {/* Applies the stored theme before first paint. Anything later produces
            a visible light-to-dark flash on every navigation. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-canvas text-ink">{children}</body>
    </html>
  );
}
