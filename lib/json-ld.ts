// Safe JSON for inline <script type="application/ld+json"> tags.
//
// JSON.stringify alone is NOT safe to splice into a <script>: a value like
// `</script><script>alert(1)</script>` passes through the JSON string untouched
// and the HTML parser closes the tag early. Escaping the three characters the
// HTML raw-text parser cares about (& < >) plus the two JS line separators
// (U+2028/U+2029) keeps the output valid JSON-LD and inert to the parser.
export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/&/g, "\\u0026")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}