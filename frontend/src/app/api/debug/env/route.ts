import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const raw = process.env.RELAYER_API_URL || "";
  const masked = raw ? raw.replace(/([^:]{0,}?:\/\/)?(.{2}).+(.{6})$/, (_, pfx, a, b) => `${pfx ?? ""}${a}…${b}`) : "";
  return NextResponse.json({
    hasEnv: !!raw,
    RELAYER_API_URL_masked: masked,
  });
}

