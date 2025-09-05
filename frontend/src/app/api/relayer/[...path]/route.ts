import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG, ERROR_MESSAGES } from "@/lib/constants";

// Force dynamic to always fetch fresh data
export const dynamic = "force-dynamic";

// Allowed API endpoints for security
const ALLOWED_ENDPOINTS = [
  "createAccount",
  "isAccountCreated", 
  "send",
  "unclaim",
] as const;

function upstream(): string {
  const base = process.env.RELAYER_API_URL;
  if (!base) throw new Error("Missing server env RELAYER_API_URL");
  return base.replace(/\/$/, "");
}

function validatePath(path: string[]): boolean {
  if (!path || path.length === 0) return false;
  return ALLOWED_ENDPOINTS.includes(path[0] as typeof ALLOWED_ENDPOINTS[number]);
}

async function forward(req: NextRequest, path: string) {
  const url = new URL(req.url);
  try {
    const base = upstream();
    const target = `${base}/api/${path}${url.search ? url.search : ""}`;
    const init: RequestInit = {
      method: req.method,
      body: API_CONFIG.METHODS_WITHOUT_BODY.includes(req.method as typeof API_CONFIG.METHODS_WITHOUT_BODY[number]) ? undefined : await req.text(),
      headers: {
        "content-type": req.headers.get("content-type") || API_CONFIG.DEFAULT_CONTENT_TYPE,
      },
      cache: API_CONFIG.CACHE_POLICY,
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
    return NextResponse.json({ 
      error: ERROR_MESSAGES.API.UPSTREAM_FAILED, 
      message: msg, 
      hint: "Set RELAYER_API_URL in frontend/.env.local and restart dev server" 
    }, { status: 502 });
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  
  if (!validatePath(path)) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.API.PATH_NOT_ALLOWED, allowedEndpoints: ALLOWED_ENDPOINTS }, 
      { status: 403 }
    );
  }
  
  return forward(req, (path || []).join("/"));
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  
  if (!validatePath(path)) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.API.PATH_NOT_ALLOWED, allowedEndpoints: ALLOWED_ENDPOINTS }, 
      { status: 403 }
    );
  }
  
  return forward(req, (path || []).join("/"));
}

export async function OPTIONS() {
  // Same-origin calls; return 204
  return new NextResponse(null, { status: 204 });
}
