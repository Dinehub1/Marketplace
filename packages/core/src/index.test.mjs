/**
 * Guards the contract both apps depend on. These are not exhaustive unit tests —
 * they pin the exact strings the web app renders and the native app must
 * reproduce, so a "harmless" refactor of a slug or a phone normaliser fails here
 * instead of silently producing two products that disagree about their own URLs.
 *
 * Run: node --test packages/core/src/index.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  slugifyCategory, categoryPath, categoryAreaPath, isCategoryPath,
  cleanBusinessName, telHref, waHref, titleize, cleanArea, formatCount,
  isPageRange, PDF_PAGES_HELP, PDF_PAGES_HINT,
} from "./index.ts";

test("category slugs are stable permalinks", () => {
  assert.equal(slugifyCategory("Furniture Store"), "furniture-store");
  assert.equal(slugifyCategory("Bed & Breakfast"), "bed-and-breakfast");
  assert.equal(categoryPath("Carpenter"), "/carpenter-in-indore");
  assert.equal(categoryAreaPath("Plumber", "Vijay Nagar"), "/plumber-in-vijay-nagar");
  assert.ok(isCategoryPath("/electrician-in-indore"));
  assert.ok(!isCategoryPath("/marketplace"));
});

test("scraped business names are cleaned identically on both platforms", () => {
  assert.equal(
    cleanBusinessName("✅Dr. Vipin Sharma | Best Urologist in Indore | Kidney Stone"),
    "Dr. Vipin Sharma",
  );
  assert.equal(cleanBusinessName("“Vishwakarma Furniture Works"), "Vishwakarma Furniture Works");
  assert.equal(cleanBusinessName("SHOUTING PLUMBERS"), "Shouting Plumbers");
  assert.equal(cleanBusinessName(null), "");
});

test("Indian phone numbers normalise the same way", () => {
  assert.equal(telHref("07974789694"), "tel:+917974789694");
  assert.equal(telHref("7974789694"), "tel:+917974789694");
  assert.equal(telHref("+91 79747 89694"), "tel:+917974789694");
  assert.equal(waHref("07974789694"), "https://wa.me/917974789694");
  assert.ok(waHref("7974789694", "hi there").endsWith("?text=hi%20there"));
});

test("junk area values are rejected, not rendered", () => {
  assert.equal(cleanArea("Carpenter in indore"), null); // a search phrase, not a locality
  assert.equal(cleanArea("testcity"), null);
  assert.equal(cleanArea("indore"), null);            // the city is rendered beside it
  assert.equal(cleanArea("Vijay Nagar"), "Vijay Nagar");
});

test("counts use Indian digit grouping", () => {
  assert.equal(formatCount(100000), "1,00,000");
  assert.equal(titleize("furniture store"), "Furniture Store");
});

/**
 * The page range is the one value both the job route and the app screen must read
 * the same way, which is why the grammar lives in this package. The accepted and
 * refused lists are measured against the live engine, not guessed: jobs 97-100 and
 * 104-111 through https://expo.dropby.co.in/api/job, plus the pdfcpu binary itself
 * for the combinations (page lists read back with `pdfcpu info`).
 */
test("a page range the app offers is the one the engine runs", () => {
  const accepted = [
    "1", "1-3", "1,2", "1-", "-4", "-1", "odd", "even", "l", "l-3", "3-", "1-3,7", "1-3,7,!4", "2-l-1",
    // Exclusions ride on an inclusion; measured page lists for a 5-page file:
    // 1-,!5 -> 1,2,3,4 · odd,n1 -> 3,5 · even,!2 -> 4 · l-3- -> 2..5 · -l-3 -> 1,2
    "1-,!5", "odd,n1", "even,!2", "l-3-", "-l-3",
  ];
  for (const v of accepted) assert.equal(isPageRange(v), true, `"${v}" must pass — the engine runs it`);

  const refused = ["abc", "1;2", "1--2", "1.5", "1 - 3"];
  for (const v of refused) assert.equal(isPageRange(v), false, `"${v}" must fail — pdfcpu calls it a syntax error`);

  // "" is not a range: the route treats a missing `pages` as "all pages" and the
  // screen as "the user did not narrow it", so the grammar refuses it here.
  assert.equal(isPageRange(""), false);

  // Valid grammar that selects nothing: the *engine* refuses these (pdfcpu aborts
  // with `missing page numbers` and writes a 0-byte file), not this function — so
  // the screen sends them and the engine's own 400 names the range. A bare `!5` is
  // in this group on purpose: an exclusion subtracts, it cannot select alone (the
  // hint text therefore offers `1-,!5`, never `!5`).
  for (const v of ["0", "n1", "3-1", "9-12", "!6", "!5", "n5"]) {
    assert.equal(isPageRange(v), true, `"${v}" is valid grammar`);
  }

  // Both sentences must name the capability, or the user never learns `odd` exists.
  for (const s of [PDF_PAGES_HELP, PDF_PAGES_HINT]) {
    for (const word of ["odd", "even", "l"]) assert.ok(s.includes(word), `${word} missing from "${s}"`);
  }
  assert.ok(PDF_PAGES_HINT.includes("1-,!5"), "the hint must show an exclusion attached to an inclusion");
});
