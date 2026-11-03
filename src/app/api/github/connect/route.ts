import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

export async function GET(request: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId || !process.env.GITHUB_CLIENT_SECRET) {
    return NextResponse.redirect(new URL("/?github=not-configured", request.url));
  }
  const state = randomBytes(24).toString("hex");
  const redirectUri = process.env.GITHUB_CALLBACK_URL ?? new URL("/api/github/callback", request.url).toString();
  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("scope", "read:user repo");
  authorize.searchParams.set("state", state);
  const response = NextResponse.redirect(authorize);
  response.cookies.set("devpilot_github_oauth_state", state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 600, path: "/" });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ disconnected: true });
  response.cookies.set("devpilot_github_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/api/github",
  });
  return response;
}
