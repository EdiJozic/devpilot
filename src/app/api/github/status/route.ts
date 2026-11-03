import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const configured = Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
  const connected = Boolean(request.cookies.get("devpilot_github_token")?.value);
  return NextResponse.json({ configured, connected });
}
