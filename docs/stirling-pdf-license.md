# Stirling-PDF: what its licence lets us take, and what we took

Researched 2026-09-16 for the PDF toolkit (`/api/job`, product `pdf-tools`).
Checked against the repository itself, not a blog: `Stirling-Tools/Stirling-PDF`,
92,222★, pushed 2026-09-15, not archived, `license.spdx_id = NOASSERTION`.

## The licence, read in full

`LICENSE` at the repository root is **MIT** (`Copyright (c) 2025 Stirling PDF Inc.`)
with carve-outs. Everything **outside** the listed directories is MIT. The listed
directories are licensed separately as "Stirling PDF User License", whose first
sentence is *"Production use of the Stirling PDF Software is only permitted with a
valid Stirling PDF User License."* That is a paid licence, not a permissive one.

Every carve-out directory named in `LICENSE` **exists** in the tree, so none of
these are theoretical:

| Path | Licence | Verdict for us |
| --- | --- | --- |
| `app/proprietary/` | Stirling PDF User License | out |
| `app/saas/` | Stirling PDF User License | out |
| `engine/` (Python) | Stirling PDF User License | **out** |
| `frontend/editor/src/{proprietary,desktop,saas,cloud,prototypes,portal,portal-saas}/` | Stirling PDF User License | out |
| `app/core/`, `app/common/`, rest of `frontend/editor/src/` | MIT | copyable with attribution |

`engine/` matters most: it is the Python side of their pipeline, i.e. the part
shaped most like our own `services/tools/worker.py`. It is **not** reusable.

## Decision

1. **No code is copied from this project into ours.** Not because the licence
   forbids all of it — `app/core` is MIT — but because that half is a Spring Boot
   Java service: it needs a JVM plus a Gradle build on a 2 vCPU box that also
   serves the live site, and our document engine is already pdfcpu (a single Go
   binary, no runtime). Reuse would be a rewrite of working code plus a resident
   JVM. `app/core` stays a read-only reference for how they solve a problem.
2. **What we did take is the vocabulary, not the code** — the job and parameter
   names a person who already knows that tool will expect. Interface names, and
   both implementations are documented publicly.
3. **Attribution**: none is required for a name-only reuse. If any `app/core`
   source is ever copied verbatim, the MIT notice must come with it.

## What that produced (`pdf-tools`, actions behind `/api/job`)

| Action | Parameters taken from their API | Engine |
| --- | --- | --- |
| `merge`, `split`, `compress` | pre-existing | pdfcpu |
| `rotate` | `angle` — a multiple of 90 (`RotationController`) | `pdfcpu rotate` |
| `page-numbers` | `position` — their 1..9 grid, 1 = top-left, 9 = bottom-right; text placeholders `{n}` / `{total}` (`PageNumbersController`) | `pdfcpu stamp` |

Their `position` grid is mapped onto pdfcpu's nine anchors (`1→tl … 9→br`) in
`services/tools/worker.py`; `{n}`/`{total}` are translated to pdfcpu's `%p`/`%P`
so a caller can use either dialect. `startingNumber` was **not** adopted: pdfcpu's
`%p` prints the real page number, so an arbitrary start offset cannot be honoured,
and a parameter we cannot implement is worse than a missing one.

Their Java `@RequestParam` names (`position`, `customText`, `fontColor`, `zeroPad`)
and the 1..9 mapping were read from the MIT-licensed
`app/core/src/main/java/stirling/software/SPDF/controller/api/**`.

## Pitfall found while wiring it up

pdfcpu's *default* text stamp is drawn rotated (placement matrix `0.5771 0.8167
-0.8167 0.5771`, ≈55°). Every stamp description we build therefore states `rot:0`
explicitly; without it the page numbers land diagonally across the page. Verified
by decompressing the output's object streams and reading back the drawn strings.
