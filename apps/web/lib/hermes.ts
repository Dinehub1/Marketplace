import { existsSync, readFileSync } from "fs";
import path from "path";

export type GatewayStatus = {
  running: boolean;
  activeAgents: number;
  platforms: { name: string; state: string }[];
  updatedAt: string | null;
};

/** Read the background agent gateway state file (the app runs on the same VM). */
export function getGatewayStatus(): GatewayStatus {
  try {
    const home = process.env.USERPROFILE || "C:\\Users\\Administrator";
    const brandCollabsPath = path.join(home, "AppData", "Local", "brandcollabs", "gateway_state.json");
    const hermesPath = path.join(home, "AppData", "Local", "hermes", "gateway_state.json");
    const p = existsSync(brandCollabsPath) ? brandCollabsPath : hermesPath;
    const j = JSON.parse(readFileSync(p, "utf8"));
    return {
      running: j.gateway_state === "running",
      activeAgents: j.active_agents ?? 0,
      platforms: Object.entries(j.platforms ?? {}).map(([name, v]) => ({
        name,
        state: (v as { state?: string } | null)?.state ?? "unknown",
      })),
      updatedAt: j.updated_at ?? null,
    };
  } catch {
    return { running: false, activeAgents: 0, platforms: [], updatedAt: null };
  }
}
