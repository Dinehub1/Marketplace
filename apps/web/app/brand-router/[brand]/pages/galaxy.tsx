"use client";

import { useEffect, useRef } from "react";

/**
 * Obsidian vault "galaxy" - a force-directed map of the note graph.
 *
 * Rendered on a canvas rather than shipped as an image so it stays crisp at any
 * width and can be re-derived from the vault. Data is embedded (71 notes / 177
 * links + title-mentions) because it changes only when the vault does; the
 * vault lives on the same box, at C:\\Users\\Administrator\\Documents\\Obsidian Vault.
 */

const NODES = [{"i": 0, "l": "Welcome", "d": 3, "c": "#94a3b8"}, {"i": 1, "l": "24x7-Agent-Architecture", "d": 6, "c": "#34d399"}, {"i": 2, "l": "2026-07-rollup", "d": 7, "c": "#fb7185"}, {"i": 3, "l": "2026-06-19", "d": 13, "c": "#67e8f9"}, {"i": 4, "l": "2026-06-20", "d": 6, "c": "#67e8f9"}, {"i": 5, "l": "2026-06-21", "d": 6, "c": "#67e8f9"}, {"i": 6, "l": "2026-07-01", "d": 11, "c": "#67e8f9"}, {"i": 7, "l": "daily-memory-dump-2026-06-", "d": 9, "c": "#67e8f9"}, {"i": 8, "l": "daily-memory-dump-2026-06-", "d": 14, "c": "#67e8f9"}, {"i": 9, "l": "daily-memory-dump-2026-07-", "d": 21, "c": "#67e8f9"}, {"i": 10, "l": "infra-health-2026-07-01", "d": 3, "c": "#67e8f9"}, {"i": 11, "l": "infra-health-2026-08-08", "d": 2, "c": "#67e8f9"}, {"i": 12, "l": "infra-health-2026-08-09", "d": 3, "c": "#67e8f9"}, {"i": 13, "l": "infra-health-2026-08-10", "d": 3, "c": "#67e8f9"}, {"i": 14, "l": "infra-health-2026-08-11", "d": 3, "c": "#67e8f9"}, {"i": 15, "l": "infra-health-2026-08-12", "d": 3, "c": "#67e8f9"}, {"i": 16, "l": "infra-health-2026-08-22", "d": 2, "c": "#67e8f9"}, {"i": 17, "l": "infra-health-2026-08-23", "d": 2, "c": "#67e8f9"}, {"i": 18, "l": "infra-health-2026-09-13", "d": 1, "c": "#67e8f9"}, {"i": 19, "l": "orchestrator-log-2026-07-0", "d": 10, "c": "#67e8f9"}, {"i": 20, "l": "orchestrator-log-2026-08-0", "d": 3, "c": "#67e8f9"}, {"i": 21, "l": "orchestrator-log-2026-08-0", "d": 2, "c": "#67e8f9"}, {"i": 22, "l": "orchestrator-log-2026-08-1", "d": 2, "c": "#67e8f9"}, {"i": 23, "l": "orchestrator-log-2026-08-1", "d": 2, "c": "#67e8f9"}, {"i": 24, "l": "orchestrator-log-2026-08-1", "d": 2, "c": "#67e8f9"}, {"i": 25, "l": "orchestrator-log-2026-08-2", "d": 1, "c": "#67e8f9"}, {"i": 26, "l": "orchestrator-log-2026-08-2", "d": 1, "c": "#67e8f9"}, {"i": 27, "l": "orchestrator-log-2026-09-1", "d": 0, "c": "#67e8f9"}, {"i": 28, "l": "vault-health-2026-07-01", "d": 19, "c": "#67e8f9"}, {"i": 29, "l": "vault-health-2026-08-08", "d": 3, "c": "#67e8f9"}, {"i": 30, "l": "vault-health-2026-08-09", "d": 3, "c": "#67e8f9"}, {"i": 31, "l": "vault-health-2026-08-10", "d": 3, "c": "#67e8f9"}, {"i": 32, "l": "vault-health-2026-08-11", "d": 4, "c": "#67e8f9"}, {"i": 33, "l": "vault-health-2026-08-12", "d": 3, "c": "#67e8f9"}, {"i": 34, "l": "vault-health-2026-08-22", "d": 4, "c": "#67e8f9"}, {"i": 35, "l": "vault-health-2026-08-23", "d": 3, "c": "#67e8f9"}, {"i": 36, "l": "vault-health-2026-09-13", "d": 2, "c": "#67e8f9"}, {"i": 37, "l": "add-3-knowledge-base-entri", "d": 1, "c": "#c084fc"}, {"i": 38, "l": "paisaflow-landing-page-202", "d": 0, "c": "#c084fc"}, {"i": 39, "l": "2026-08-08", "d": 6, "c": "#c084fc"}, {"i": 40, "l": "2026-08-09", "d": 5, "c": "#c084fc"}, {"i": 41, "l": "2026-08-10", "d": 5, "c": "#c084fc"}, {"i": 42, "l": "2026-08-11", "d": 4, "c": "#c084fc"}, {"i": 43, "l": "2026-08-12", "d": 5, "c": "#c084fc"}, {"i": 44, "l": "2026-08-22", "d": 3, "c": "#c084fc"}, {"i": 45, "l": "2026-08-23", "d": 4, "c": "#c084fc"}, {"i": 46, "l": "2026-06-18", "d": 3, "c": "#c084fc"}, {"i": 47, "l": "2026-06-19", "d": 13, "c": "#c084fc"}, {"i": 48, "l": "2026-06-20", "d": 6, "c": "#c084fc"}, {"i": 49, "l": "2026-06-22", "d": 10, "c": "#c084fc"}, {"i": 50, "l": "README", "d": 6, "c": "#c084fc"}, {"i": 51, "l": "2026-08-08", "d": 6, "c": "#c084fc"}, {"i": 52, "l": "2026-08-09", "d": 5, "c": "#c084fc"}, {"i": 53, "l": "2026-08-10", "d": 5, "c": "#c084fc"}, {"i": 54, "l": "2026-08-11", "d": 4, "c": "#c084fc"}, {"i": 55, "l": "2026-08-12", "d": 9, "c": "#c084fc"}, {"i": 56, "l": "seo-aadhaar-2026-08-09", "d": 0, "c": "#c084fc"}, {"i": 57, "l": "seo-aadhaar-2026-08-10", "d": 0, "c": "#c084fc"}, {"i": 58, "l": "seo-aadhaar-2026-08-11", "d": 1, "c": "#c084fc"}, {"i": 59, "l": "seo-aadhaar-2026-08-22", "d": 0, "c": "#c084fc"}, {"i": 60, "l": "seo-pan-2026-08-09", "d": 0, "c": "#c084fc"}, {"i": 61, "l": "seo-pan-2026-08-10", "d": 0, "c": "#c084fc"}, {"i": 62, "l": "README", "d": 5, "c": "#c084fc"}, {"i": 63, "l": "README", "d": 3, "c": "#c084fc"}, {"i": 64, "l": "active-goals", "d": 17, "c": "#fbbf24"}, {"i": 65, "l": "agent-protocol", "d": 4, "c": "#fbbf24"}, {"i": 66, "l": "blocked-items", "d": 12, "c": "#fbbf24"}, {"i": 67, "l": "metrics-dashboard", "d": 9, "c": "#fbbf24"}, {"i": 68, "l": "project-registry", "d": 11, "c": "#fbbf24"}, {"i": 69, "l": "query-paisaflow-validation", "d": 3, "c": "#fbbf24"}, {"i": 70, "l": "vault-health-2026-07-01-18", "d": 4, "c": "#fbbf24"}];
const EDGES = [[4, 8], [34, 43], [8, 0], [6, 49], [13, 53], [51, 64], [2, 65], [25, 44], [5, 7], [3, 7], [17, 45], [30, 52], [6, 67], [2, 67], [9, 62], [32, 58], [47, 68], [47, 69], [33, 43], [8, 62], [19, 49], [9, 46], [49, 68], [22, 53], [29, 51], [18, 36], [39, 66], [28, 66], [8, 46], [19, 67], [23, 42], [15, 55], [40, 52], [9, 66], [10, 19], [2, 68], [1, 68], [55, 66], [49, 65], [7, 48], [41, 64], [22, 41], [34, 55], [1, 9], [3, 55], [49, 67], [50, 68], [21, 40], [23, 54], [1, 49], [53, 64], [4, 7], [7, 47], [7, 28], [9, 50], [6, 19], [14, 32], [6, 66], [12, 30], [2, 19], [1, 67], [8, 50], [12, 40], [33, 55], [32, 42], [47, 62], [13, 41], [28, 48], [2, 6], [5, 28], [3, 47], [3, 28], [64, 66], [3, 69], [70, 67], [9, 48], [3, 64], [31, 53], [19, 66], [32, 54], [14, 54], [8, 48], [34, 44], [47, 66], [20, 39], [43, 55], [40, 64], [21, 52], [49, 66], [10, 28], [16, 44], [5, 67], [11, 39], [52, 64], [16, 34], [4, 48], [7, 8], [7, 9], [1, 66], [12, 52], [47, 50], [35, 45], [14, 42], [28, 70], [51, 66], [24, 43], [26, 45], [47, 55], [6, 28], [15, 33], [42, 54], [5, 68], [3, 68], [6, 64], [4, 28], [5, 8], [3, 8], [5, 9], [3, 9], [62, 68], [4, 64], [46, 50], [4, 9], [29, 39], [20, 29], [7, 0], [28, 68], [28, 47], [39, 64], [28, 64], [19, 47], [19, 28], [9, 68], [30, 40], [9, 47], [9, 28], [9, 63], [3, 19], [19, 64], [6, 70], [3, 66], [31, 41], [9, 64], [8, 47], [8, 28], [2, 70], [8, 63], [28, 49], [28, 65], [55, 64], [47, 64], [35, 37], [6, 10], [8, 9], [9, 49], [9, 65], [48, 64], [28, 67], [20, 51], [63, 68], [8, 49], [24, 55], [13, 31], [17, 35], [9, 67], [15, 43], [36, 45], [6, 69], [2, 28], [3, 50], [41, 53], [3, 62], [11, 51], [6, 9], [9, 0], [39, 51], [1, 64]];

export function GalaxyPage() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const W = 1800, H = 1120;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.scale(dpr, dpr);

    const nodes = NODES.map((n) => ({ ...n, x: W / 2 + (Math.random() - 0.5) * 900, y: H / 2 + (Math.random() - 0.5) * 620, vx: 0, vy: 0 }));
    // force simulation (deterministic enough: same shape, slight organic jitter)
    for (let it = 0; it < 560; it++) {
      const k = 1 - it / 560;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d2 = dx * dx + dy * dy || 0.01, d = Math.sqrt(d2);
          const rep = 5200 / d2, fx = (dx / d) * rep, fy = (dy / d) * rep;
          a.vx -= fx; a.vy -= fy; b.vx += fx; b.vy += fy;
        }
      }
      for (const [i, j] of EDGES) {
        const a = nodes[i], b = nodes[j];
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.01;
        const f = (d - 150) * 0.010, fx = (dx / d) * f, fy = (dy / d) * f;
        a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
      }
      for (const n of nodes) {
        n.vx += (W / 2 - n.x) * 0.0016; n.vy += (H / 2 - n.y) * 0.0022;
        n.x += n.vx * k; n.y += n.vy * k; n.vx *= 0.82; n.vy *= 0.82;
        n.x = Math.max(70, Math.min(W - 70, n.x)); n.y = Math.max(70, Math.min(H - 70, n.y));
      }
    }
    const bg = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, 1180);
    bg.addColorStop(0, "#0d1530"); bg.addColorStop(0.55, "#070a18"); bg.addColorStop(1, "#03040a");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 420; i++) {
      ctx.globalAlpha = 0.05 + Math.random() * 0.35; ctx.fillStyle = "#cbd5ff";
      ctx.beginPath(); ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 1.25, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const [i, j] of EDGES) {
      const a = nodes[i], b = nodes[j];
      const grd = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      grd.addColorStop(0, a.c + "55"); grd.addColorStop(1, b.c + "55");
      ctx.strokeStyle = grd; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    for (const n of nodes) {
      const r = 3.2 + Math.min(n.d, 12) * 0.85;
      ctx.shadowColor = n.c; ctx.shadowBlur = 14 + Math.min(n.d, 10) * 2.2;
      ctx.fillStyle = n.c; ctx.globalAlpha = 0.95;
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 7); ctx.fill();
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      if (n.d >= 3) {
        ctx.font = "13px Segoe UI, sans-serif"; ctx.fillStyle = "#e2e8f8"; ctx.globalAlpha = 0.9;
        ctx.fillText(n.l, n.x + r + 5, n.y + 4); ctx.globalAlpha = 1;
      }
    }
    ctx.font = "bold 34px Segoe UI, sans-serif"; ctx.fillStyle = "#f1f5ff";
    ctx.fillText("Obsidian Vault - galaxy view", 46, 66);
    ctx.font = "18px Segoe UI, sans-serif"; ctx.fillStyle = "#93a4c8";
    ctx.fillText(NODES.length + " notes - " + EDGES.length + " links/mentions - rendered from the vault on the VM", 46, 96);
    let lx = 46;
    for (const name of Object.keys({"Notes": "#67e8f9", "Projects": "#c084fc", "Shared": "#fbbf24", "Architecture": "#34d399", "Archive": "#fb7185", "root": "#94a3b8"})) {
      const col = ({"Notes": "#67e8f9", "Projects": "#c084fc", "Shared": "#fbbf24", "Architecture": "#34d399", "Archive": "#fb7185", "root": "#94a3b8"})[name] || "#94a3b8";
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(lx + 7, H - 40, 7, 0, 7); ctx.fill();
      ctx.fillStyle = "#cbd5e1"; ctx.font = "16px Segoe UI, sans-serif";
      ctx.fillText(name, lx + 22, H - 34);
      lx += 34 + ctx.measureText(name).width;
    }
  }, []);

  return (
    <main className="min-h-screen bg-[#03040a]">
      <div className="mx-auto w-full max-w-[1800px] px-4 py-6">
        <canvas ref={ref} className="w-full rounded-2xl border border-white/10" style={{ aspectRatio: "1800 / 1120" }} />
        <p className="mt-3 text-xs text-slate-400">
          Live view of the knowledge vault that runs this platform: {NODES.length} notes, {EDGES.length} links and title
          mentions. Colours are folders; brighter, larger stars are the most-connected notes.
        </p>
      </div>
    </main>
  );
}
