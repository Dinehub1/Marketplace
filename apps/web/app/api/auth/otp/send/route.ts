import { NextRequest, NextResponse } from "next/server";
import { sendUnifiedOtp } from "@/lib/unified-auth";

const noStore = { "Cache-Control": "no-store" };

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const { status, data } = await sendUnifiedOtp(body);
  return NextResponse.json(data, { status, headers: noStore });
}
