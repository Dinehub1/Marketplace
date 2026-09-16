# Trending on GitHub, 2026-09-16 — what we could actually turn into product

Source: `github.com/trending` daily + weekly, read today, then every licence verified
through the GitHub API (`/repos/<owner>/<repo>`). Star counts are GitHub's own.
**Trending is not the same as useful**: the current lists are dominated by agent
tooling (superpowers 287k, spec-kit 137k, Agent-Reach 82k, firstmate 6k), which is
relevant to *our automation*, not to the app a customer opens.

## Licence-clean picks that fit our 28 products

| Repo | ★ | Licence | What we would build with it | Fit |
|---|---|---|---|---|
| **microsoft/markitdown** | 184,509 | **MIT** | Office/PDF/images → structured Markdown. Python, runs on this VM today. | Resume + ATS check (parse the CV), Hindi↔English document translation, bill/receipt extraction, lecture notes |
| **OpenBMB/VoxCPM** | 37,598 | **Apache-2.0** | Multilingual TTS with voice design | “Text to voice-over” (₹99/clip) — the product that has no engine today |
| **JustVugg/colibri** | 34,099 | **Apache-2.0** | Runs large MoE models on a CPU, experts streamed from disk (pure C, no GPU) | ₹0-cost text engine behind caption / bio / application writers, study helper — removes the API bill |
| **heygen-com/hyperframes** | 50,466 | **Apache-2.0** | HTML → video, built for automation | Reel/thumbnail and catalogue video for shopkeepers |
| **THU-MAIC/OpenMAIC** | 37,170 | **MIT** | Multi-agent interactive classroom | “Worksheet & quiz generator” (₹199/mo) |
| **Crosstalk-Solutions/project-nomad** | 37,162 | **Apache-2.0** | Offline-first knowledge/education server | Study helper that works with no signal — a real differentiator on a phone |
| **localsend/localsend** | 91,728 | **Apache-2.0** | Cross-platform AirDrop alternative | No product fit (needs both devices on one LAN); noted so nobody re-checks it |

## Excluded, with the reason recorded

- **debpalash/VoiceStudio** 31,249 — **AGPL-3.0** (the local ElevenLabs alternative we would otherwise want).
- **ever-co/ever-gauzy** 6,813 — **AGPL-3.0** (shop ERP/CRM).
- **Tencent/WeKnora** 24,487 — `NOASSERTION`: read its LICENSE before use.
- **ruvnet/RuView** 94,195 MIT — WiFi sensing; needs hardware access a phone app does not have.

## Recommended order (cheapest real capability first)

1. **markitdown** — small, MIT, Python, and it single-handedly gives document parsing to
   four catalogue products. Prototype: CV PDF → Markdown → keyword score, one real job.
2. **colibri** — biggest cost win. Test whether a small model streams acceptably on this
   box *without* starving the live site; if not, park it (the VM is shared).
3. **VoxCPM** — turns an unbuilt paid product (voice-over) into a shippable one, CPU
   permitting.
4. **OpenMAIC / project-nomad** — education products, only after the tools above ship.
5. **hyperframes** — video needs a renderer on a box already short of CPU; last.

## The lesson that shaped this list

Star count is not running capability. Filter every candidate through: *can this run on a
CPU-only box that also serves the live site, without a GPU and without a second DB?*
That question removed more candidates than the licence check did.
