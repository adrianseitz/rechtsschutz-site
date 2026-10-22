import { NextResponse } from "next/server";
import { sessionCookie } from "@/lib/server/adminAuth";
import { jsonError, originAllowed } from "@/lib/server/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!originAllowed(req)) return jsonError(403, "forbidden");
  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookie("", 0));
  return res;
}
