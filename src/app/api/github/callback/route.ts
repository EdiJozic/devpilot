import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = request.cookies.get("devpilot_github_oauth_state")?.value;
  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/?github=auth-error", request.url));
  }
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/?github=not-configured", request.url));
  }

  try {
    const exchange = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!exchange.ok) {
      console.error("GitHub OAuth exchange failed:", exchange.status, await exchange.text());
      return NextResponse.redirect(new URL("/?github=auth-error", request.url));
    }
    const tokenData = await exchange.json();
    if (typeof tokenData.access_token !== "string") {
      console.error("GitHub OAuth response did not contain an access token.");
      return NextResponse.redirect(new URL("/?github=auth-error", request.url));
    }
    const response = NextResponse.redirect(new URL("/?github=connected", request.url));
    response.cookies.set("devpilot_github_token", tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/api/github",
    });
    response.cookies.delete("devpilot_github_oauth_state");
    return response;
  } catch (error) {
    console.error("GitHub OAuth callback failed:", error);
    return NextResponse.redirect(new URL("/?github=auth-error", request.url));
  }
}
