import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '../../../../lib/google';
import { buildRaw } from '../../../../lib/mime';
export const runtime = 'nodejs';
export async function POST(request) {
  try {
    const auth = await getAuthenticatedClient(request); if (!auth) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    const { to, subject, body, threadId, inReplyTo, references } = await request.json();
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) || !body?.trim()) return NextResponse.json({ ok: false, error: 'Recipient and non-empty body are required.' }, { status: 400 });
    const result = await google.gmail({ version: 'v1', auth: auth.oauth2Client }).users.messages.send({ userId: 'me', requestBody: { raw: buildRaw({ to, from: auth.email, subject: subject || '(No Subject)', body, inReplyTo, references }), threadId: threadId || undefined } });
    return NextResponse.json({ ok: true, id: result.data.id, threadId: result.data.threadId });
  } catch (error) { return NextResponse.json({ ok: false, error: error.message }, { status: 500 }); }
}
