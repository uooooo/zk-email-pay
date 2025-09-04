import { NextRequest, NextResponse } from "next/server";

// Force dynamic to always fetch fresh data
export const dynamic = "force-dynamic";

function upstream(): string {
  const base = process.env.RELAYER_API_URL;
  if (!base) throw new Error("Missing server env RELAYER_API_URL");
  return base.replace(/\/$/, "");
}

async function forward(req: NextRequest, path: string) {
  const url = new URL(req.url);
  try {
    const base = upstream();
    const target = `${base}/api/${path}${url.search ? url.search : ""}`;
    const init: RequestInit = {
      method: req.method,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : await req.text(),
      headers: {
        "content-type": req.headers.get("content-type") || "application/json",
      },
      cache: "no-store",
    };

    const res = await fetch(target, init);
    const data = await res.arrayBuffer();
    return new NextResponse(data, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") || "text/plain; charset=utf-8",
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Upstream request failed", message: msg, hint: "Set RELAYER_API_URL in frontend/.env.local and restart dev server" }, { status: 502 });
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, (path || []).join("/"));
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, (path || []).join("/"));
}

export async function OPTIONS() {
  // Same-origin calls; return 204
  return new NextResponse(null, { status: 204 });
}
