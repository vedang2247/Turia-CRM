import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { createOAuth2Client, clearStateCookie, getSessionFromCookie, saveSessionToCookie, STATE_COOKIE_NAME } from '../../../../../lib/google';
export const runtime = 'nodejs';
export async function GET(request) {
  const url = new URL(request.url); const code = url.searchParams.get('code'); const state = url.searchParams.get('state');
  if (!code || state !== request.cookies.get(STATE_COOKIE_NAME)?.value) return NextResponse.redirect(new URL('/connections?error=OAuth+state+validation+failed', request.url));
  try {
    const client = createOAuth2Client(); const { tokens } = await client.getToken(code); client.setCredentials(tokens);
    const profile = await google.oauth2({ version: 'v2', auth: client }).userinfo.get();
    const existing = await getSessionFromCookie(request);
    const response = NextResponse.redirect(new URL('/connections?gmail=connected', request.url));
    await saveSessionToCookie(response, { ...tokens, refresh_token: tokens.refresh_token || existing?.refresh_token, email: profile.data.email });
    clearStateCookie(response); return response;
  } catch (error) { return NextResponse.redirect(new URL(`/connections?error=${encodeURIComponent(error.message)}`, request.url)); }
}
