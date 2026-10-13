export function buildRaw({ to, from, subject, body, inReplyTo, references }) {
  const encodedSubject = /^[\x00-\x7F]*$/.test(subject || '') ? subject : `=?UTF-8?B?${Buffer.from(subject || '').toString('base64')}?=`;
  const headers = [`From: ${from}`, `To: ${to}`, `Subject: ${encodedSubject}`, 'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: 8bit'];
  if (inReplyTo) headers.push(`In-Reply-To: ${inReplyTo}`);
  if (references) headers.push(`References: ${references}`);
  return Buffer.from(`${headers.join('\r\n')}\r\n\r\n${body || ''}`).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
