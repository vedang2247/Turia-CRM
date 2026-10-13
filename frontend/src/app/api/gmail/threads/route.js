import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '../../../../lib/google';
import { parseThreadListItem } from '../../../../lib/gmailParse';
export const runtime = 'nodejs';
export async function GET(request) {
  try {
    const auth = await getAuthenticatedClient(request); if (!auth) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    const params = new URL(request.url).searchParams; const query = params.get('q') || ''; const list = await google.gmail({ version: 'v1', auth: auth.oauth2Client }).users.threads.list({ userId: 'me', maxResults: 20, pageToken: params.get('pageToken') || undefined, ...(query ? { q: query } : { labelIds: ['INBOX'] }) });
    const gmail = google.gmail({ version: 'v1', auth: auth.oauth2Client }); const threads = await Promise.all((list.data.threads || []).map(async (item) => parseThreadListItem((await gmail.users.threads.get({ userId: 'me', id: item.id, format: 'metadata', metadataHeaders: ['From', 'Subject', 'Date'] })).data)));
    return NextResponse.json({ ok: true, threads, nextPageToken: list.data.nextPageToken || null });
  } catch (error) { return NextResponse.json({ ok: false, error: error.message }, { status: 500 }); }
}
