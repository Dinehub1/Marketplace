import { NextRequest, NextResponse } from "next/server";
import { verifyUnifiedOtp } from "@/lib/unified-auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const noStore = { "Cache-Control": "no-store" };

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const rawTarget = String(body.identifier ?? body.phone ?? body.email ?? "").trim();

  if (rawTarget) {
    const rl = rateLimit(`verify:${clientIp(req)}:${rawTarget}`, 10, 60 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        {
          status: 429,
          headers: { ...noStore, "Retry-After": String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) },
        }
      );
    }
  }

  const { status, data } = await verifyUnifiedOtp(body);
  return NextResponse.json(data, { status, headers: noStore });
}
