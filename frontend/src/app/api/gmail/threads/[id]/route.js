import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '../../../../../lib/google';
import { parseThread } from '../../../../../lib/gmailParse';
export const runtime = 'nodejs';
export async function GET(request, { params }) {
  try { const auth = await getAuthenticatedClient(request); if (!auth) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 }); const thread = await google.gmail({ version: 'v1', auth: auth.oauth2Client }).users.threads.get({ userId: 'me', id: params.id, format: 'full' }); return NextResponse.json({ ok: true, messages: parseThread(thread.data).messages }); }
  catch (error) { return NextResponse.json({ ok: false, error: error.message }, { status: 500 }); }
}
