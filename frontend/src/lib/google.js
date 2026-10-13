import { google } from 'googleapis';
import { sealData, unsealData } from 'iron-session';
import { cookies } from 'next/headers';

export const SESSION_COOKIE_NAME = 'gmail_session';
export const STATE_COOKIE_NAME = 'oauth_state';
const PASSWORD = process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_crm_inbox_session_secret_2026';
const TTL = 7 * 24 * 60 * 60;

export function createOAuth2Client() {
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!id || !secret) throw new Error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
  return new google.auth.OAuth2(id, secret, process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback');
}

export const sealSession = (data) => sealData(data, { password: PASSWORD, ttl: TTL });
export async function getSessionFromCookie(request) {
  const raw = request?.cookies?.get(SESSION_COOKIE_NAME)?.value || (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!raw) return null;
  try { return await unsealData(raw, { password: PASSWORD }); } catch { return null; }
}
export async function saveSessionToCookie(response, data) {
  response.cookies.set(SESSION_COOKIE_NAME, await sealSession(data), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: TTL });
}
export function clearSessionCookie(response) { response.cookies.set(SESSION_COOKIE_NAME, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 }); }
export function clearStateCookie(response) { response.cookies.set(STATE_COOKIE_NAME, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 }); }

export async function getAuthenticatedClient(request) {
  const session = await getSessionFromCookie(request);
  if (!session?.access_token && !session?.refresh_token) return null;
  const client = createOAuth2Client();
  client.setCredentials(session);
  return { oauth2Client: client, email: session.email };
}
