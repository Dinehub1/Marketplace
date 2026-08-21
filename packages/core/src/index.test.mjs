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
