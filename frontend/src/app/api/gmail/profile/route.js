import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '../../../../lib/google';
export const runtime = 'nodejs';
export async function GET(request) {
  try {
    const auth = await getAuthenticatedClient(request);
    if (!auth) return NextResponse.json({ success: true, data: { connected: false, email: null } });
    const profile = await google.gmail({ version: 'v1', auth: auth.oauth2Client }).users.getProfile({ userId: 'me' });
    return NextResponse.json({ success: true, data: { connected: true, email: profile.data.emailAddress || auth.email } });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'GMAIL_PROFILE_ERROR', message: error.message } }, { status: 502 });
  }
}
