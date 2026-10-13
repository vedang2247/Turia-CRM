import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { createOAuth2Client, STATE_COOKIE_NAME } from '../../../../lib/google';
export const runtime = 'nodejs';
export async function GET() {
  try {
    const state = crypto.randomBytes(16).toString('hex');
    const url = createOAuth2Client().generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: ['https://www.googleapis.com/auth/gmail.modify', 'https://www.googleapis.com/auth/userinfo.email'], state });
    const response = NextResponse.redirect(url);
    response.cookies.set(STATE_COOKIE_NAME, state, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 600 });
    return response;
  } catch (error) {
    const configured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    return NextResponse.json({
      success: false,
      error: {
        code: configured ? 'GOOGLE_OAUTH_ERROR' : 'GOOGLE_OAUTH_NOT_CONFIGURED',
        message: configured ? error.message : 'Configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in frontend/.env.local before connecting Gmail.',
      },
    }, { status: configured ? 502 : 503 });
  }
}
