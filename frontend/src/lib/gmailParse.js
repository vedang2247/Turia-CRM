import sanitizeHtml from 'sanitize-html';

export function getHeader(headers = [], name) {
  return headers.find((header) => header?.name?.toLowerCase() === name.toLowerCase())?.value || '';
}
export function decodeBase64Url(value = '') {
  return Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}
export function extractBody(payload) {
  let text = ''; let html = '';
  function walk(part) {
    if (!part) return;
    if (part.body?.data && part.mimeType === 'text/plain' && !text) text = decodeBase64Url(part.body.data);
    if (part.body?.data && part.mimeType === 'text/html' && !html) html = decodeBase64Url(part.body.data);
    (part.parts || []).forEach(walk);
  }
  walk(payload);
  return { bodyText: text || (html ? sanitizeHtml(html, { allowedTags: [] }) : payload?.snippet || ''), bodyHtml: html ? sanitizeHtml(html) : '' };
}
export function parseThread(thread) {
  return { messages: (thread?.messages || []).map((message) => {
    const headers = message.payload?.headers || [];
    const body = extractBody(message.payload);
    return { id: message.id, threadId: message.threadId || thread.id, from: getHeader(headers, 'From'), to: getHeader(headers, 'To'), subject: getHeader(headers, 'Subject') || '(No Subject)', date: getHeader(headers, 'Date') || new Date(Number(message.internalDate || Date.now())).toUTCString(), ...body, messageIdHeader: getHeader(headers, 'Message-ID'), references: getHeader(headers, 'References'), labelIds: message.labelIds || [] };
  }) };
}
export function parseThreadListItem(thread) {
  const message = thread?.messages?.[thread.messages.length - 1] || {};
  const headers = message.payload?.headers || [];
  return { id: thread.id, subject: getHeader(headers, 'Subject') || '(No Subject)', from: getHeader(headers, 'From'), snippet: thread.snippet || message.snippet || '', date: getHeader(headers, 'Date'), unread: (thread.messages || []).some((item) => item.labelIds?.includes('UNREAD')), messageCount: thread.messages?.length || 1 };
}
